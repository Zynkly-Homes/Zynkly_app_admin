import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { Skeleton } from '@/components/shared/SkeletonLoader';

/**
 * ProtectedRoute — wraps dashboard routes.
 *
 * 1. Shows loading skeleton while auth is being checked.
 * 2. Redirects to /login if no session.
 * 3. Redirects to /login if user is not in admins table.
 * 4. If `superAdminOnly` prop is true, redirects regular admins to /dashboard.
 *
 * Edge case handled: if session exists but admin is null (e.g., stale Zustand
 * persist from before the email-fallback fix), trigger a one-time refresh.
 */
export function ProtectedRoute({ superAdminOnly = false }) {
  const { session, admin, loading, refreshAdmin } = useAuthStore();

  // If we have a session but no admin record, it might be stale persist data.
  // Trigger refreshAdmin once to re-fetch with the new email-fallback logic.
  useEffect(() => {
    if (!loading && session && !admin) {
      refreshAdmin();
    }
  }, [loading, session, admin, refreshAdmin]);

  // Show skeleton while loading or while the edge-case refresh is in flight
  if (loading || (session && !admin)) {
    return (
      <div className="min-h-screen flex flex-col gap-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  // Not logged in at all
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Confirmed: session exists but admin record definitely not found after refresh
  // (refreshAdmin sets admin to null if truly not found — redirect to login with message)
  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  // Regular admin trying to access super-admin-only route
  if (superAdminOnly && admin.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
