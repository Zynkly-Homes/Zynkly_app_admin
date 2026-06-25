import { supabase } from '../lib/supabase';

/**
 * Fetch all cleaners with optional search and pincode scope.
 *
 * When `pincodes` is non-empty we filter cleaners directly by their
 * `pincode` column.
 *
 * @param {object}   options
 * @param {string}   options.search
 * @param {number}   options.page
 * @param {number}   options.pageSize
 * @param {string[]} options.pincodes - Pincode scope (empty = no filter)
 */
export async function getCleaners({ search = '', page = 0, pageSize = 20, pincodes = [] } = {}) {
  let query = supabase
    .from('cleaners')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  // Filter cleaners directly by pincode column
  if (pincodes.length > 0) {
    query = query.in('pincode', pincodes);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

/**
 * Fetch a single cleaner by ID with their booking history.
 */
export async function getCleanerById(id) {
  const { data, error } = await supabase
    .from('cleaners')
    .select(`
      *,
      bookings(
        id, status, scheduled_at, total_amount, address,
        user:users(name),
        booking_services (
          service_id,
          price_at_booking,
          services ( id, name, price )
        )
      ),
      leaves:cleaner_leaves(id, date, reason)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  // Flatten booking_services on each nested booking
  if (data?.bookings) {
    data.bookings = data.bookings.map(b => ({
      ...b,
      services: (b.booking_services || []).map(bs => ({
        ...bs.services,
        price_at_booking: bs.price_at_booking,
      })),
      booking_services: undefined,
    }));
  }

  return data;
}

/**
 * Create a new cleaner via the create-cleaner Edge Function.
 * Returns { success, cleaner, credentials, message }.
 */
export async function createCleaner(payload) {
  // Forward the current session JWT — required by the Edge Function
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }

  // Build the full Edge Function URL and call it manually with fetch.
  // This bypasses supabase-js's error wrapping so we can read the actual
  // error body returned by the function (e.g. "Phone is required").
  const supabaseUrl = supabase.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Supabase URL is not configured');
  }
  const anonKey = supabase.supabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

  const url = `${supabaseUrl}/functions/v1/create-cleaner`;

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
    throw new Error(`Network error calling create-cleaner: ${networkErr.message}`);
  }

  // Read body as JSON. If parsing fails, fall back to text.
  let body;
  try {
    body = await response.json();
  } catch {
    body = { error: `Server returned ${response.status} with non-JSON response` };
  }

  if (!response.ok) {
    // Function returned a 4xx/5xx — body should have { success: false, error }
    const message = body?.error || `Edge Function failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.details = body?.details;
    throw err;
  }

  if (!body?.success) {
    throw new Error(body?.error || 'Unknown error from create-cleaner');
  }

  return body; // { success, cleaner, credentials, message }
}

/**
 * Update cleaner details.
 */
export async function updateCleaner(id, updates) {
  const { data, error } = await supabase
    .from('cleaners')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update cleaner status (Available, Busy, On Leave).
 * Maps UI status to database boolean flags.
 */
export async function updateCleanerStatus(id, status) {
  console.log(`[cleanersService] Updating cleaner ${id} to status: ${status}`);
  
  const updates = {
    is_available: status === 'available',
    is_on_leave: status === 'leave',
  };

  const { data, error } = await supabase
    .from('cleaners')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[cleanersService] Update failed:', error.message);
    throw error;
  }
  
  return data;
}

/**
 * Get cleaners available for a given booking date/time.
 *
 * Fetches all cleaners and filters by availability/leave in memory for better resilience,
 * then annotates with busy status based on overlapping bookings.
 *
 * @param {string} scheduledAt      - ISO timestamp of the new booking
 * @param {string} [currentBookingId] - ID of the booking being assigned
 * @returns {Promise<Array>}
 */
export async function getAvailableCleaners(scheduledAt, currentBookingId = null) {
  try {
    // 1. Fetch all cleaners (using * to be resilient to schema variations)
    const { data: allCleaners, error: cleanerError } = await supabase
      .from('cleaners')
      .select('*')
      .order('rating', { ascending: false });

    if (cleanerError) throw cleanerError;
    if (!allCleaners?.length) return [];

    // 2. Filter by availability and leave status in memory
    // This handles both boolean and string/number representations of status
    const cleaners = allCleaners.filter(c => {
      const isAvailable = c.is_available === true || c.is_available === 'true' || c.is_available === 1;
      const isOnLeave = c.is_on_leave === true || c.is_on_leave === 'true' || c.is_on_leave === 1;
      return isAvailable && !isOnLeave;
    });

    if (cleaners.length === 0) return [];

    let busyMap = {};

    // 3. Detect overlapping bookings (±2 hours window) if scheduledAt is provided
    if (scheduledAt) {
      const OVERLAP_HOURS = 2;
      const pivot = new Date(scheduledAt);
      const windowStart = new Date(pivot.getTime() - OVERLAP_HOURS * 60 * 60 * 1000).toISOString();
      const windowEnd   = new Date(pivot.getTime() + OVERLAP_HOURS * 60 * 60 * 1000).toISOString();

      const cleanerIds = cleaners.map((c) => c.id);

      const { data: overlaps, error: overlapError } = await supabase
        .from('bookings')
        .select('id, cleaner_id, scheduled_at, status')
        .in('cleaner_id', cleanerIds)
        .in('status', ['CONFIRMED', 'IN_PROGRESS', 'PENDING'])
        .gte('scheduled_at', windowStart)
        .lte('scheduled_at', windowEnd)
        .neq('id', currentBookingId || '00000000-0000-0000-0000-000000000000');

      if (!overlapError && overlaps) {
        for (const booking of overlaps) {
          if (!busyMap[booking.cleaner_id]) {
            busyMap[booking.cleaner_id] = booking;
          }
        }
      }
    }

    // 4. Annotate and return
    return cleaners.map((cleaner) => {
      const conflictingBooking = busyMap[cleaner.id];
      if (conflictingBooking) {
        const time = new Date(conflictingBooking.scheduled_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        return {
          ...cleaner,
          is_busy: true,
          busy_reason: `Assigned to a booking at ${time}`,
        };
      }
      return { ...cleaner, is_busy: false, busy_reason: null };
    });
  } catch (err) {
    console.error('[getAvailableCleaners] Failed:', err);
    return [];
  }
}

/**
 * Delete a cleaner by ID.
 */
export async function deleteCleaner(id) {
  const { error } = await supabase
    .from('cleaners')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[cleanersService] Delete failed:', error.message);
    throw error;
  }
}
