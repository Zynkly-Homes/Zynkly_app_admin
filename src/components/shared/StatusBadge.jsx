import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { BOOKING_STATUS, PAYMENT_STATUS } from '@/lib/constants';

/**
 * Status badge for booking status values.
 * Normalises status to UPPERCASE before lookup so it handles both
 * DB-stored uppercase values ('PENDING') and lowercase ('pending').
 */
export function StatusBadge({ status, type = 'booking' }) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>;

  if (type === 'booking') {
    const variants = {
      PENDING: 'warning',
      CONFIRMED: 'info',
      IN_PROGRESS: 'default',
      COMPLETED: 'success',
      CANCELLED: 'destructive',
    };
    const labels = {
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    };
    // Normalise so both 'PENDING' and 'pending' from the DB render correctly
    const key = status.toUpperCase().replace(/ /g, '_');
    return <Badge variant={variants[key] ?? 'muted'}>{labels[key] ?? status}</Badge>;
  }

  if (type === 'payment') {
    const variants = {
      [PAYMENT_STATUS.PENDING]: 'warning',
      [PAYMENT_STATUS.PAID]: 'success',
      [PAYMENT_STATUS.FAILED]: 'destructive',
      [PAYMENT_STATUS.REFUNDED]: 'muted',
    };
    const labels = {
      pending: 'Pending',
      paid: 'Paid',
      failed: 'Failed',
      refunded: 'Refunded',
    };
    return <Badge variant={variants[status] ?? 'muted'}>{labels[status] ?? status}</Badge>;
  }

  return <Badge variant="muted">{status}</Badge>;
}
