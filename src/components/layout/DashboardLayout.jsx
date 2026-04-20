import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';
import { NAV_ITEMS } from '@/lib/constants';

/**
 * DashboardLayout — the outer shell for all protected routes.
 * Renders sidebar + topbar + page content via <Outlet />.
 * Also activates the global Realtime booking subscription here.
 */
export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Activate real-time subscription for bookings (app-wide)
  useRealtimeBookings();

  // Derive page title from current route
  const currentNav = NAV_ITEMS.find(
    (item) =>
      location.pathname === item.path ||
      (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
  );
  const pageTitle = currentNav?.label ?? 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar pageTitle={pageTitle} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
