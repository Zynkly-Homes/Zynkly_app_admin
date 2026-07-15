import { supabase } from '../lib/supabase';

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Flatten the booking_services join into a clean `services` array on each
 * booking row and remove the raw `booking_services` key.
 */
function flattenBookingServices(rows) {
  return (rows || []).map(b => ({
    ...b,
    services: (b.booking_services || []).map(bs => ({
      ...bs.services,
      price_at_booking: bs.price_at_booking,
    })),
    booking_services: undefined,
  }));
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
      user:users(id, name, phone, email, avatar_url),
      cleaner:cleaners(id, name, phone, avatar_url, rating),
      booking_services (
        service_id,
        price_at_booking,
        services ( id, name, price, category, estimated_time )
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  // Pincode scope — always applied first so it can be combined with other filters
  if (pincodes.length > 0) {
    query = query.in('pincode', pincodes);
  }

  // Use ilike for case-insensitive status match (DB may store PENDING or pending)
  if (filters.status) query = query.ilike('status', filters.status);
  if (filters.search) {
    query = query.or(`id.ilike.%${filters.search}%`);
  }
  if (filters.from) query = query.gte('scheduled_at', filters.from);
  if (filters.to) query = query.lte('scheduled_at', filters.to);
  if (filters.pincode) query = query.eq('pincode', filters.pincode);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: flattenBookingServices(data), count: count ?? 0 };
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
      review:reviews(id, rating, comment, created_at),
      booking_services (
        service_id,
        price_at_booking,
        services ( id, name, price, category, estimated_time )
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  return flattenBookingServices([data])[0];
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
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

  // Helper: apply pincode scope to a query if needed
  const scoped = (q) => (pincodes.length > 0 ? q.in('pincode', pincodes) : q);

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
    .select('work_completed_at, total_amount')
    .eq('status', 'COMPLETED')
    .not('total_amount', 'is', null)
    .not('work_completed_at', 'is', null)
    .gte('work_completed_at', from.toISOString())
    .order('work_completed_at', { ascending: true });

  if (pincodes.length > 0) {
    query = query.in('pincode', pincodes);
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
    query = query.in('pincode', pincodes);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
