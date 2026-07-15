import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Flag, MessageSquare, ShieldAlert, User, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonGrid } from '@/components/shared/SkeletonLoader';
import { ScopeBanner } from '@/components/shared/ScopeBanner';
import { formatDate, cn } from '@/lib/utils';
import { getReviews, updateReviewFlag } from '@/services/adminService';
import { GRID_PAGE_SIZE } from '@/lib/constants';
import { useAdmin } from '@/hooks/useAdmin';

export default function Reviews() {
  const queryClient = useQueryClient();
  const [ratingFilter, setRatingFilter] = useState(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: GRID_PAGE_SIZE });
  const { assignedPincodes, isScoped, hasNoPincodes } = useAdmin();
  const pincodes = isScoped ? assignedPincodes : [];

  const { data, isLoading, error } = useQuery({
    queryKey: ['reviews', ratingFilter, pagination.pageIndex, pincodes],
    queryFn: () => getReviews({ rating: ratingFilter, page: pagination.pageIndex, pageSize: pagination.pageSize, pincodes }),
    keepPreviousData: true,
    staleTime: 60_000,
  });

  const flagMutation = useMutation({
    mutationFn: ({ id, flagged }) => updateReviewFlag(id, flagged),
    onSuccess: (_, variables) => {
      toast.success(variables.flagged ? 'Review flagged for moderation' : 'Review unflagged');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const pageCount = data?.count ? Math.ceil(data.count / pagination.pageSize) : undefined;
  const reviewsList = data?.data ?? [];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* Header & Pill Filters */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-stagger-up stagger-1">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Customer Reviews</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {data?.count ?? 0} reviews • Real-time feedback monitor
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { value: null, label: 'All Reviews' },
            { value: 5, label: '5 Stars', icon: <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> },
            { value: 4, label: '4 Stars', icon: <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> },
            { value: 3, label: '3 Stars', icon: <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" /> },
            { value: 2, label: '2 Stars', icon: <Star className="w-3.5 h-3.5 fill-orange-400 text-orange-400" /> },
            { value: 1, label: '1 Star', icon: <Star className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> },
          ].map((filter) => {
            const isActive = ratingFilter === filter.value;
            return (
              <Button
                key={filter.value || 'all'}
                variant={isActive ? 'default' : 'outline'}
                onClick={() => { setRatingFilter(filter.value); setPagination(p => ({ ...p, pageIndex: 0 })); }}
                className={cn(
                  "rounded-full h-9 px-4 text-xs font-bold transition-all shadow-sm",
                  isActive 
                    ? "bg-slate-900 text-white hover:bg-slate-800" 
                    : "bg-white/60 backdrop-blur-md border-white/80 text-slate-600 hover:bg-white"
                )}
              >
                {filter.icon && <span className="mr-1.5">{filter.icon}</span>}
                {filter.label}
              </Button>
            );
          })}
        </div>
      </div>

      {(isScoped || hasNoPincodes) && (
        <div className="animate-stagger-up stagger-2">
          <ScopeBanner pincodes={assignedPincodes} hasNoPincodes={hasNoPincodes} />
        </div>
      )}

      {error && (
        <div className="text-rose-600 font-bold p-4 bg-rose-50 rounded-2xl border border-rose-200 shadow-sm animate-stagger-up stagger-2">
          Error loading reviews: {error.message}
        </div>
      )}

      {/* Masonry Grid */}
      {isLoading ? (
        <SkeletonGrid count={8} cardHeight="h-[220px]" className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
      ) : !reviewsList.length ? (
        <EmptyState 
          icon={MessageSquare} 
          title="No reviews found" 
          message="Try selecting a different rating filter, or wait for new reviews to come in." 
        />
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 pt-2">
          {reviewsList.map((review, i) => {
            const isNegative = review.rating <= 2;
            const r = review.rating || 0;
            
            return (
              <div 
                key={review.id}
                className={cn(
                  "break-inside-avoid mb-6 relative bg-white/70 backdrop-blur-3xl border shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 ring-1 inset animate-stagger-up group flex flex-col",
                  `stagger-${(i % 6) + 1}`,
                  review.flagged ? "border-rose-200 bg-rose-50/50 ring-rose-500/20" : "border-white/80 ring-black/5"
                )}
              >
                {/* Floating Flag Button */}
                <div className="absolute top-4 right-4 z-20">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => flagMutation.mutate({ id: review.id, flagged: !review.flagged })}
                    className={cn(
                      "h-9 w-9 rounded-full shadow-sm transition-all",
                      review.flagged 
                        ? "bg-rose-100 text-rose-600 hover:bg-rose-200 hover:text-rose-700" 
                        : "bg-white/80 text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100"
                    )}
                    title={review.flagged ? "Unflag review" : "Flag for moderation"}
                  >
                    <Flag className={cn("w-4 h-4", review.flagged ? "fill-rose-500" : "")} />
                  </Button>
                </div>

                {/* Rating Stars & Date */}
                <div className="flex items-center gap-3 mb-4 pr-10">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={cn(
                          "w-5 h-5",
                          star <= r 
                            ? "fill-amber-400 text-amber-400 drop-shadow-sm" 
                            : "fill-slate-100 text-slate-200"
                        )} 
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {formatDate(review.created_at, 'MMM d, yyyy')}
                  </span>
                </div>

                {/* Comment Body */}
                <div className="mb-6 flex-1">
                  {review.comment ? (
                    <p className={cn(
                      "text-slate-700 leading-relaxed",
                      review.comment.length > 100 ? "text-sm" : "text-base font-medium"
                    )}>
                      "{review.comment}"
                    </p>
                  ) : (
                    <p className="text-slate-400 text-sm italic">No written feedback provided.</p>
                  )}
                </div>

                {/* Meta Information (Customer & Cleaner) */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  {/* Customer */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {review.booking?.user?.full_name ?? 'Unknown Customer'}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold truncate">
                        {review.booking?.service?.name ?? 'General Service'}
                      </p>
                    </div>
                  </div>

                  {/* Cleaner */}
                  <div className="flex items-center gap-3 pl-3 ml-1 border-l-2 border-slate-100">
                    <div className="w-6 h-6 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0">
                      <Sparkles className="w-3 h-3" />
                    </div>
                    <div className="min-w-0 flex-1 flex justify-between items-center">
                      <p className="text-xs font-medium text-slate-600 truncate">
                        Cleaned by <span className="font-bold text-slate-800">{review.booking?.cleaner?.name ?? 'Unknown'}</span>
                      </p>
                      {isNegative && !review.flagged && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-rose-500 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-md">
                          <AlertCircle className="w-3 h-3" />
                          Review
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between pt-6 px-2">
          <p className="text-sm text-slate-500 font-medium">Page {pagination.pageIndex + 1} of {pageCount}</p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl bg-white/50 backdrop-blur-md border-white/80 hover:bg-white/80 transition-colors shadow-sm font-semibold" 
              disabled={pagination.pageIndex === 0}
              onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex - 1 }))}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl bg-white/50 backdrop-blur-md border-white/80 hover:bg-white/80 transition-colors shadow-sm font-semibold" 
              disabled={pagination.pageIndex >= pageCount - 1}
              onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
