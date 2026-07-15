import { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, TrendingUp, Users, Clock, ArrowRight, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonGrid } from '@/components/shared/SkeletonLoader';
import { ScopeBanner } from '@/components/shared/ScopeBanner';
import { formatCurrency, formatDate, shortId } from '@/lib/utils';
import { getDashboardStats, getRecentBookings, getRevenueData } from '@/services/bookingsService';
import { useAdmin } from '@/hooks/useAdmin';
import RevenueStats from '@/components/RevenueStats';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { admin, assignedPincodes, isScoped, hasNoPincodes } = useAdmin();

  const pincodes = isScoped ? assignedPincodes : [];

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard', 'stats', pincodes],
    queryFn: () => getDashboardStats(pincodes),
  });

  const { data: recentBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['dashboard', 'recent-bookings', pincodes],
    queryFn: () => getRecentBookings(pincodes),
  });

  const { data: revenueData } = useQuery({
    queryKey: ['dashboard', 'revenue', 30, pincodes],
    queryFn: () => getRevenueData(30, pincodes),
    staleTime: 120_000,
  });

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      // Only intercept if they are scrolling vertically
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        // Smooth scrolling using the browser's native scroll behavior
        el.scrollBy({
          left: e.deltaY < 0 ? -300 : 300,
          behavior: 'smooth'
        });
      }
    };

    // We must use native addEventListener to pass { passive: false }
    // otherwise e.preventDefault() won't work for scroll interception
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [recentBookings]);

  return (
    <div className="space-y-8 max-w-full pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-stagger-up stagger-1">
        <div>
          <p className="text-sm font-semibold text-teal-600 tracking-wider uppercase mb-1">Overview</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Good {getGreeting()}, {admin?.name?.split(' ')[0] ?? 'Admin'}
          </h2>
        </div>
        
        <div className="flex gap-2">
           <Button variant="outline" className="bg-white/50 backdrop-blur-md border-white/80 shadow-sm rounded-xl hover:bg-white/80" onClick={() => navigate('/bookings')}>
             All Bookings
           </Button>
           <Button className="bg-gradient-to-tr from-teal-500 to-cyan-400 text-white shadow-[0_2px_10px_rgba(20,184,166,0.3)] hover:shadow-[0_4px_15px_rgba(20,184,166,0.4)] rounded-xl border-none transition-all duration-300">
             New Booking
           </Button>
        </div>
      </div>

      {(isScoped || hasNoPincodes) && (
        <div className="animate-stagger-up stagger-2">
          <ScopeBanner pincodes={assignedPincodes} hasNoPincodes={hasNoPincodes} />
        </div>
      )}

      {/* BENTO BOX GRID */}
      {statsLoading ? (
        <SkeletonGrid count={3} cardHeight="h-[120px]" className="grid-cols-1 md:grid-cols-3" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-12 gap-4 md:gap-6">
          
          {/* Main Hero Bento (Revenue & Chart) */}
          <div className="md:col-span-4 xl:col-span-8 bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden relative flex flex-col animate-stagger-up stagger-2 ring-1 ring-black/5 inset p-6 lg:p-8">
            <div className="flex justify-between items-start mb-6 z-10">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue (Today)</p>
                <p className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter drop-shadow-sm">
                  {formatCurrency(stats?.revenueToday ?? 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-600 shadow-inner">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            
            <div className="flex-1 mt-auto -mx-4 -mb-4 opacity-90 mix-blend-multiply pointer-events-none">
               <RevenueChart data={revenueData ?? []} days={30} />
            </div>
          </div>

          {/* Quick Stats Column */}
          <div className="md:col-span-2 xl:col-span-4 flex flex-col gap-4 md:gap-6 animate-stagger-up stagger-3">
            
            {/* Pending Box */}
            <div className="flex-1 bg-amber-500/5 backdrop-blur-3xl border border-amber-500/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 flex flex-col justify-center ring-1 ring-amber-500/10 inset group cursor-pointer hover:bg-amber-500/10 transition-colors" onClick={() => navigate('/bookings?status=pending')}>
               <div className="flex justify-between items-center">
                 <div>
                   <div className="flex items-center gap-2 mb-1">
                     <span className="relative flex h-2.5 w-2.5">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                     </span>
                     <p className="text-sm font-semibold text-amber-700">Action Required</p>
                   </div>
                   <div className="flex items-end gap-2">
                     <p className="text-4xl font-black text-amber-900 tracking-tighter drop-shadow-sm">{stats?.pendingCount ?? 0}</p>
                     <p className="text-sm text-amber-700/80 mb-1 font-medium">Pending Bookings</p>
                   </div>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform shadow-inner">
                   <Clock className="w-6 h-6" />
                 </div>
               </div>
            </div>

            {/* Active Cleaners Box */}
            <div className="flex-1 bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 flex flex-col justify-center ring-1 ring-black/5 inset group cursor-pointer hover:bg-white/80 transition-colors" onClick={() => navigate('/cleaners')}>
               <div className="flex justify-between items-center">
                 <div>
                   <p className="text-sm font-medium text-slate-500">Active Cleaners</p>
                   <div className="flex items-end gap-2">
                     <p className="text-4xl font-black text-slate-900 tracking-tighter drop-shadow-sm">{stats?.activeCleaners ?? 0}</p>
                     <p className="text-sm text-slate-400 mb-1 font-medium">Available</p>
                   </div>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform">
                   <Users className="w-6 h-6" />
                 </div>
               </div>
            </div>

            {/* Bookings Today Box */}
            <div className="flex-1 bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 flex flex-col justify-center ring-1 ring-black/5 inset group cursor-pointer hover:bg-white/80 transition-colors" onClick={() => navigate('/bookings')}>
               <div className="flex justify-between items-center">
                 <div>
                   <p className="text-sm font-medium text-slate-500">Bookings Today</p>
                   <div className="flex items-end gap-2">
                     <p className="text-4xl font-black text-slate-900 tracking-tighter drop-shadow-sm">{stats?.totalToday ?? 0}</p>
                     <p className="text-sm text-slate-400 mb-1 font-medium">Created</p>
                   </div>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                   <CalendarDays className="w-6 h-6" />
                 </div>
               </div>
            </div>

          </div>
        </div>
      )}

      {/* Revenue Breakdown */}
      <div className="animate-stagger-up stagger-4">
        <RevenueStats />
      </div>

      {/* Horizontal Scroll Feed for Bookings */}
      <div className="animate-stagger-up stagger-4 pt-4">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">Live Feed</h3>
          <Button variant="ghost" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50" onClick={() => navigate('/bookings')}>
            See all <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {bookingsLoading ? (
           <div className="flex gap-4 overflow-hidden">
             {[1,2,3,4].map(i => <div key={i} className="min-w-[320px] h-[180px] bg-slate-200/50 animate-pulse rounded-[2rem]" />)}
           </div>
        ) : !recentBookings?.length ? (
           <div className="bg-white/40 border border-white/60 rounded-[2rem] p-12 text-center text-slate-500">
             No recent bookings.
           </div>
        ) : (
          <div 
            ref={scrollContainerRef}
            className="flex gap-4 md:gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scroll-smooth hide-scrollbar -mx-4 px-4 sm:-mx-8 sm:px-8" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {recentBookings.map((booking) => (
              <div 
                key={booking.id} 
                onClick={() => navigate(`/bookings/${booking.id}`)}
                className="group relative flex-none w-[320px] sm:w-[360px] snap-center bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-[2rem] p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 ring-1 ring-black/5 inset overflow-hidden"
              >
                {/* Status indicator glow */}
                <div className="absolute top-0 right-8 w-24 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-100 to-slate-200 border border-white shadow-sm flex items-center justify-center text-slate-500 font-bold text-sm uppercase">
                      {booking.user?.name ? booking.user.name.charAt(0) : '?'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-tight truncate max-w-[140px]">{booking.user?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-500 font-mono">{shortId(booking.id)}</p>
                    </div>
                  </div>
                  <StatusBadge status={booking.status} type="booking" className="rounded-full shadow-sm" />
                </div>

                <div className="space-y-3 mb-5 relative z-10">
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <span>{formatDate(booking.scheduled_at, 'MMM d, yyyy • h:mm a')}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{booking.address ?? 'No address'}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200/50 flex justify-between items-center relative z-10">
                  <div className="flex -space-x-2">
                    {/* Placeholder for cleaner avatars */}
                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] text-slate-400 font-bold">
                      <Users className="w-3 h-3" />
                    </div>
                  </div>
                  <p className="text-xl font-black text-slate-900">{formatCurrency(booking.total_amount)}</p>
                </div>
                
                {/* Hover Quick Action Overlay */}
                <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                  <Button className="bg-slate-900 text-white shadow-lg rounded-full px-6 hover:scale-105 transition-transform hover:bg-slate-800">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
