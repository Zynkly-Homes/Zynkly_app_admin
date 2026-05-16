import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, TrendingUp, Users, Clock, ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SkeletonCardGrid, SkeletonTable } from '@/components/shared/SkeletonLoader';
import { ScopeBanner } from '@/components/shared/ScopeBanner';
import { formatCurrency, formatDate, shortId } from '@/lib/utils';
import { getDashboardStats, getRecentBookings, getRevenueData } from '@/services/bookingsService';
import { useAdmin } from '@/hooks/useAdmin';

/**
 * Stat card component — displays a metric with icon and label.
 */
function StatCard({ title, value, icon: Icon, description, colorClass = 'text-primary bg-primary/10' }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Dashboard home — metric cards, recent bookings, revenue chart.
 * Scoped to assignedPincodes when the logged-in admin is not a super_admin.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { admin, assignedPincodes, isScoped, hasNoPincodes } = useAdmin();

  // Pincodes to pass to all queries — empty array = no filter (super admin)
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

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Good {getGreeting()}, {admin?.name?.split(' ')[0] ?? 'Admin'} 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Here's what's happening with Zynkly today.
        </p>
      </div>

      {/* Scope banner — only visible to non-super-admins */}
      {(isScoped || hasNoPincodes) && (
        <ScopeBanner pincodes={assignedPincodes} hasNoPincodes={hasNoPincodes} />
      )}

      {/* Stat cards */}
      {statsLoading ? (
        <SkeletonCardGrid count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Bookings Today"
            value={stats?.totalToday ?? 0}
            icon={CalendarDays}
            description="New bookings created today"
            colorClass="text-primary bg-primary/10"
          />
          <StatCard
            title="Revenue Today"
            value={formatCurrency(stats?.revenueToday ?? 0)}
            icon={TrendingUp}
            description="From paid bookings today"
            colorClass="text-emerald-600 bg-emerald-100"
          />
          <StatCard
            title="Active Cleaners"
            value={stats?.activeCleaners ?? 0}
            icon={Users}
            description="Currently available"
            colorClass="text-sky-600 bg-sky-100"
          />
          <StatCard
            title="Pending Bookings"
            value={stats?.pendingCount ?? 0}
            icon={Clock}
            description="Awaiting confirmation"
            colorClass="text-amber-600 bg-amber-100"
          />
        </div>
      )}

      {/* Revenue chart + Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-sm font-semibold">Revenue — Last 30 Days</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-muted-foreground"
              onClick={() => navigate('/revenue')}
            >
              Full report <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <RevenueChart data={revenueData ?? []} days={30} />
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'View all bookings', path: '/bookings', icon: CalendarDays },
              { label: 'Manage cleaners', path: '/cleaners', icon: Users },
              { label: 'Pending bookings', path: '/bookings?status=pending', icon: Clock },
              { label: 'Revenue report', path: '/revenue', icon: TrendingUp },
            ].map(({ label, path, icon: Icon }) => (
              <Button
                key={path}
                variant="outline"
                className="w-full justify-start gap-2 h-9 text-sm"
                onClick={() => navigate(path)}
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                {label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent bookings table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold">Recent Bookings</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-muted-foreground"
            onClick={() => navigate('/bookings')}
          >
            See all <ArrowRight className="w-3 h-3" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {bookingsLoading ? (
            <div className="px-4 py-2">
              <SkeletonTable rows={5} cols={6} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['ID', 'Customer', 'Address', 'Scheduled', 'Status', 'Total'].map((h) => (
                      <th key={h} className="h-10 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(recentBookings ?? []).map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground">{shortId(booking.id)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{booking.user?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{booking.user?.phone}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-xs text-muted-foreground truncate">{booking.address ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(booking.scheduled_at, 'dd MMM, hh:mm a')}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} type="booking" />
                      </td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(booking.total_amount)}</td>
                    </tr>
                  ))}
                  {!recentBookings?.length && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        No recent bookings
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
