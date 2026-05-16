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
    <div className="space-y-4 max-w-7xl">
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

      <Card>
        <CardHeader className="pb-3">
          <BookingFilters filters={filters} onFiltersChange={handleFiltersChange} />
        </CardHeader>
        <CardContent className="p-0">
          <BookingsTable
            data={data?.data ?? []}
            isLoading={isLoading}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        </CardContent>
      </Card>
    </div>
  );
}
