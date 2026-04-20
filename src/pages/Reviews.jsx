import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { ScopeBanner } from '@/components/shared/ScopeBanner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { getReviews, updateReviewFlag } from '@/services/adminService';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { useAdmin } from '@/hooks/useAdmin';

/**
 * Reviews page — view and moderate customer reviews.
 * Scoped to the admin's assigned pincodes when not super_admin.
 */
export default function Reviews() {
  const queryClient = useQueryClient();
  const [ratingFilter, setRatingFilter] = useState(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  const { assignedPincodes, isScoped, hasNoPincodes } = useAdmin();
  const pincodes = isScoped ? assignedPincodes : [];

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', ratingFilter, pagination.pageIndex, pincodes],
    queryFn: () => getReviews({ rating: ratingFilter, page: pagination.pageIndex, pageSize: pagination.pageSize, pincodes }),
    keepPreviousData: true,
    staleTime: 60_000,
  });

  const flagMutation = useMutation({
    mutationFn: ({ id, flagged }) => updateReviewFlag(id, flagged),
    onSuccess: () => {
      toast.success('Review updated');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const columns = [
    {
      id: 'customer',
      header: 'Customer',
      cell: ({ row }) => row.original.booking?.user?.full_name ?? '—',
    },
    {
      id: 'cleaner',
      header: 'Cleaner',
      cell: ({ row }) => row.original.booking?.cleaner?.name ?? '—',
    },
    {
      id: 'service',
      header: 'Service',
      cell: ({ row }) => row.original.booking?.service?.name ?? '—',
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ getValue }) => {
        const r = getValue();
        return (
          <div className="flex items-center gap-1">
            <span className="text-amber-500">{'★'.repeat(r)}{'☆'.repeat(5 - r)}</span>
            <span className="text-xs text-muted-foreground">({r})</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'comment',
      header: 'Comment',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
          {getValue() || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ getValue }) => formatDate(getValue()),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant={row.original.flagged ? 'destructive' : 'outline'}
          size="sm"
          className="gap-1.5 h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            flagMutation.mutate({ id: row.original.id, flagged: !row.original.flagged });
          }}
        >
          <Flag className="w-3.5 h-3.5" />
          {row.original.flagged ? 'Unflag' : 'Flag'}
        </Button>
      ),
    },
  ];

  const pageCount = data?.count ? Math.ceil(data.count / pagination.pageSize) : undefined;

  return (
    <div className="space-y-4 max-w-7xl">
      <div>
        <h2 className="text-lg font-bold">Reviews</h2>
        <p className="text-sm text-muted-foreground">{data?.count ?? 0} reviews</p>
      </div>

      {(isScoped || hasNoPincodes) && (
        <ScopeBanner pincodes={assignedPincodes} hasNoPincodes={hasNoPincodes} />
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Select
              value={ratingFilter ? String(ratingFilter) : 'all'}
              onValueChange={(v) => { setRatingFilter(v === 'all' ? null : Number(v)); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
            >
              <SelectTrigger className="w-36" id="review-rating-filter">
                <SelectValue placeholder="All ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                {[5, 4, 3, 2, 1].map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {'★'.repeat(r)}{'☆'.repeat(5 - r)} ({r})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            emptyState={
              <EmptyState icon={Star} title="No reviews yet" message="Reviews will appear here once customers rate their bookings." />
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
