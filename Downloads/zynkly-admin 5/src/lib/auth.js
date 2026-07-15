import { supabase } from './supabase';

/**
 * Fetches the admin record for the currently signed-in Supabase user.
 *
 * Strategy (in order):
 *  1. Query by id       — Primary lookup (id === auth user UUID)
 *  2. Query by email    — Fallback if id lookup returns null (useful if admin row has different id)
 *
 * Returns null if the user has no admin record at all.
 * @param {string} userId  — Supabase auth.users UUID
 * @param {string} email   — The signed-in user's email
 * @returns {Promise<{id, role, name, email} | null>}
 */
export async function getAdminRecord(userId, email) {
  // --- OLD CODE COMMENTED OUT ---
  // // Strategy 1: Attempt user_id lookup (if column exists)
  // try {
  //   const { data: admin } = await supabase
  //     .from('admins')
  //     .select('*')
  //     .eq('user_id', userId)
  //     .maybeSingle();
  //   
  //   if (admin) return admin;
  // } catch (err) {
  //   // Ignore error if user_id doesn't exist
  // }
  // ------------------------------

  // Strategy 1: Primary lookup using id === userId
  try {
    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (admin) return admin;
  } catch {
    // Ignore error, will try email fallback
  }

  // Strategy 2: email lookup (fallback)
  if (email) {
    try {
      const { data: admin } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      
      if (admin) return admin;
    } catch (err) {
      console.warn('[Auth] email lookup failed:', err.message);
    }
  }

  console.warn(`[Auth] No admin record found for userId=${userId} and email=${email}`);
  return null;
}

/**
 * Checks if the given role is super_admin.
 * @param {string} role
 */
export function isSuperAdmin(role) {
  return role === 'super_admin';
}

/**
 * Checks if the given role has admin privileges (both roles do for most ops).
 * @param {string} role
 */
export function isAdmin(role) {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Logs an admin action to the admin_logs table.
 * Fails silently — action logging should never block the main operation.
 */
export async function logAdminAction({ adminId, action, targetType, targetId, metadata = {} }) {
  try {
    await supabase.from('admin_logs').insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId ? String(targetId) : null,
      metadata,
    });
  } catch (err) {
    console.warn('[AdminLog] Failed to log action:', err.message);
  }
}
