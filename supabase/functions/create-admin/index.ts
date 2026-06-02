// =====================================================================
// Supabase Edge Function: create-admin
//
// Atomically creates:
//   1. A new auth.users entry with the admin's real email + password
//   2. A matching admins table row using the same UUID
//
// Caller authentication:
//   - Must be authenticated super_admin (is_active = true)
//   - Normal admins CANNOT create other admins
//
// Created admin:
//   - role is always 'admin' (super_admins are never created via API,
//     must be added manually in DB for safety)
//   - assigned_pincodes is required, must have at least 1 pincode
//
// Deploy:
//   supabase functions deploy create-admin
//
// Required secrets (auto-injected by Supabase platform):
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
// =====================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[0-9]{8,15}$/;
const PINCODE_REGEX = /^[0-9]{6}$/;

function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

function errorResponse(message, status = 400, details = null) {
    const body = { success: false, error: message };
    if (details) body.details = details;
    return jsonResponse(body, status);
}

serve(async (req) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return errorResponse('Method not allowed', 405);
    }

    try {
        // ---------------------------------------------------------------
        // 1. ENV & CLIENTS
        // ---------------------------------------------------------------
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        if (!supabaseUrl || !serviceRoleKey) {
            return errorResponse('Server misconfiguration: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY', 500);
        }

        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        // ---------------------------------------------------------------
        // 2. AUTHENTICATE CALLER
        // ---------------------------------------------------------------
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return errorResponse('Missing authorization header', 401);
        }

        // Extract raw JWT from "Bearer <token>" and verify via admin client
        const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
        if (!jwt) {
            return errorResponse('Missing JWT in authorization header', 401);
        }

        const { data: { user: callerAuthUser }, error: callerError } =
            await adminClient.auth.getUser(jwt);
        if (callerError || !callerAuthUser) {
            return errorResponse(
                `Unauthorized — ${callerError?.message || 'invalid session'}`,
                401
            );
        }

        // ---------------------------------------------------------------
        // 3. VERIFY CALLER IS AN ACTIVE SUPER_ADMIN
        // ---------------------------------------------------------------
        const { data: callerAdmin, error: callerAdminError } = await adminClient
            .from('admins')
            .select('id, role, is_active')
            .eq('id', callerAuthUser.id)
            .single();

        if (callerAdminError || !callerAdmin) {
            return errorResponse('Caller is not an admin', 403);
        }
        if (!callerAdmin.is_active) {
            return errorResponse('Your admin account is deactivated', 403);
        }
        if (callerAdmin.role !== 'super_admin') {
            return errorResponse('Only super admins can create new admins', 403);
        }

        // ---------------------------------------------------------------
        // 4. PARSE & VALIDATE INPUT
        // ---------------------------------------------------------------
        let body;
        try {
            body = await req.json();
        } catch {
            return errorResponse('Invalid JSON body', 400);
        }

        const {
            name,
            email,
            phone,
            password,
            assigned_pincodes,
            assigned_state = null,
        } = body || {};

        if (!name || typeof name !== 'string' || name.trim().length < 2) {
            return errorResponse('Name is required (min 2 characters)');
        }
        if (!email || !EMAIL_REGEX.test(email)) {
            return errorResponse('Valid email is required');
        }
        if (!phone || !PHONE_REGEX.test(phone)) {
            return errorResponse('Phone is required (8–15 digits, optional leading +)');
        }
        if (!password || typeof password !== 'string' || password.length < 8) {
            return errorResponse('Password is required (min 8 characters)');
        }
        if (!Array.isArray(assigned_pincodes) || assigned_pincodes.length === 0) {
            return errorResponse('At least one assigned pincode is required');
        }
        for (const pc of assigned_pincodes) {
            if (!PINCODE_REGEX.test(pc)) {
                return errorResponse(`Invalid pincode: "${pc}" (must be exactly 6 digits)`);
            }
        }

        const normalizedEmail = email.toLowerCase().trim();

        // ---------------------------------------------------------------
        // 5. PRE-FLIGHT UNIQUENESS CHECKS
        // ---------------------------------------------------------------
        const { data: emailClash } = await adminClient
            .from('admins')
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle();
        if (emailClash) {
            return errorResponse('An admin with this email already exists', 409);
        }

        const { data: phoneClash } = await adminClient
            .from('admins')
            .select('id')
            .eq('phone', phone)
            .maybeSingle();
        if (phoneClash) {
            return errorResponse('An admin with this phone number already exists', 409);
        }

        // Also check auth.users — email may be in use by a non-admin already
        // (Supabase will reject createUser anyway, but a friendlier error helps)
        // We skip the explicit check since Supabase enforces auth.users.email uniqueness.

        // ---------------------------------------------------------------
        // 6. CREATE AUTH USER
        // ---------------------------------------------------------------
        const { data: createdAuth, error: createAuthError } = await adminClient.auth.admin.createUser({
            email: normalizedEmail,
            password,
            email_confirm: true,    // auto-confirm — admin can log in immediately
            user_metadata: {
                role: 'admin',
                name,
            },
        });

        if (createAuthError || !createdAuth?.user) {
            const msg = createAuthError?.message || 'Failed to create auth user';
            return errorResponse(`Auth user creation failed: ${msg}`, 500);
        }

        const newUserId = createdAuth.user.id;

        // ---------------------------------------------------------------
        // 7. INSERT ADMIN ROW (uses same UUID as auth user)
        // ---------------------------------------------------------------
        const adminRow = {
            id: newUserId,
            name: name.trim(),
            email: normalizedEmail,
            phone,
            role: 'admin',
            assigned_pincodes,
            assigned_state,
            is_active: true,
        };

        const { data: createdAdmin, error: createAdminError } = await adminClient
            .from('admins')
            .insert(adminRow)
            .select()
            .single();

        if (createAdminError) {
            // ROLLBACK: delete the auth user we just created
            try {
                await adminClient.auth.admin.deleteUser(newUserId);
            } catch (rollbackErr) {
                console.error('Rollback failed:', rollbackErr);
            }
            return errorResponse(
                `Admin row creation failed: ${createAdminError.message}`,
                500,
                { hint: 'Auth user was rolled back. Please retry.' }
            );
        }

        // ---------------------------------------------------------------
        // 8. SUCCESS — return credentials (super_admin shares with new admin)
        // ---------------------------------------------------------------
        return jsonResponse({
            success: true,
            admin: {
                id: createdAdmin.id,
                name: createdAdmin.name,
                email: createdAdmin.email,
                phone: createdAdmin.phone,
                role: createdAdmin.role,
                assigned_pincodes: createdAdmin.assigned_pincodes,
                assigned_state: createdAdmin.assigned_state,
            },
            credentials: {
                login_email: normalizedEmail,
                password,
            },
            message: 'Admin created successfully. Share the credentials with the new admin.',
        });

    } catch (err) {
        return errorResponse(`Unexpected error: ${err?.message ?? String(err)}`, 500);
    }
});