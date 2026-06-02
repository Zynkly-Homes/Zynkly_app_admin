import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate, shortId } from '@/lib/utils';

/**
 * Column definitions for the bookings table.
 * Matches the actual Supabase schema:
 *   - users.name (not full_name)
 *   - bookings.total_amount (not total)
 *   - services are joined via booking_services join table
 *   - no payment_status column on bookings
 */
const columns = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 90,
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">{shortId(getValue())}</span>
    ),
  },
  {
    id: 'customer',
    header: 'Customer',
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div>
          <p className="font-medium text-sm">{user?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{user?.phone ?? ''}</p>
        </div>
      );
    },
  },
  {
    id: 'cleaner',
    header: 'Cleaner',
    cell: ({ row }) => row.original.cleaner?.name ?? (
      <span className="text-muted-foreground text-xs">Unassigned</span>
    ),
  },
  {
    accessorKey: 'address',
    header: 'Address',
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]">
        {getValue() ?? '—'}
      </span>
    ),
  },
  {
    accessorKey: 'scheduled_at',
    header: 'Scheduled',
    cell: ({ getValue }) => formatDate(getValue(), 'dd MMM, hh:mm a'),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue()} type="booking" />,
  },
  {
    accessorKey: 'total_amount',
    header: 'Total',
    cell: ({ getValue }) => (
      <span className="font-medium">{formatCurrency(getValue())}</span>
    ),
  },
];

/**
 * BookingsTable — renders the paginated bookings data table.
 */
export function BookingsTable({ data, isLoading, pageCount, pagination, onPaginationChange }) {
  const navigate = useNavigate();

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      pageCount={pageCount}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      onRowClick={(row) => navigate(`/bookings/${row.id}`)}
      emptyState={
        <div className="text-center py-16 text-muted-foreground text-sm">
          No bookings found matching your filters.
        </div>
      }
    />
  );
}
