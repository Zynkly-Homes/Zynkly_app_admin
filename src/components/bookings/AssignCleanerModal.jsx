import { useState, useEffect } from 'react';
import { UserCheck, Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getAvailableCleaners } from '@/services/cleanersService';

/**
 * AssignCleanerModal — modal for selecting an available cleaner for a booking.
 *
 * Cleaners on leave for the booking date are excluded entirely.
 * Cleaners with a conflicting booking (±2h) are shown with a red "Busy" badge
 * and a reason — but the admin can still select and assign them (warning-only).
 *
 * Props:
 *   open          — boolean
 *   onClose       — close callback
 *   booking       — booking object (needs id, scheduled_at, cleaner_id)
 *   onAssign      — callback(cleanerId) triggered on confirm
 *   isAssigning   — loading state for optimistic UX
 */
export function AssignCleanerModal({ open, onClose, booking, onAssign, isAssigning }) {
  const [cleaners, setCleaners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!open || !booking) return;
    setLoading(true);
    // Pass booking.id so the current booking is excluded from the overlap check
    getAvailableCleaners(booking.scheduled_at, booking.id)
      .then(setCleaners)
      .catch(console.error)
      .finally(() => setLoading(false));
    setSelected(booking.cleaner_id ?? null);
  }, [open, booking?.scheduled_at, booking?.cleaner_id, booking?.id]);

  const handleConfirm = () => {
    if (selected) onAssign(selected);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Cleaner</DialogTitle>
          <DialogDescription>
            Select a cleaner for this booking. Cleaners on leave are excluded.
            <span className="text-destructive"> Red badges indicate a scheduling conflict.</span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-2 max-h-72 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading cleaners…</span>
            </div>
          ) : cleaners.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No cleaners available for this date.
            </p>
          ) : (
            cleaners.map((cleaner) => (
              <button
                key={cleaner.id}
                id={`cleaner-${cleaner.id}`}
                onClick={() => setSelected(cleaner.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  selected === cleaner.id
                    ? 'border-primary bg-primary/5'
                    : cleaner.is_busy
                    ? 'border-destructive/30 hover:bg-destructive/5'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {cleaner.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{cleaner.name}</p>
                  <p className="text-xs text-muted-foreground">{cleaner.phone}</p>
                  {/* Conflict reason shown inline — warning only, does not block */}
                  {cleaner.is_busy && cleaner.busy_reason && (
                    <p className="text-xs text-destructive mt-0.5">{cleaner.busy_reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {cleaner.is_busy && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0">
                      Busy
                    </Badge>
                  )}
                  {cleaner.rating && (
                    <Badge variant="secondary" className="text-xs">
                      ⭐ {Number(cleaner.rating).toFixed(1)}
                    </Badge>
                  )}
                  {selected === cleaner.id && (
                    <UserCheck className="w-4 h-4 text-primary" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isAssigning}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selected || isAssigning}
            className="gap-2"
          >
            {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            Assign Cleaner
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
