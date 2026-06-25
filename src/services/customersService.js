import { supabase } from '../lib/supabase';

/**
 * Fetch customers with optional search, pagination, and pincode scope.
 *
 * When `pincodes` is non-empty, only users who have at least one saved address
 * matching one of the given pincodes will be returned. This uses a join
 * via the `addresses` table (addresses.pincode column).
 *
 * @param {object}   options
 * @param {string}   options.search
 * @param {number}   options.page
 * @param {number}   options.pageSize
 * @param {string[]} options.pincodes - Pincode scope (empty = no filter)
 */
export async function getCustomers({ search = '', page = 0, pageSize = 20, pincodes = [] } = {}) {
  let query = supabase
    .from('users')
    .select(
      `
      id, name, email, phone, created_at,
      bookings(count),
      addresses!inner(pincode)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (pincodes.length > 0) {
    // Filter users whose addresses.pincode matches any assigned pincode
    query = query.in('addresses.pincode', pincodes);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

/**
 * Fetch customers WITHOUT pincode filtering (for unscoped path).
 * Kept separate so the scoped path can use the !inner join without
 * accidentally dropping users who have no addresses at all.
 */
export async function getCustomersUnscoped({ search = '', page = 0, pageSize = 20 } = {}) {
  let query = supabase
    .from('users')
    .select(
      `
      id, name, email, phone, created_at,
      bookings(count)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

/**
 * Fetch a single customer with their bookings and addresses.
 */
export async function getCustomerById(id) {
  const { data, error } = await supabase
    .from('users')
    .select(
      `
      *,
      bookings(
        id, status, scheduled_at, total_amount,
        cleaner:cleaners(name)
      ),
      addresses(id, label, full_address, pincode)
    `
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
