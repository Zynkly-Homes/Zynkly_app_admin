import { supabase } from '../lib/supabase';

// DECISION: Admin invite uses Supabase Edge Function to avoid exposing service role key.
// The edge function stub is in supabase/functions/invite-admin/index.js.

// ─── Admins ───────────────────────────────────────────────────────────────────

/**
 * Fetch all admins.
 */
export async function getAdmins() {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Update an admin's role.
 */
export async function updateAdminRole(id, role) {
  const { data, error } = await supabase
    .from('admins')
    .update({ role })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Assign (or replace) the list of serviceable pincodes for an admin.
 * Pass an empty array to clear all assigned pincodes.
 * @param {string}   id       - Admin row ID
 * @param {string[]} pincodes - Array of pincode strings
 */
export async function updateAdminPincodes(id, pincodes) {
  const { data, error } = await supabase
    .from('admins')
    .update({ assigned_pincodes: pincodes })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Deactivate an admin (soft delete by setting is_active to false).
 * Hard delete requires the Edge Function for proper cleanup.
 */
export async function deactivateAdmin(id) {
  const { data, error } = await supabase
    .from('admins')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new admin via the create-admin Edge Function.
 * Returns { success, admin, credentials, message } on success.
 */
export async function createAdmin(payload) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl) {
    throw new Error('Supabase URL is not configured');
  }

  const url = `${supabaseUrl}/functions/v1/create-admin`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': anonKey,
      },
      body: JSON.stringify(payload),
    });
  } catch (networkErr) {
    throw new Error(`Network error calling create-admin: ${networkErr.message}`);
  }

  let body;
  try {
    body = await response.json();
  } catch {
    body = { error: `Server returned ${response.status} with non-JSON response` };
  }

  if (!response.ok) {
    const message = body?.error || `Edge Function failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }

  if (!body?.success) {
    throw new Error(body?.error || 'Unknown error from create-admin');
  }

  return body; // { success, admin, credentials, message }
}

// ─── Services ────────────────────────────────────────────────────────────────

export async function getServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function upsertService(service) {
  const { data, error } = await supabase
    .from('services')
    .upsert(service)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteService(id) {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
}

// ─── Pincodes ─────────────────────────────────────────────────────────────────

/**
 * Fetch serviceable pincodes.
 * @param {object}   options
 * @param {string}   options.search   - Text search on pincode / city
 * @param {string[]} options.pincodes - If non-empty, restrict to this exact set
 */
export async function getPincodes({ search = '', pincodes = [] } = {}) {
  let query = supabase
    .from('serviceable_pincodes')
    .select('*')
    .order('pincode');

  if (pincodes.length > 0) {
    query = query.in('pincode', pincodes);
  }

  if (search) {
    query = query.or(`pincode.ilike.%${search}%,city.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function upsertPincode(pincode) {
  const { data, error } = await supabase
    .from('serviceable_pincodes')
    .upsert(pincode)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePincode(id) {
  const { error } = await supabase.from('serviceable_pincodes').delete().eq('id', id);
  if (error) throw error;
}

// ─── Waitlist ──────────────────────────────────────────────────────────────────

/**
 * Fetch waitlist entries.
 * @param {object}   options
 * @param {string}   options.pincode    - UI text search filter
 * @param {number}   options.page
 * @param {number}   options.pageSize
 * @param {string[]} options.pincodes   - Pincode scope (empty = no filter)
 */
export async function getWaitlist({ pincode = '', page = 0, pageSize = 20, pincodes = [] } = {}) {
  let query = supabase
    .from('waitlist')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  // Pincode scope takes priority: show only entries in assigned pincodes
  if (pincodes.length > 0) {
    query = query.in('pincode', pincodes);
  } else if (pincode) {
    // Regular free-text search (only when not scoped)
    query = query.ilike('pincode', `%${pincode}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function markWaitlistNotified(ids) {
  const { error } = await supabase
    .from('waitlist')
    .update({ notified: true })
    .in('id', ids);

  if (error) throw error;
}

// ─── Legal Content ─────────────────────────────────────────────────────────────

export async function getLegalContent() {
  const { data, error } = await supabase.from('legal_content').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function upsertLegalContent(record) {
  const { data, error } = await supabase
    .from('legal_content')
    .upsert(record)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── App Config ───────────────────────────────────────────────────────────────

export async function getAppConfig() {
  const { data, error } = await supabase.from('app_config').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function upsertAppConfig(key, value) {
  const { data, error } = await supabase
    .from('app_config')
    .upsert({ key, value: String(value) })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

/**
 * Fetch reviews.
 * @param {object}   options
 * @param {number}   options.rating     - Star rating filter (null = all)
 * @param {number}   options.page
 * @param {number}   options.pageSize
 * @param {string[]} options.pincodes   - Pincode scope (empty = no filter)
 */
export async function getReviews({ rating = null, page = 0, pageSize = 20, pincodes = [] } = {}) {
  let query = supabase
    .from('reviews')
    .select(
      `
      *,
      booking:bookings(
        id,
        address,
        user:users(name),
        cleaner:cleaners(name)
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (rating) query = query.eq('rating', rating);

  // Pincode scope via the booking's address field
  if (pincodes.length > 0) {
    const filter = pincodes.map((p) => `booking.address.ilike.%${p}%`).join(',');
    query = query.or(filter, { referencedTable: 'bookings' });
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function updateReviewFlag(id, flagged) {
  const { data, error } = await supabase
    .from('reviews')
    .update({ flagged })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Support ──────────────────────────────────────────────────────────────────

export async function getSupportContacts() {
  const { data, error } = await supabase
    .from('support_contacts')
    .select('*')
    .order('display_order');
  if (error) throw error;
  return data ?? [];
}

export async function getSupportFaqs() {
  const { data, error } = await supabase
    .from('support_faqs')
    .select('*')
    .order('display_order');
  if (error) throw error;
  return data ?? [];
}

export async function upsertSupportFaq(faq) {
  const { data, error } = await supabase
    .from('support_faqs')
    .upsert(faq)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSupportFaq(id) {
  const { error } = await supabase.from('support_faqs').delete().eq('id', id);
  if (error) throw error;
}
