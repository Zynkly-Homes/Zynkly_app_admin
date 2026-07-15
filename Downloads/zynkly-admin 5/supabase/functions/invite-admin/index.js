// Supabase Edge Function: invite-admin
// Deploy with: supabase functions deploy invite-admin
//
// This function requires the SERVICE ROLE KEY (set as a secret in Supabase dashboard).
// It is intentionally NOT called from client code with the service role key —
// all privileged operations go through Edge Functions.
//
// Set secrets: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate caller — must be a super_admin
    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Admin client (service role)
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the calling admin is super_admin
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await callerClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const { data: adminRecord } = await adminClient
      .from('admins')
      .select('role, is_active')
      .eq('user_id', user.id)
      .single();

    if (!adminRecord || adminRecord.role !== 'super_admin' || !adminRecord.is_active) {
      throw new Error('Only super admins can invite new admins');
    }

    // Parse request body
    const { email, role = 'admin' } = await req.json();
    if (!email) throw new Error('Email is required');
    if (!['admin', 'super_admin'].includes(role)) throw new Error('Invalid role');

    // TODO: Invite user via Supabase Auth Admin API
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email);
    if (inviteError) throw inviteError;

    // Create admin record
    const { error: insertError } = await adminClient.from('admins').insert({
      user_id: inviteData.user.id,
      email,
      role,
      is_active: true,
    });

    if (insertError) throw insertError;

    // Log the action
    const { data: invitingAdmin } = await adminClient
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    await adminClient.from('admin_logs').insert({
      admin_id: invitingAdmin?.id,
      action: 'admin.invite',
      target_type: 'admin',
      target_id: inviteData.user.id,
      metadata: { email, role },
    });

    return new Response(
      JSON.stringify({ success: true, userId: inviteData.user.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
