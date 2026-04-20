import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { ScopeBanner } from '@/components/shared/ScopeBanner';
import { formatDate } from '@/lib/utils';
import { getCustomers, getCustomersUnscoped } from '@/services/customersService';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { useAdmin } from '@/hooks/useAdmin';

const columns = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ getValue, row }) => (
      <div>
        <p className="font-medium text-sm">{getValue() ?? '—'}</p>
        <p className="text-xs text-muted-foreground">{row.original.email}</p>
      </div>
    ),
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ getValue }) => getValue() ?? '—',
  },
  {
    id: 'bookings',
    header: 'Bookings',
    cell: ({ row }) => {
      const count = row.original.bookings;
      return (
        <span className="font-medium">
          {Array.isArray(count) ? count.length : (count ?? 0)}
        </span>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Joined',
    cell: ({ getValue }) => formatDate(getValue()),
  },
];

/**
 * Customers page — read-only customer list with search and booking count.
 * Scoped to assignedPincodes when the logged-in admin is not a super_admin.
 */
export default function Customers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  const { assignedPincodes, isScoped, hasNoPincodes } = useAdmin();
  const pincodes = isScoped ? assignedPincodes : [];

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', search, pagination.pageIndex, pincodes],
    queryFn: () => {
      if (isScoped) {
        return getCustomers({ search, page: pagination.pageIndex, pageSize: pagination.pageSize, pincodes });
      }
      return getCustomersUnscoped({ search, page: pagination.pageIndex, pageSize: pagination.pageSize });
    },
    keepPreviousData: true,
    staleTime: 60_000,
  });

  const pageCount = data?.count ? Math.ceil(data.count / pagination.pageSize) : undefined;

  return (
    <div className="space-y-4 max-w-7xl">
      <div>
        <h2 className="text-lg font-bold">Customers</h2>
        <p className="text-sm text-muted-foreground">{data?.count ?? 0} registered customers</p>
      </div>

      {(isScoped || hasNoPincodes) && (
        <ScopeBanner pincodes={assignedPincodes} hasNoPincodes={hasNoPincodes} />
      )}
      {error && <div className="text-red-500 font-bold p-4 bg-red-50 rounded">Error loading customers: {error.message}</div>}

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="customer-search"
              className="pl-9"
              placeholder="Search by name, phone, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            onRowClick={(row) => navigate(`/customers/${row.id}`)}
            emptyState={
              <EmptyState
                icon={Users}
                title="No customers found"
                message="No customers match your search."
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
