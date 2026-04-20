import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, IndianRupee, CalendarDays, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RevenueChart, BarRevenueChart } from '@/components/charts/RevenueChart';
import { SkeletonCardGrid } from '@/components/shared/SkeletonLoader';
import { ScopeBanner } from '@/components/shared/ScopeBanner';
import { formatCurrency, exportToCSV } from '@/lib/utils';
import { getRevenueData } from '@/services/bookingsService';
import { useAdmin } from '@/hooks/useAdmin';

/**
 * Revenue page — revenue analytics with period tabs and CSV export.
 * Scoped to the admin's assigned pincodes when not super_admin.
 */
export default function Revenue() {
  const [tab, setTab] = useState('30d');
  const { assignedPincodes, isScoped, hasNoPincodes } = useAdmin();
  const pincodes = isScoped ? assignedPincodes : [];

  const daysMap = { '30d': 30, '12w': 84, '12m': 365 };
  const days = daysMap[tab] ?? 30;

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['revenue', days, pincodes],
    queryFn: () => getRevenueData(days, pincodes),
    staleTime: 120_000,
  });

  // Compute totals from raw data
  const totalRevenue = (rawData ?? []).reduce((s, b) => s + (b.total_amount || 0), 0);
  const totalBookings = rawData?.length ?? 0;
  const avgOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  const handleExport = () => {
    if (!rawData?.length) return;
    const rows = rawData.map((b) => ({
      date: b.scheduled_at?.split('T')[0],
      total: b.total_amount,
    }));
    exportToCSV(rows, `zynkly-revenue-${tab}.csv`);
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Revenue</h2>
          <p className="text-sm text-muted-foreground">Financial analytics and reporting</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      {(isScoped || hasNoPincodes) && (
        <ScopeBanner pincodes={assignedPincodes} hasNoPincodes={hasNoPincodes} />
      )}

      {/* Summary cards */}
      {isLoading ? (
        <SkeletonCardGrid count={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{totalBookings}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg. Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart with period tabs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Revenue Trend</CardTitle>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-8">
              <TabsTrigger value="30d" className="text-xs px-3">30 Days</TabsTrigger>
              <TabsTrigger value="12w" className="text-xs px-3">12 Weeks</TabsTrigger>
              <TabsTrigger value="12m" className="text-xs px-3">12 Months</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {tab === '30d' ? (
            <RevenueChart data={rawData ?? []} days={30} />
          ) : (
            <BarRevenueChart data={rawData ?? []} days={days} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
