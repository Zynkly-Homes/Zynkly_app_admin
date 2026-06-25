import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, UserCheck, CheckCircle, XCircle, MapPin, ChevronDown, 
  Sparkles, User, Briefcase, Phone, Mail, Star, Receipt, CalendarClock, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { AssignCleanerModal } from '@/components/bookings/AssignCleanerModal';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SkeletonGrid } from '@/components/shared/SkeletonLoader';
import { getBookingById, updateBookingStatus, assignCleaner } from '@/services/bookingsService';
import { formatCurrency, formatDateTime, shortId, cn } from '@/lib/utils';
import { logAdminAction } from '@/lib/auth';
import useAuthStore from '@/store/authStore';
import { BOOKING_STATUS, BOOKING_STATUS_LABELS } from '@/lib/constants';

/**
 * BookingDetail page — full booking info with actions.
 */
export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { admin } = useAuthStore();

  const [assignOpen, setAssignOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { status, label }

  const { data: booking, isLoading, isError, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBookingById(id),
    enabled: !!id,
    retry: false,
  });

  const statusMutation = useMutation({
    mutationFn: ({ status }) => updateBookingStatus(id, status),
    onSuccess: async (data, { status }) => {
      toast.success(`Booking marked as ${status}`);
      await logAdminAction({ adminId: admin?.id, action: `booking.${status}`, targetType: 'booking', targetId: id });
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err) => toast.error(err.message),
  });

  const assignMutation = useMutation({
    mutationFn: (cleanerId) => assignCleaner(id, cleanerId),
    onSuccess: async () => {
      toast.success('Cleaner assigned successfully');
      await logAdminAction({ adminId: admin?.id, action: 'booking.assign_cleaner', targetType: 'booking', targetId: id });
      setAssignOpen(false);
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
    },
    onError: (err) => { toast.error(err.message); setAssignOpen(false); },
  });

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        <SkeletonGrid count={6} cardHeight="h-[200px]" className="md:grid-cols-2" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-[1600px] mx-auto p-8 bg-rose-50 border border-rose-200 rounded-[2rem] text-rose-600 animate-stagger-up">
        <h3 className="font-black text-xl">Failed to load booking</h3>
        <p className="font-medium mt-2">{error?.message || 'Unknown database error'}</p>
        <Button onClick={() => navigate('/bookings')} variant="outline" className="mt-4 bg-white border-rose-200 hover:bg-rose-50 text-rose-600">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go back
        </Button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-32 text-slate-400 font-bold text-xl animate-stagger-up">
        Booking not found.
      </div>
    );
  }

  const canConfirm = booking.status === BOOKING_STATUS.PENDING;
  const canComplete = booking.status === BOOKING_STATUS.IN_PROGRESS || booking.status === BOOKING_STATUS.CONFIRMED;
  const canCancel = ![BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED].includes(booking.status);

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-10">
      
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-stagger-up stagger-1">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate('/bookings')}
            className="h-12 w-12 rounded-2xl bg-white/60 backdrop-blur-md border-white/80 shadow-sm hover:bg-white text-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
              Booking <span className="text-slate-400 font-mono">#{shortId(booking.id)}</span>
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
              <CalendarClock className="w-4 h-4" /> Created on {formatDateTime(booking.created_at)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <StatusBadge status={booking.status} type="booking" className="px-4 py-2 text-sm rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── LEFT COLUMN (Main Info) ───────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Service Info Box */}
          <div className="bg-white/70 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 ring-1 ring-black/5 animate-stagger-up stagger-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Service Details</h3>
                <p className="text-xs text-slate-500 font-medium">What the customer requested</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <InfoRow 
                icon={<Briefcase />}
                label="Selected Services" 
                value={
                  booking.services?.length
                    ? <span className="font-bold text-slate-800">{booking.services.map(s => s.name).join(', ')}</span>
                    : <span className="italic text-slate-400">None specified</span>
                } 
              />
              <InfoRow 
                icon={<CalendarClock />}
                label="Scheduled For" 
                value={
                  <span className="font-bold text-slate-800">
                    {formatDateTime(booking.scheduled_at)}
                  </span>
                } 
              />
              <InfoRow 
                icon={<Receipt />}
                label="Total Amount" 
                value={
                  <span className="font-black text-xl text-emerald-600">
                    {formatCurrency(booking.total_amount)}
                  </span>
                } 
              />
              <InfoRow 
                icon={<Settings />}
                label="Schedule Type" 
                value={booking.schedule_type ?? 'Standard'} 
              />
            </div>
          </div>

          {/* Address Box */}
          <div className="bg-white/70 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 ring-1 ring-black/5 animate-stagger-up stagger-3">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Location Address</h3>
                <p className="text-xs text-slate-500 font-medium">Where the service will be performed</p>
              </div>
            </div>
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6">
              <p className="text-slate-700 font-medium leading-relaxed text-lg">
                {booking.address ?? <span className="italic text-slate-400">No address provided.</span>}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white/70 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 ring-1 ring-black/5 animate-stagger-up stagger-4 flex flex-col sm:flex-row flex-wrap items-center gap-4 justify-between">
             <div className="space-y-1 w-full sm:w-auto">
               <h3 className="font-bold text-slate-900">Booking Actions</h3>
               <p className="text-xs text-slate-500 font-medium">Advance the workflow state manually</p>
             </div>
             <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {canConfirm && (
                  <Button
                    className="gap-2 h-11 px-6 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-md flex-1 sm:flex-none"
                    onClick={() => setConfirmAction({ status: BOOKING_STATUS.CONFIRMED, label: 'confirm' })}
                  >
                    <CheckCircle className="w-4 h-4" /> Confirm Booking
                  </Button>
                )}
                {canComplete && (
                  <Button
                    variant="outline"
                    className="gap-2 h-11 px-6 rounded-xl border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 shadow-sm flex-1 sm:flex-none"
                    onClick={() => setConfirmAction({ status: BOOKING_STATUS.COMPLETED, label: 'mark as completed' })}
                  >
                    <CheckCircle className="w-4 h-4" /> Mark Complete
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="destructive"
                    className="gap-2 h-11 px-6 rounded-xl shadow-sm flex-1 sm:flex-none"
                    onClick={() => setConfirmAction({ status: BOOKING_STATUS.CANCELLED, label: 'cancel' })}
                  >
                    <XCircle className="w-4 h-4" /> Cancel Booking
                  </Button>
                )}
             </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN (People & Status) ─────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">

          {/* Status Override */}
          <div className="bg-white/70 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 ring-1 ring-black/5 animate-stagger-up stagger-2">
            <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Manual Override</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-12 rounded-xl bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm" disabled={statusMutation.isPending}>
                  <span className="font-semibold text-slate-700">Force Change Status</span>
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-xl border-white/80 bg-white/90 backdrop-blur-xl">
                <DropdownMenuLabel className="font-bold">Select New Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={booking.status}
                  onValueChange={(newStatus) => {
                    if (newStatus === booking.status) return;
                    setConfirmAction({
                      status: newStatus,
                      label: `change status to ${BOOKING_STATUS_LABELS[newStatus]}`,
                    });
                  }}
                >
                  <DropdownMenuRadioItem value={BOOKING_STATUS.PENDING} className="font-medium cursor-pointer">Pending</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={BOOKING_STATUS.CONFIRMED} className="font-medium cursor-pointer">Assigned</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={BOOKING_STATUS.IN_PROGRESS} className="font-medium cursor-pointer">In Process</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value={BOOKING_STATUS.COMPLETED} className="font-medium cursor-pointer text-emerald-600">Completed</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <p className="text-[10px] text-slate-400 font-medium mt-3 leading-relaxed">
              Caution: Overriding the status here bypasses the standard workflow. Only use this if the automated flow fails or for administrative corrections.
            </p>
          </div>

          {/* Customer */}
          <div className="bg-white/70 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 ring-1 ring-black/5 animate-stagger-up stagger-3">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Customer</h3>
            </div>
            <div className="space-y-4">
              <InfoRow label="Name" value={booking.user?.name} icon={<User className="w-3.5 h-3.5 text-slate-400" />} />
              <InfoRow label="Phone" value={booking.user?.phone} icon={<Phone className="w-3.5 h-3.5 text-slate-400" />} />
              <InfoRow label="Email" value={booking.user?.email} icon={<Mail className="w-3.5 h-3.5 text-slate-400" />} />
              {booking.otp && (
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Security OTP</span>
                  <span className="font-mono font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 tracking-widest">{booking.otp}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cleaner */}
          <div className="bg-white/70 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 ring-1 ring-black/5 animate-stagger-up stagger-4 flex flex-col group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 shadow-inner">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Cleaner</h3>
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              {booking.cleaner ? (
                <>
                  <InfoRow label="Name" value={booking.cleaner.name} icon={<User className="w-3.5 h-3.5 text-slate-400" />} />
                  <InfoRow label="Phone" value={booking.cleaner.phone} icon={<Phone className="w-3.5 h-3.5 text-slate-400" />} />
                </>
              ) : (
                <div className="py-4 flex flex-col items-center justify-center text-center">
                  <UserCheck className="w-8 h-8 text-slate-200 mb-2" />
                  <p className="text-sm font-medium text-slate-400">No cleaner assigned yet.</p>
                </div>
              )}
            </div>

            <Button 
              variant={booking.cleaner ? "outline" : "default"}
              className={cn("w-full h-11 rounded-xl gap-2 mt-6", !booking.cleaner && "bg-cyan-600 text-white hover:bg-cyan-700 shadow-md border-none")} 
              onClick={() => setAssignOpen(true)}
            >
              <UserCheck className="w-4 h-4" />
              {booking.cleaner ? 'Reassign Cleaner' : 'Assign Cleaner Now'}
            </Button>
          </div>

          {/* Review */}
          {booking.review && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-6 ring-1 ring-amber-500/10 animate-stagger-up stagger-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
                  <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                </div>
                <h3 className="text-lg font-bold text-amber-900">Customer Rating</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("w-5 h-5", s <= booking.review.rating ? "fill-amber-500 text-amber-500" : "fill-amber-200 text-amber-200")} />
                  ))}
                  <span className="ml-2 text-amber-900 font-black text-lg">{booking.review.rating}/5</span>
                </div>
                {booking.review.comment && (
                  <p className="text-amber-800/80 italic font-medium leading-relaxed bg-white/50 p-4 rounded-xl border border-amber-100 text-sm">
                    "{booking.review.comment}"
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}

      <AssignCleanerModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        booking={booking}
        onAssign={(cleanerId) => assignMutation.mutate(cleanerId)}
        isAssigning={assignMutation.isPending}
      />

      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent className="rounded-3xl border-white/80 bg-white/95 backdrop-blur-2xl shadow-2xl p-6 md:p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-slate-900">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-slate-600 font-medium">
              This will <span className="font-bold text-slate-900">{confirmAction?.label}</span> booking <span className="font-mono text-slate-900">{shortId(booking.id)}</span>. 
              This action may immediately notify the customer via the mobile app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel onClick={() => setConfirmAction(null)} className="h-12 rounded-xl px-6 font-bold text-slate-600 border-slate-200 hover:bg-slate-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                statusMutation.mutate({ status: confirmAction.status });
                setConfirmAction(null);
              }}
              className={cn(
                "h-12 rounded-xl px-8 font-bold shadow-md transition-all border-none",
                confirmAction?.status === BOOKING_STATUS.CANCELLED 
                  ? "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20" 
                  : "bg-slate-900 text-white hover:bg-slate-800"
              )}
            >
              Confirm Action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

// Helper component for uniform rows
function InfoRow({ label, value, icon }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {icon} {label}
      </div>
      <div className="text-sm text-slate-700 break-words font-medium">
        {value ?? <span className="italic text-slate-300">Not provided</span>}
      </div>
    </div>
  );
}
