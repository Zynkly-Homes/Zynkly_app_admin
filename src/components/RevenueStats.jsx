import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IndianRupee, TrendingUp, Calendar, Sun, Search, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAdmin } from '@/hooks/useAdmin';

/**
 * Single place to format a monetary value for display.
 * Currently assumes the DB stores amounts in rupees.
 * If it turns out amounts are in paise, just uncomment the division below.
 */
function formatMoney(value) {
  const amount = Number(value) || 0;
  // return (amount / 100).toLocaleString('en-IN');   // ← uncomment if stored in paise
  return amount.toLocaleString('en-IN');
}

/* ── card config ─────────────────────────────────────────────── */
const STAT_CARDS = [
  { key: 'total',  label: 'Total Revenue',  sub: 'All time',    Icon: IndianRupee, color: 'teal'   },
  { key: 'month',  label: 'This Month',     sub: 'Monthly',     Icon: TrendingUp,  color: 'cyan'   },
  { key: 'week',   label: 'This Week',      sub: 'Weekly',      Icon: Calendar,    color: 'indigo' },
  { key: 'today',  label: 'Today',          sub: 'Daily',       Icon: Sun,         color: 'amber'  },
];

/* ── colour tokens (Tailwind can't interpolate template strings) */
const COLOR_MAP = {
  teal:   { bg: 'bg-teal-500/10',   border: 'border-teal-500/20', text: 'text-teal-600'   },
  cyan:   { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/20', text: 'text-cyan-600'   },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-600' },
  amber:  { bg: 'bg-amber-500/10',  border: 'border-amber-500/20', text: 'text-amber-600'  },
};

/* ═══════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════ */
export default function RevenueStats() {
  const { isAdmin } = useAdmin();
  const [selectedDate, setSelectedDate] = useState('');

  /* ── aggregate stats ──────────────────────────────────────── */
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: ['revenue-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_revenue_stats');
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  /* ── per-day lookup ───────────────────────────────────────── */
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

  /* ── gate: admins only ────────────────────────────────────── */
  if (!isAdmin) return null;

  /* ── render ───────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Section heading */}
      <div className="px-2">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          Revenue Breakdown
        </h3>
      </div>

      {/* ── Stat cards ───────────────────────────────────────── */}
      {statsError ? (
        <div className="bg-red-50/60 backdrop-blur-xl border border-red-200/60 rounded-[2rem] p-6 flex items-center gap-3 text-red-700 ring-1 ring-red-200/30">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">
            Failed to load revenue stats. Please try refreshing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
          {STAT_CARDS.map(({ key, label, sub, Icon, color }) => {
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
                      <p className="text-sm font-medium text-slate-500">
                        {label}
                      </p>
                      <div className="flex items-end gap-2">
                        <p className="text-4xl font-black text-slate-900 tracking-tighter drop-shadow-sm">
                          ₹{formatMoney(stats?.[key])}
                        </p>
                        <p className="text-sm text-slate-400 mb-1 font-medium">
                          {sub}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center ${c.text} group-hover:scale-110 transition-transform ${c.border} border shadow-inner`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Day lookup ───────────────────────────────────────── */}
      <div className="bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 ring-1 ring-black/5 inset space-y-4">
        <p className="text-sm font-medium text-slate-500">Revenue by Day</p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white/70 px-4 pr-10 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 transition-all"
            />
            <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>

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
                ₹{formatMoney(dayData.revenue)}
              </span>
              <span className="text-sm text-slate-500 font-medium">
                from{' '}
                <span className="font-bold text-slate-700">
                  {dayData.jobs}
                </span>{' '}
                {dayData.jobs === 1 ? 'job' : 'jobs'}
              </span>
            </div>
          )}

          {!selectedDate && !dayData && (
            <p className="text-sm text-slate-400">
              Pick a date to see that day's revenue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
