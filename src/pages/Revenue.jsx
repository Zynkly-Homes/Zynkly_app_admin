import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download, TrendingUp, IndianRupee, CalendarDays, ShoppingBag,
  LineChart, Sun, Calendar, Wallet, Search, AlertCircle,
  Sparkles, MapPin, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevenueChart, BarRevenueChart } from '@/components/charts/RevenueChart';
import { SkeletonGrid } from '@/components/shared/SkeletonLoader';
import { ScopeBanner } from '@/components/shared/ScopeBanner';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { getRevenueData } from '@/services/bookingsService';
import { useAdmin } from '@/hooks/useAdmin';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ── Quick-stat card config ──────────────────────────────────── */
const QUICK_STATS = [
  { key: 'today', label: 'Today',      Icon: Sun,         color: 'amber'  },
  { key: 'week',  label: 'This Week',  Icon: Calendar,    color: 'cyan'   },
  { key: 'month', label: 'This Month', Icon: TrendingUp,  color: 'indigo' },
  { key: 'total', label: 'Total',      Icon: Wallet,      color: 'teal'   },
];

const COLOR_MAP = {
  amber:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  text: 'text-amber-600'  },
  cyan:   { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20',   text: 'text-cyan-600'   },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-600' },
  teal:   { bg: 'bg-teal-500/10',   border: 'border-teal-500/20',   text: 'text-teal-600'   },
};

/* ── Reusable skeleton row ───────────────────────────────────── */
function SkeletonRows({ count = 4 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="flex items-center justify-between py-3 animate-pulse">
      <div className="h-4 w-32 bg-slate-200/70 rounded-full" />
      <div className="flex gap-6">
        <div className="h-4 w-20 bg-slate-200/70 rounded-full" />
        <div className="h-4 w-12 bg-slate-200/70 rounded-full" />
      </div>
    </div>
  ));
}

/* ═════════════════════════════════════════════════════════════════
   Component
   ═════════════════════════════════════════════════════════════════ */
export default function Revenue() {
  const [tab, setTab] = useState('30d');
  const [selectedDate, setSelectedDate] = useState('');
  const { assignedPincodes, isScoped, hasNoPincodes } = useAdmin();
  const pincodes = isScoped ? assignedPincodes : [];

  const daysMap = { '30d': 30, '12w': 84, '12m': 365 };
  const days = daysMap[tab] ?? 30;

  /* ── Chart data ────────────────────────────────────────────── */
  const { data: rawData, isLoading: chartLoading, isError: chartError } = useQuery({
    queryKey: ['revenue', days, pincodes],
    queryFn: () => getRevenueData(days, pincodes),
    staleTime: 120_000,
  });

  /* ── All-time revenue stats ────────────────────────────────── */
  const { data: revenueStats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['revenue-stats-page'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_revenue_stats');
      if (error) throw error;
      return data;
    },
    staleTime: 120_000,
  });

  /* ── All-time completed-booking count ──────────────────────── */
  const { data: completedCount, isLoading: countLoading } = useQuery({
    queryKey: ['completed-bookings-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'COMPLETED');
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 120_000,
  });

  /* ── Day lookup ────────────────────────────────────────────── */
  const {
    data: dayData,
    isLoading: dayLoading,
    isError: dayError,
  } = useQuery({
    queryKey: ['revenue-day', selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_revenue_for_day', {
        target_date: selectedDate,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDate,
    staleTime: 120_000,
  });

  /* ── Breakdown: by service ─────────────────────────────────── */
  const {
    data: byService,
    isLoading: serviceLoading,
    isError: serviceError,
  } = useQuery({
    queryKey: ['revenue-by-service'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_revenue_by_service');
      if (error) throw error;
      return data;
    },
    staleTime: 120_000,
  });

  /* ── Breakdown: by area ────────────────────────────────────── */
  const {
    data: byArea,
    isLoading: areaLoading,
    isError: areaError,
  } = useQuery({
    queryKey: ['revenue-by-area'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_revenue_by_area');
      if (error) throw error;
      return data;
    },
    staleTime: 120_000,
  });

  /* ── Breakdown: top cleaners ───────────────────────────────── */
  const {
    data: topCleaners,
    isLoading: cleanerLoading,
    isError: cleanerError,
  } = useQuery({
    queryKey: ['top-cleaners'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_cleaners');
      if (error) throw error;
      return data;
    },
    staleTime: 120_000,
  });

  /* ── Derived values ────────────────────────────────────────── */
  const totalRevenue = revenueStats?.total ?? 0;
  const totalBookings = completedCount ?? 0;
  const avgOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  const isLoading = chartLoading || statsLoading || countLoading;

  /* ── PDF export ────────────────────────────────────────────── */
  const handleExportPDF = () => {
    try {
      const safeCurrency = (val) => formatCurrency(val).replace(/₹/g, 'Rs. ');
      // jsPDF-autotable's export shape varies by bundler — it may be a bare function
      // or an object with a .default method. This wrapper handles both so nobody
      // "simplifies" it to a direct call and breaks PDF export in some build configs.
      const safeAutoTable = (d, opts) => {
        if (typeof autoTable === 'function') {
          autoTable(d, opts);
        } else if (autoTable && typeof autoTable.default === 'function') {
          autoTable.default(d, opts);
        } else {
          throw new Error('autoTable is not a valid function');
        }
      };

      const doc = new jsPDF();
      const today = new Date().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      });

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Zynkly Revenue Report', 14, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(today, 14, 27);

      // Summary line
      doc.setFontSize(11);
      doc.setTextColor(40);
      doc.text(
        `Total Revenue: ${safeCurrency(totalRevenue)}   |   Total Bookings: ${totalBookings}   |   Avg Order Value: ${safeCurrency(avgOrderValue)}`,
        14, 38,
      );

      let y = 48;

      // Revenue by Service table
      if (byService?.length) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Revenue by Service', 14, y);
        y += 2;
        safeAutoTable(doc, {
          startY: y,
          head: [['Service', 'Revenue', 'Bookings']],
          body: byService.map((r) => [
            r.service,
            safeCurrency(r.revenue),
            r.count,
          ]),
          theme: 'striped',
          headStyles: { fillColor: [20, 184, 166] },
          margin: { left: 14 },
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      // Revenue by Area table
      if (byArea?.length) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Revenue by Area', 14, y);
        y += 2;
        safeAutoTable(doc, {
          startY: y,
          head: [['Pincode', 'Revenue', 'Bookings']],
          body: byArea.map((r) => [
            r.pincode,
            safeCurrency(r.revenue),
            r.count,
          ]),
          theme: 'striped',
          headStyles: { fillColor: [99, 102, 241] },
          margin: { left: 14 },
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      // Top Cleaners table
      if (topCleaners?.length) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Top Cleaners', 14, y);
        y += 2;
        safeAutoTable(doc, {
          startY: y,
          head: [['Cleaner', 'Revenue', 'Jobs']],
          body: topCleaners.map((r) => [
            r.cleaner,
            safeCurrency(r.revenue),
            r.jobs,
          ]),
          theme: 'striped',
          headStyles: { fillColor: [245, 158, 11] },
          margin: { left: 14 },
        });
      }

      doc.save('zynkly-revenue-report.pdf');
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Failed to generate PDF: ' + error.message);
    }
  };

  /* ═══════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-stagger-up stagger-1">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Financial Hub</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Real-time revenue analytics and financial health</p>
        </div>
        
        <div className="flex gap-2">
           <Button 
             variant="outline" 
             className="bg-white/50 backdrop-blur-md border-white/80 shadow-sm rounded-xl hover:bg-white/80 text-slate-700" 
             onClick={handleExportPDF}
           >
             <Download className="w-4 h-4 mr-2" /> Export PDF
           </Button>
        </div>
      </div>

      {(isScoped || hasNoPincodes) && (
        <div className="animate-stagger-up stagger-2">
          <ScopeBanner pincodes={assignedPincodes} hasNoPincodes={hasNoPincodes} />
        </div>
      )}

      {/* ── Top 3 hero cards (Total Revenue / Bookings / AOV) ──── */}
      {isLoading ? (
        <SkeletonGrid count={3} cardHeight="h-[180px]" className="grid-cols-1 md:grid-cols-3" />
      ) : statsError ? (
        <p className="text-sm text-red-600 font-medium flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" /> Failed to load revenue stats.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          {/* Total Revenue Box */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-400 border border-teal-300/30 shadow-[0_8px_30px_rgba(20,184,166,0.2)] rounded-[2rem] p-8 flex flex-col relative overflow-hidden animate-stagger-up stagger-2 text-white group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/10 text-white shadow-inner mb-6">
                <IndianRupee className="w-7 h-7" />
              </div>
            </div>
            
            <div className="relative z-10 mt-auto">
              <p className="text-emerald-50 font-bold uppercase tracking-wider text-xs mb-1">Total Revenue</p>
              <h3 className="text-5xl font-black tracking-tighter drop-shadow-md">
                {formatCurrency(totalRevenue)}
              </h3>
            </div>
          </div>

          {/* Bookings Volume Box */}
          <div className="bg-white/70 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 flex flex-col relative overflow-hidden animate-stagger-up stagger-3 ring-1 ring-black/5 inset group transition-all hover:bg-white/90">
            <div className="flex justify-between items-start relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600 shadow-inner mb-6 transition-transform group-hover:scale-110">
                <CalendarDays className="w-7 h-7" />
              </div>
            </div>
            <div className="relative z-10 mt-auto">
              <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Total Bookings</p>
              <h3 className="text-5xl font-black text-slate-900 tracking-tighter drop-shadow-sm">
                {totalBookings}
              </h3>
            </div>
          </div>

          {/* AOV Box */}
          <div className="bg-white/70 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 flex flex-col relative overflow-hidden animate-stagger-up stagger-4 ring-1 ring-black/5 inset group transition-all hover:bg-white/90">
            <div className="flex justify-between items-start relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center border border-sky-100 text-sky-600 shadow-inner mb-6 transition-transform group-hover:scale-110">
                <ShoppingBag className="w-7 h-7" />
              </div>
            </div>
            <div className="relative z-10 mt-auto">
              <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-1">Avg. Order Value</p>
              <h3 className="text-5xl font-black text-slate-900 tracking-tighter drop-shadow-sm">
                {formatCurrency(avgOrderValue)}
              </h3>
            </div>
          </div>

        </div>
      )}

      {/* ── Quick-stat cards (Today / Week / Month / Total) ────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 animate-stagger-up stagger-3">
        {QUICK_STATS.map(({ key, label, Icon, color }) => {
          const c = COLOR_MAP[color];
          return (
            <div
              key={key}
              className="bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 flex flex-col justify-center ring-1 ring-black/5 inset group hover:bg-white/80 transition-colors"
            >
              {statsLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-3 w-24 bg-slate-200/70 rounded-full" />
                  <div className="h-8 w-32 bg-slate-200/70 rounded-full" />
                  <div className="h-3 w-16 bg-slate-200/70 rounded-full" />
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="text-4xl font-black text-slate-900 tracking-tighter drop-shadow-sm">
                      {formatCurrency(revenueStats?.[key] ?? 0)}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center ${c.text} group-hover:scale-110 transition-transform ${c.border} border shadow-inner`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Revenue by Day lookup ────────────────────────────────── */}
      <div className="bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 md:p-8 ring-1 ring-black/5 inset space-y-4 animate-stagger-up stagger-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-white shadow-sm flex items-center justify-center text-slate-600">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Revenue by Day</h3>
            <p className="text-xs text-slate-500 font-medium">Look up revenue for a specific date</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white/70 px-4 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all"
          />

          {dayLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
              Loading…
            </div>
          )}

          {dayError && (
            <p className="text-sm text-red-600 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              Could not fetch data for this date.
            </p>
          )}

          {dayData && !dayLoading && !dayError && (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-slate-900 tracking-tighter">
                {formatCurrency(dayData.revenue)}
              </span>
              <span className="text-sm text-slate-500 font-medium">
                from{' '}
                <span className="font-bold text-slate-700">{dayData.jobs}</span>{' '}
                {dayData.jobs === 1 ? 'job' : 'jobs'}
              </span>
            </div>
          )}

          {!selectedDate && !dayData && (
            <p className="text-sm text-slate-400">Pick a date to see that day's revenue.</p>
          )}
        </div>
      </div>

      {/* ── Revenue Trend Chart (untouched) ──────────────────────── */}
      <div className="bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] ring-1 ring-black/5 inset overflow-hidden animate-stagger-up stagger-5 flex flex-col">
        
        {/* Chart Header & Controls */}
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/50 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-white shadow-sm flex items-center justify-center text-slate-600">
               <LineChart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Revenue Trend</h3>
              <p className="text-sm text-slate-500 font-medium">Visualizing financial growth over time</p>
            </div>
          </div>

          {/* Timeframe Tabs Pill Style */}
          <Tabs value={tab} onValueChange={setTab} className="w-full md:w-auto">
            <TabsList className="bg-slate-200/50 p-1 rounded-2xl">
              <TabsTrigger value="30d" className="rounded-xl px-6 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">30 Days</TabsTrigger>
              <TabsTrigger value="12w" className="rounded-xl px-6 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">12 Weeks</TabsTrigger>
              <TabsTrigger value="12m" className="rounded-xl px-6 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">12 Months</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Chart Render */}
        <div className="p-6 md:p-8 relative z-10 h-[400px]">
          {chartLoading ? (
            <div className="w-full h-full bg-slate-100/50 animate-pulse rounded-2xl" />
          ) : chartError ? (
            <p className="text-sm text-red-600 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Failed to load chart data.
            </p>
          ) : (
            tab === '30d' ? (
              <RevenueChart data={rawData ?? []} days={30} />
            ) : (
              <BarRevenueChart data={rawData ?? []} days={days} />
            )
          )}
        </div>
      </div>

      {/* ── Breakdown sections ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-stagger-up stagger-5">

        {/* Revenue by Service */}
        <div className="bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 md:p-8 ring-1 ring-black/5 inset flex flex-col">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Revenue by Service</h3>
          </div>

          {serviceError ? (
            <p className="text-sm text-red-600 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Failed to load.
            </p>
          ) : serviceLoading ? (
            <SkeletonRows />
          ) : !byService?.length ? (
            <p className="text-sm text-slate-400">No data available.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {byService.map((row, i) => (
                <div key={i} className="flex items-center justify-between py-3 group">
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors truncate max-w-[140px]">
                    {row.service}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-slate-900 tracking-tight">
                      {formatCurrency(row.revenue)}
                    </span>
                    <span className="text-xs font-medium text-slate-400 w-16 text-right">
                      {row.count} {row.count === 1 ? 'booking' : 'bookings'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue by Area */}
        <div className="bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 md:p-8 ring-1 ring-black/5 inset flex flex-col">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 shadow-inner">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Revenue by Area</h3>
          </div>

          {areaError ? (
            <p className="text-sm text-red-600 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Failed to load.
            </p>
          ) : areaLoading ? (
            <SkeletonRows />
          ) : !byArea?.length ? (
            <p className="text-sm text-slate-400">No data available.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {byArea.map((row, i) => (
                <div key={i} className="flex items-center justify-between py-3 group">
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors font-mono">
                    {row.pincode}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-slate-900 tracking-tight">
                      {formatCurrency(row.revenue)}
                    </span>
                    <span className="text-xs font-medium text-slate-400 w-16 text-right">
                      {row.count} {row.count === 1 ? 'booking' : 'bookings'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Cleaners */}
        <div className="bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 md:p-8 ring-1 ring-black/5 inset flex flex-col">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Top Cleaners</h3>
          </div>

          {cleanerError ? (
            <p className="text-sm text-red-600 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Failed to load.
            </p>
          ) : cleanerLoading ? (
            <SkeletonRows />
          ) : !topCleaners?.length ? (
            <p className="text-sm text-slate-400">No data available.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {topCleaners.map((row, i) => (
                <div key={i} className="flex items-center justify-between py-3 group">
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors truncate max-w-[140px]">
                    {row.cleaner}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-slate-900 tracking-tight">
                      {formatCurrency(row.revenue)}
                    </span>
                    <span className="text-xs font-medium text-slate-400 w-12 text-right">
                      {row.jobs} {row.jobs === 1 ? 'job' : 'jobs'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
