import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format, parseISO, startOfDay, eachDayOfInterval, subDays } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

/**
 * Processes raw booking data into daily revenue aggregates.
 * Fills in zeroes for days with no bookings.
 */
function processRevenueData(rawData, days = 30) {
  if (!rawData || rawData.length === 0) return [];

  const now = new Date();
  const dateRange = eachDayOfInterval({
    start: subDays(now, days - 1),
    end: now,
  });

  // Aggregate revenue by date
  const byDate = {};
  rawData.forEach((booking) => {
    if (!booking.scheduled_at) return;
    try {
      const day = format(parseISO(booking.scheduled_at), 'yyyy-MM-dd');
      // Use total_amount (DB column) or total (legacy/fallback)
      const amount = booking.total_amount ?? booking.total ?? 0;
      byDate[day] = (byDate[day] || 0) + amount;
    } catch (e) {
      console.warn('[RevenueChart] Invalid date in booking:', booking.scheduled_at);
    }
  });

  return dateRange.map((date) => {
    const key = format(date, 'yyyy-MM-dd');
    return {
      date: format(date, 'MMM d'),
      revenue: byDate[key] || 0,
    };
  });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-semibold" style={{ color: entry.color }}>
          {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

/**
 * RevenueChart — area chart for daily revenue.
 * 
 * Props:
 *   data  — raw revenue data from bookingsService.getRevenueData()
 *   days  — number of days to show
 */
export function RevenueChart({ data, days = 30 }) {
  const chartData = useMemo(() => processRevenueData(data, days), [data, days]);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(180, 65%, 38%)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="hsl(180, 65%, 38%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          interval={Math.floor(chartData.length / 6)}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(180, 65%, 38%)"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={false}
          activeDot={{ r: 4, fill: 'hsl(180, 65%, 38%)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/**
 * BarRevenueChart — bar chart variant for comparison views.
 */
export function BarRevenueChart({ data, days = 30 }) {
  const chartData = useMemo(() => processRevenueData(data, days), [data, days]);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          interval={Math.floor(chartData.length / 6)}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="revenue"
          fill="hsl(180, 65%, 38%)"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
