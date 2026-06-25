import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BookingsTable } from '@/components/bookings/BookingsTable';
import { BookingFilters } from '@/components/bookings/BookingFilters';
import { ScopeBanner } from '@/components/shared/ScopeBanner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { getBookings } from '@/services/bookingsService';
import { useAdmin } from '@/hooks/useAdmin';

/**
 * BookingsList page — paginated, filterable bookings table.
 * Scoped to assignedPincodes when the logged-in admin is not a super_admin.
 */
export default function BookingsList() {
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  const { assignedPincodes, isScoped, hasNoPincodes } = useAdmin();
  const pincodes = isScoped ? assignedPincodes : [];

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', filters, pagination.pageIndex, pagination.pageSize, pincodes],
    queryFn: () => getBookings({ filters, page: pagination.pageIndex, pageSize: pagination.pageSize, pincodes }),
    keepPreviousData: true,
  });

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPagination((p) => ({ ...p, pageIndex: 0 })); // reset page on filter change
  };

  const pageCount = data?.count
    ? Math.ceil(data.count / pagination.pageSize)
    : undefined;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Bookings</h2>
          <p className="text-sm text-muted-foreground">
            {data?.count ?? 0} total bookings
          </p>
        </div>
      </div>

      {(isScoped || hasNoPincodes) && (
        <ScopeBanner pincodes={assignedPincodes} hasNoPincodes={hasNoPincodes} />
      )}

      <div className="bg-white/40 backdrop-blur-md rounded-3xl p-4 sm:p-6 mb-6 ring-1 ring-black/5 shadow-sm border border-white/60">
        <BookingFilters filters={filters} onFiltersChange={handleFiltersChange} />
      </div>
      
      <BookingsTable
        data={data?.data ?? []}
        isLoading={isLoading}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
    </div>
  );
}
