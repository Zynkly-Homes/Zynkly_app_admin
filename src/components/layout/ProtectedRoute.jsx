import { useEffect, useState } from 'react';
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
 * A 5-second safety timeout ensures we never get stuck on skeleton forever.
 */
export function ProtectedRoute({ superAdminOnly = false }) {
  const { session, admin, loading, refreshAdmin } = useAuthStore();
  const [refreshTimedOut, setRefreshTimedOut] = useState(false);

  // Only refresh admin once per "session-without-admin" state.
  // Critical: do NOT reset refreshTimedOut on every effect run — that
  // creates a skeleton-stuck flicker on route transitions.
  useEffect(() => {
    if (loading) return;
    if (!session) {
      setRefreshTimedOut(false);
      return;
    }
    if (session && !admin) {
      refreshAdmin();
      const t = setTimeout(() => setRefreshTimedOut(true), 5_000);
      return () => clearTimeout(t);
    }
    // session && admin → stable, reset timeout flag for next time
    setRefreshTimedOut(false);
  }, [loading, session, admin, refreshAdmin]);

  // Show skeleton while auth is resolving — but never forever
  const isWaiting = loading || (session && !admin && !refreshTimedOut);
  if (isWaiting) {
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

  // Session exists but no admin record found (even after refresh/timeout)
  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  // Regular admin trying to access super-admin-only route
  if (superAdminOnly && admin.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
