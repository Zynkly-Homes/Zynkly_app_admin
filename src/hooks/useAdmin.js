import useAuthStore from '../store/authStore';

/**
 * Hook: returns the current admin and their role.
 * Provides convenience booleans for role checks.
 *
 * assignedPincodes — text[] from admins.assigned_pincodes
 * isScoped         — true when a non-super-admin has ≥1 pincode assigned.
 *                    Use this to gate data filters: super admins never get filtered.
 *
 * Usage:
 *   const { admin, isSuperAdmin, assignedPincodes, isScoped } = useAdmin();
 */
export function useAdmin() {
  const { admin, session, loading } = useAuthStore();

  const isSuperAdmin = admin?.role === 'super_admin';
  const assignedPincodes = admin?.assigned_pincodes ?? [];

  return {
    admin,
    session,
    isLoading: loading,
    isSuperAdmin,
    isAdmin: admin?.role === 'admin' || isSuperAdmin,
    role: admin?.role ?? null,
    /** Array of pincode strings this admin is scoped to (empty for super_admin) */
    assignedPincodes,
    /**
     * True when the logged-in admin is NOT a super_admin AND has at least one
     * pincode assigned. When true, all data queries must be filtered.
     */
    isScoped: !isSuperAdmin && assignedPincodes.length > 0,
    /**
     * True when the logged-in admin is NOT a super_admin AND has NO pincodes
     * assigned yet. This state means no data should be visible.
     */
    hasNoPincodes: !isSuperAdmin && assignedPincodes.length === 0,
  };
}
