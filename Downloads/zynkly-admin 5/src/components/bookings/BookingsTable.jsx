import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatCurrency, formatDate, shortId, cn } from '@/lib/utils';
import { BOOKING_STATUS } from '@/lib/constants';
import { updateBookingStatus } from '@/services/bookingsService';
import { Clock, MapPin, ChevronRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusOptions = [
  { value: BOOKING_STATUS.PENDING, label: 'Pending', icon: Loader2, color: 'text-amber-600' },
  { value: BOOKING_STATUS.CONFIRMED, label: 'Confirmed', icon: CheckCircle2, color: 'text-teal-600' },
  { value: BOOKING_STATUS.IN_PROGRESS, label: 'In Progress', icon: Clock, color: 'text-blue-600' },
  { value: BOOKING_STATUS.COMPLETED, label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600' },
  { value: BOOKING_STATUS.CANCELLED, label: 'Cancelled', icon: XCircle, color: 'text-rose-600' },
];

export function BookingsTable({ data, isLoading, pageCount, pagination, onPaginationChange }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, status }) => updateBookingStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err) => toast.error(`Failed to update status: ${err.message}`),
  });

  if (isLoading) {
     return <div className="p-8 flex flex-col gap-4">{[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200/50 animate-pulse rounded-[2rem]" />)}</div>;
  }

  if (!data?.length) {
    return <div className="p-16 text-center text-slate-500 bg-white/40 rounded-[2rem] border border-white/60 shadow-sm mt-4">No bookings found matching your filters.</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 bg-transparent">
      {data.map((booking, i) => (
        <div 
          key={booking.id} 
          className={cn(
            "group relative bg-white/70 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-5 sm:p-6 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 ring-1 ring-black/5 inset cursor-pointer flex flex-col lg:flex-row lg:items-center gap-6 animate-stagger-up",
            `stagger-${(i % 6) + 1}`
          )}
          onClick={() => navigate(`/bookings/${booking.id}`)}
        >
          {/* Timeline Bar Indicator */}
          <div className="absolute left-0 top-6 bottom-6 w-1.5 rounded-r-full bg-gradient-to-b from-teal-400 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* User Info (Left) */}
          <div className="flex items-center gap-4 lg:w-[280px] shrink-0 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 font-bold text-xl uppercase shrink-0">
               {booking.user?.name ? booking.user.name.charAt(0) : '?'}
            </div>
            <div className="min-w-0">
               <p className="font-extrabold text-slate-900 text-lg truncate">{booking.user?.name ?? 'Unknown Customer'}</p>
               <p className="text-sm text-slate-500 font-mono tracking-tight">{shortId(booking.id)}</p>
               {booking.user?.phone && <p className="text-xs text-slate-400 mt-0.5">{booking.user.phone}</p>}
            </div>
          </div>

          {/* Location & Time (Middle) */}
          <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:gap-8 min-w-0 relative z-10">
             <div className="space-y-1">
               <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</p>
               <div className="flex items-start gap-2 text-sm text-slate-700">
                 <MapPin className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                 <span className="line-clamp-2 leading-relaxed max-w-[200px]">{booking.address ?? 'No address provided'}</span>
               </div>
             </div>
             
             <div className="space-y-1">
               <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scheduled</p>
               <div className="flex items-start gap-2 text-sm text-slate-700">
                 <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                 <span className="font-medium leading-relaxed">{formatDate(booking.scheduled_at, 'MMM d, yyyy • h:mm a')}</span>
               </div>
             </div>
          </div>

          {/* Price & Action (Right) */}
          <div className="flex items-center justify-between lg:justify-end gap-6 lg:w-[280px] shrink-0 relative z-10">
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter drop-shadow-sm">{formatCurrency(booking.total_amount)}</p>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div onClick={(e) => e.stopPropagation()} className="hover:scale-105 transition-transform cursor-pointer">
                    <StatusBadge status={booking.status} type="booking" className="rounded-full shadow-sm py-1.5 px-4" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/40 shadow-xl">
                  {statusOptions.map(opt => (
                    <DropdownMenuItem 
                      key={opt.value} 
                      onClick={(e) => { e.stopPropagation(); mutation.mutate({ id: booking.id, status: opt.value }); }}
                      className="rounded-xl px-3 py-2 cursor-pointer transition-colors hover:bg-slate-50 focus:bg-slate-50"
                    >
                      <opt.icon className={cn("w-4 h-4 mr-2", opt.color)} />
                      <span className="font-medium text-slate-700">{opt.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-gradient-to-tr group-hover:from-teal-500 group-hover:to-cyan-400 group-hover:text-white transition-all duration-300 shadow-sm">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>

        </div>
      ))}

      {/* Pagination Controls */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-6 px-4">
          <p className="text-sm text-slate-500 font-medium">Page {pagination.pageIndex + 1} of {pageCount}</p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl bg-white/50 backdrop-blur-md border-white/80 hover:bg-white/80 transition-colors" 
              disabled={pagination.pageIndex === 0}
              onClick={() => onPaginationChange(p => ({ ...p, pageIndex: p.pageIndex - 1 }))}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl bg-white/50 backdrop-blur-md border-white/80 hover:bg-white/80 transition-colors" 
              disabled={pagination.pageIndex >= pageCount - 1}
              onClick={() => onPaginationChange(p => ({ ...p, pageIndex: p.pageIndex + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
