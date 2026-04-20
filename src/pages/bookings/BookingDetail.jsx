import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, UserCheck, CheckCircle, XCircle, Clock, Loader2, MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AssignCleanerModal } from '@/components/bookings/AssignCleanerModal';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SkeletonTable } from '@/components/shared/SkeletonLoader';
import { getBookingById, updateBookingStatus, assignCleaner } from '@/services/bookingsService';
import { formatCurrency, formatDateTime, shortId } from '@/lib/utils';
import { logAdminAction } from '@/lib/auth';
import useAuthStore from '@/store/authStore';
import { BOOKING_STATUS } from '@/lib/constants';

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

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBookingById(id),
    enabled: !!id,
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
      <div className="max-w-4xl space-y-4">
        <SkeletonTable rows={6} cols={3} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Booking not found.
      </div>
    );
  }

  const canConfirm = booking.status === BOOKING_STATUS.PENDING;
  const canComplete = booking.status === BOOKING_STATUS.IN_PROGRESS || booking.status === BOOKING_STATUS.CONFIRMED;
  const canCancel = ![BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED].includes(booking.status);

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/bookings')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold">Booking {shortId(booking.id)}</h2>
            <p className="text-xs text-muted-foreground">
              Created {formatDateTime(booking.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={booking.status} type="booking" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer info */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Customer</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow label="Name" value={booking.user?.name} />
            <InfoRow label="Phone" value={booking.user?.phone} />
            <InfoRow label="Email" value={booking.user?.email} />
          </CardContent>
        </Card>

        {/* Service info */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Service</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <InfoRow
              label="Service IDs"
              value={
                booking.service_ids?.length
                  ? <span className="font-mono text-xs break-all">{booking.service_ids.join(', ')}</span>
                  : '—'
              }
            />
            <InfoRow label="Total" value={<span className="font-semibold">{formatCurrency(booking.total_amount)}</span>} />
            <InfoRow label="Schedule" value={booking.schedule_type ?? '—'} />
            <InfoRow label="OTP" value={booking.otp ?? '—'} />
            <InfoRow label="Scheduled" value={formatDateTime(booking.scheduled_at)} />
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" /> Address
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-foreground">{booking.address ?? '—'}</p>
          </CardContent>
        </Card>

        {/* Cleaner */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Cleaner</CardTitle>
            <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setAssignOpen(true)}>
              <UserCheck className="w-3.5 h-3.5" />
              {booking.cleaner ? 'Reassign' : 'Assign Cleaner'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {booking.cleaner ? (
              <>
                <InfoRow label="Name" value={booking.cleaner.name} />
                <InfoRow label="Phone" value={booking.cleaner.phone} />
              </>
            ) : (
              <p className="text-muted-foreground text-sm">No cleaner assigned yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Review */}
        {booking.review && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Customer Review</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex items-center gap-1 text-amber-500">
                {'★'.repeat(booking.review.rating)}{'☆'.repeat(5 - booking.review.rating)}
                <span className="ml-2 text-foreground font-medium">{booking.review.rating}/5</span>
              </div>
              {booking.review.comment && (
                <p className="text-muted-foreground italic">"{booking.review.comment}"</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {canConfirm && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setConfirmAction({ status: BOOKING_STATUS.CONFIRMED, label: 'confirm' })}
            >
              <CheckCircle className="w-4 h-4" /> Confirm Booking
            </Button>
          )}
          {canComplete && (
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5"
              onClick={() => setConfirmAction({ status: BOOKING_STATUS.COMPLETED, label: 'mark as completed' })}
            >
              <CheckCircle className="w-4 h-4" /> Mark Complete
            </Button>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={() => setConfirmAction({ status: BOOKING_STATUS.CANCELLED, label: 'cancel' })}
            >
              <XCircle className="w-4 h-4" /> Cancel Booking
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Assign cleaner modal */}
      <AssignCleanerModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        booking={booking}
        onAssign={(cleanerId) => assignMutation.mutate(cleanerId)}
        isAssigning={assignMutation.isPending}
      />

      {/* Status change confirmation */}
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will {confirmAction?.label} booking {shortId(booking.id)}. This action may notify the customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                statusMutation.mutate({ status: confirmAction.status });
                setConfirmAction(null);
              }}
              className={confirmAction?.status === BOOKING_STATUS.CANCELLED ? 'bg-destructive text-white hover:bg-destructive/90' : ''}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-foreground text-right break-all">{value ?? '—'}</span>
    </div>
  );
}
