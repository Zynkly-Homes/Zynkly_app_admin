import { useEffect, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Auth
import useAuthStore from '@/store/authStore';

// Layout
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

// Pages — public
import Login from '@/pages/Login';

// Pages — both roles
import Dashboard from '@/pages/Dashboard';
import BookingsList from '@/pages/bookings/BookingsList';
import BookingDetail from '@/pages/bookings/BookingDetail';
import Customers from '@/pages/Customers';
import CleanersList from '@/pages/cleaners/CleanersList';
import CleanerDetail from '@/pages/cleaners/CleanerDetail';
import Reviews from '@/pages/Reviews';
import Revenue from '@/pages/Revenue';
import Support from '@/pages/Support';
import Operations from '@/pages/Operations';

// Pages — super admin only
import Admins from '@/pages/Admins';
import Services from '@/pages/Services';
import Pincodes from '@/pages/Pincodes';

/**
 * ErrorBoundary — catches render crashes and shows a readable error instead of white screen.
 * React requires a class component for error boundaries.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: '480px', width: '100%' }}>
            <h2 style={{ color: '#dc2626', marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
              Something went wrong
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
              The admin panel encountered an error. Check the browser console for details.
            </p>
            <pre style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.75rem', overflowX: 'auto', color: '#374151', whiteSpace: 'pre-wrap' }}>
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#0f766e', color: '#fff', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// React Query client
// - retry: 1 attempt on failure
// - staleTime: 10s — data is considered stale quickly so it refreshes on remount
// - refetchOnWindowFocus: true — re-fetches when user switches back to the tab
// - refetchOnMount: true — always fetch fresh data when a page component mounts
// - gcTime: 5min — keep unused cache for 5 minutes
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 10_000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    },
  },
});

/**
 * App.jsx — root component.
 * Sets up:
 * - ErrorBoundary (catch render crashes → show message instead of white screen)
 * - React Query provider
 * - Auth initialization (Supabase session listener)
 * - Sonner toast provider
 * - React Router v6 routes
 */
export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    // Initialize auth and get the unsubscribe function
    let unsubscribe;
    initialize().then((unsub) => { unsubscribe = unsub; });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [initialize]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected routes wrapped in DashboardLayout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/bookings" element={<BookingsList />} />
                <Route path="/bookings/:id" element={<BookingDetail />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/cleaners" element={<CleanersList />} />
                <Route path="/cleaners/:id" element={<CleanerDetail />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/revenue" element={<Revenue />} />
                <Route path="/support" element={<Support />} />
                <Route path="/operations" element={<Operations />} />
              </Route>
            </Route>

            {/* Super admin only routes */}
            <Route element={<ProtectedRoute superAdminOnly />}>
              <Route element={<DashboardLayout />}>
                <Route path="/admins" element={<Admins />} />
                <Route path="/services" element={<Services />} />
                <Route path="/pincodes" element={<Pincodes />} />
              </Route>
            </Route>

            {/* 404 catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>

        {/* Toast notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
            },
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
