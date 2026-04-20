import { supabase } from '../lib/supabase';

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a PostgREST OR filter string that matches `address` against any
 * of the supplied pincodes via substring match.
 * e.g. pincodes=['411001','411002'] → "address.ilike.%411001%,address.ilike.%411002%"
 */
function buildAddressPincodeFilter(pincodes) {
  return pincodes.map((p) => `address.ilike.%${p}%`).join(',');
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

/**
 * Fetch paginated bookings with optional filters.
 * Joins users, services, and cleaners for display.
 *
 * @param {object} options
 * @param {object}   options.filters    - UI filter values (status, search, from, to)
 * @param {number}   options.page       - 0-based page index
 * @param {number}   options.pageSize
 * @param {string[]} options.pincodes   - Pincode scope filter (empty = no filter)
 */
export async function getBookings({ filters = {}, page = 0, pageSize = 20, pincodes = [] } = {}) {
  let query = supabase
    .from('bookings')
    .select(
      `
      *,
      user:users(id, name, phone, email),
      cleaner:cleaners(id, name, phone)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  // Pincode scope — always applied first so it can be combined with other filters
  if (pincodes.length > 0) {
    query = query.or(buildAddressPincodeFilter(pincodes));
  }

  // Use ilike for case-insensitive status match (DB may store PENDING or pending)
  if (filters.status) query = query.ilike('status', filters.status);
  if (filters.search) {
    query = query.or(`id.ilike.%${filters.search}%`);
  }
  if (filters.from) query = query.gte('scheduled_at', filters.from);
  if (filters.to) query = query.lte('scheduled_at', filters.to);
  if (filters.pincode) query = query.ilike('address', `%${filters.pincode}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

/**
 * Fetch a single booking by ID with full relational data.
 */
export async function getBookingById(id) {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      *,
      user:users(id, name, phone, email, created_at),
      cleaner:cleaners(id, name, phone, rating),
      review:reviews(id, rating, comment, created_at)
    `
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update the status of a booking.
 */
export async function updateBookingStatus(id, status) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Assign a cleaner to a booking.
 */
export async function assignCleaner(bookingId, cleanerId) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ cleaner_id: cleanerId })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get summary stats for the dashboard.
 * @param {string[]} pincodes - Pincode scope (empty = no scope filter)
 */
export async function getDashboardStats(pincodes = []) {
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const pincodeFilter = pincodes.length > 0 ? buildAddressPincodeFilter(pincodes) : null;

  // Helper: apply pincode scope to a query if needed
  const scoped = (q) => (pincodeFilter ? q.or(pincodeFilter) : q);

  const [
    { count: totalToday },
    { data: revenueData },
    { count: pendingCount },
    { count: activeCleaners },
  ] = await Promise.all([
    // Total bookings today
    scoped(
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
    ),

    // Revenue today (sum of total_amount for bookings today)
    scoped(
      supabase
        .from('bookings')
        .select('total_amount')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .not('total_amount', 'is', null)
    ),

    // Pending bookings
    scoped(
      supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .in('status', ['PENDING', 'pending', 'confirmed'])
    ),

    // Active cleaners — not scoped to pincode (cleaners are global resources)
    supabase
      .from('cleaners')
      .select('id', { count: 'exact', head: true })
      .or('is_available.eq.true,is_available.eq.1'),
  ]);

  const revenueToday = (revenueData ?? []).reduce((sum, b) => sum + (b.total_amount || 0), 0);

  return {
    totalToday: totalToday ?? 0,
    revenueToday,
    pendingCount: pendingCount ?? 0,
    activeCleaners: activeCleaners ?? 0,
  };
}

/**
 * Get revenue data for last N days, grouped by date.
 * @param {number}   days
 * @param {string[]} pincodes - Pincode scope (empty = no filter)
 */
export async function getRevenueData(days = 30, pincodes = []) {
  const from = new Date();
  from.setDate(from.getDate() - days);

  let query = supabase
    .from('bookings')
    .select('scheduled_at, total_amount, service_ids')
    .not('total_amount', 'is', null)
    .gte('scheduled_at', from.toISOString())
    .order('scheduled_at', { ascending: true });

  if (pincodes.length > 0) {
    query = query.or(buildAddressPincodeFilter(pincodes));
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/**
 * Get recent bookings (last 10) for dashboard.
 * @param {string[]} pincodes - Pincode scope (empty = no filter)
 */
export async function getRecentBookings(pincodes = []) {
  let query = supabase
    .from('bookings')
    .select(
      `
      id, status, total_amount, scheduled_at, created_at, address,
      user:users(name, phone),
      cleaner:cleaners(name)
    `
    )
    .order('created_at', { ascending: false })
    .limit(10);

  if (pincodes.length > 0) {
    query = query.or(buildAddressPincodeFilter(pincodes));
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
