import { Outlet } from 'react-router-dom';
import TopDock from './TopDock';
import { useRealtimeBookings } from '@/hooks/useRealtimeBookings';

export function DashboardLayout() {
  // Activate real-time subscription for bookings (app-wide)
  useRealtimeBookings();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative selection:bg-teal-500/30 font-sans">
      {/* Ambient Background layer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-60">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>

      <TopDock />

      {/* Main Content Area */}
      <div className="relative z-10 pt-24 pb-12 px-4 sm:px-8 max-w-[1800px] mx-auto animate-fade-in">
        <Outlet />
      </div>
    </div>
  );
}
