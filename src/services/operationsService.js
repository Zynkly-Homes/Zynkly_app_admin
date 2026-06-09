import { supabase } from '../lib/supabase';

// ─── Booking Controls (3 master toggles) ─────────────────────────────────

/**
 * Fetch the single booking_controls row.
 */
export async function getBookingControls() {
  const { data, error } = await supabase
    .from('booking_controls')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Update booking_controls. Super_admin only (enforced by RLS).
 * Pass partial updates: e.g. { accept_asap_bookings: false }
 */
export async function updateBookingControls(updates) {
  const { data, error } = await supabase
    .from('booking_controls')
    .update(updates)
    .eq('id', 1)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Blocked Slots ────────────────────────────────────────────────────────

/**
 * Fetch blocked_slots, optionally filtered to a pincode subset
 * (admins are scoped to their assigned_pincodes).
 * @param {string[]} pincodes - When non-empty, returns blocks for these
 *                              pincodes OR global (NULL) blocks.
 */
export async function getBlockedSlots(pincodes = []) {
  let query = supabase
    .from('blocked_slots')
    .select('*')
    .order('blocked_date', { ascending: true })
    .order('slot_time',    { ascending: true, nullsFirst: true });

  if (pincodes.length > 0) {
    // include both: blocks in admin's pincodes + global (NULL) blocks
    query = query.or(`pincode.in.(${pincodes.join(',')}),pincode.is.null`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/**
 * Create a new blocked slot.
 * @param {object}        payload
 * @param {string}        payload.blocked_date - 'YYYY-MM-DD'
 * @param {string|null}   payload.slot_time    - 'HH:MM:SS' or null (whole day)
 * @param {string|null}   payload.pincode      - 6-digit pincode or null (global)
 * @param {string|null}   payload.reason
 */
export async function createBlockedSlot(payload) {
  const { data, error } = await supabase
    .from('blocked_slots')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Delete a blocked slot by id.
 */
export async function deleteBlockedSlot(id) {
  const { error } = await supabase
    .from('blocked_slots')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
