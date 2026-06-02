// =====================================================================
// Supabase Edge Function: create-cleaner
//
// Atomically creates:
//   1. A new auth.users entry with the cleaner's login email + password
//   2. A matching cleaners table row using the same UUID
//
// Caller authentication:
//   - Must be authenticated (super_admin or admin)
//   - admins.is_active must be true
//   - Normal admin: the new cleaner's pincode must be in admin's assigned_pincodes
//   - super_admin: no pincode restriction
//
// Email convention:
//   - Admin provides a username (e.g. "rauhan001")
//   - Backend auto-appends "@zynkly.com" → rauhan001@zynkly.com
//
// Deploy:
//   supabase functions deploy create-cleaner
//
// Required secrets (set via supabase secrets set ...):
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - SUPABASE_ANON_KEY
// =====================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EMAIL_DOMAIN = '@zynkly.com';
const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/i;        // letters + digits + underscore, 3-30 chars
const PHONE_REGEX = /^[+]?[0-9]{8,15}$/;            // 8-15 digits, optional leading +
const PINCODE_REGEX = /^[0-9]{6}$/;                 // exactly 6 digits (India)

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

    // Service-role client — for privileged operations (creating auth users, inserting cleaner rows)
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

    // adminClient can verify any JWT since it has service_role privileges
    const { data: { user: callerAuthUser }, error: callerError } = await adminClient.auth.getUser(jwt);
    if (callerError || !callerAuthUser) {
      return errorResponse(`Unauthorized — ${callerError?.message || 'invalid session'}`, 401);
    }

    // ---------------------------------------------------------------
    // 3. VERIFY CALLER IS AN ACTIVE ADMIN
    // ---------------------------------------------------------------
    const { data: callerAdmin, error: callerAdminError } = await adminClient
      .from('admins')
      .select('id, role, is_active, assigned_pincodes')
      .eq('id', callerAuthUser.id)
      .single();

    if (callerAdminError || !callerAdmin) {
      return errorResponse('Caller is not an admin', 403);
    }
    if (!callerAdmin.is_active) {
      return errorResponse('Your admin account is deactivated', 403);
    }
    if (callerAdmin.role !== 'super_admin' && callerAdmin.role !== 'admin') {
      return errorResponse('Insufficient role privileges', 403);
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
      phone,
      username,            // e.g. "rauhan001" — backend appends @zynkly.com
      password,
      pincode,
      // optional fields
      transport = null,
      state = null,
      city = null,
      experience = '1 yr exp',
    } = body || {};

    // Required fields
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return errorResponse('Name is required (min 2 characters)');
    }
    if (!phone || !PHONE_REGEX.test(phone)) {
      return errorResponse('Phone is required (8–15 digits, optional leading +)');
    }
    if (!username || !USERNAME_REGEX.test(username)) {
      return errorResponse('Username is required (3–30 chars, letters/digits/underscore only)');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return errorResponse('Password is required (min 6 characters)');
    }
    if (!pincode || !PINCODE_REGEX.test(pincode)) {
      return errorResponse('Pincode is required (exactly 6 digits)');
    }

    // Construct full email
    const email = `${username.toLowerCase()}${EMAIL_DOMAIN}`;

    // ---------------------------------------------------------------
    // 5. PINCODE SCOPE CHECK (admin can only create cleaners in their pincodes)
    // ---------------------------------------------------------------
    if (callerAdmin.role === 'admin') {
      const assigned = callerAdmin.assigned_pincodes || [];
      if (!assigned.includes(pincode)) {
        return errorResponse(
          `You do not have permission to create cleaners in pincode ${pincode}`,
          403
        );
      }
    }

    // ---------------------------------------------------------------
    // 6. PRE-FLIGHT UNIQUENESS CHECKS
    // ---------------------------------------------------------------
    // Phone uniqueness — cleaners.phone has UNIQUE constraint
    const { data: phoneClash } = await adminClient
      .from('cleaners')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    if (phoneClash) {
      return errorResponse('A cleaner with this phone number already exists', 409);
    }

    // Email uniqueness — cleaners.email has UNIQUE partial index
    const { data: emailClash } = await adminClient
      .from('cleaners')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (emailClash) {
      return errorResponse('A cleaner with this username already exists', 409);
    }

    // ---------------------------------------------------------------
    // 7. CREATE AUTH USER
    // ---------------------------------------------------------------
    const { data: createdAuth, error: createAuthError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,    // skip email confirmation (fake email anyway)
      user_metadata: {
        role: 'cleaner',
        name,
      },
    });

    if (createAuthError || !createdAuth?.user) {
      const msg = createAuthError?.message || 'Failed to create auth user';
      return errorResponse(`Auth user creation failed: ${msg}`, 500);
    }

    const newUserId = createdAuth.user.id;

    // ---------------------------------------------------------------
    // 8. INSERT CLEANER ROW (uses same UUID as auth user)
    // ---------------------------------------------------------------
    const cleanerRow = {
      id: newUserId,             // FK to auth.users.id, must match
      name: name.trim(),
      phone,
      email,
      pincode,
      transport,
      state,
      city,
      experience,
      is_active: true,
      is_available: true,
      is_on_leave: false,
      is_online: false,
    };

    const { data: createdCleaner, error: createCleanerError } = await adminClient
      .from('cleaners')
      .insert(cleanerRow)
      .select()
      .single();

    if (createCleanerError) {
      // ROLLBACK: delete the auth user we just created so the system stays consistent
      try {
        await adminClient.auth.admin.deleteUser(newUserId);
      } catch (rollbackErr) {
        // Even if rollback fails, surface the original error to the caller.
        // The orphan auth user can be cleaned up manually if it happens.
        console.error('Rollback failed:', rollbackErr);
      }
      return errorResponse(
        `Cleaner row creation failed: ${createCleanerError.message}`,
        500,
        { hint: 'Auth user was rolled back. Please retry.' }
      );
    }

    // ---------------------------------------------------------------
    // 9. SUCCESS — return credentials (admin will show in modal & share with cleaner)
    // ---------------------------------------------------------------
    return jsonResponse({
      success: true,
      cleaner: {
        id: createdCleaner.id,
        name: createdCleaner.name,
        phone: createdCleaner.phone,
        email: createdCleaner.email,
        pincode: createdCleaner.pincode,
      },
      credentials: {
        login_email: email,
        password,              // returned only to the admin caller, once
      },
      message: 'Cleaner created successfully. Share the credentials with the cleaner.',
    });

  } catch (err) {
    // Catch-all for unexpected errors
    return errorResponse(`Unexpected error: ${err?.message ?? String(err)}`, 500);
  }
});
