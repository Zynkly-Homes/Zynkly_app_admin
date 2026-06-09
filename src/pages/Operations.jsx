import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Power, Zap, Calendar, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { ScopeBanner } from '@/components/shared/ScopeBanner';
import { useAdmin } from '@/hooks/useAdmin';
import {
  getBookingControls,
  updateBookingControls,
  getBlockedSlots,
  createBlockedSlot,
  deleteBlockedSlot,
} from '@/services/operationsService';

// 30-min slots from 00:00 to 23:30
const TIME_SLOTS = (() => {
  const out = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      out.push(`${hh}:${mm}`);
    }
  }
  return out;
})();

function formatSlotTime(t) {
  if (!t) return 'All day';
  // accept 'HH:MM' or 'HH:MM:SS'
  return t.slice(0, 5);
}

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString(undefined, { 
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
  });
}

export default function Operations() {
  const queryClient = useQueryClient();
  const { isSuperAdmin, assignedPincodes, isScoped, hasNoPincodes } = useAdmin();

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    blocked_date: '',
    slot_time: '',        // '' means whole day
    pincode: '',          // '' means global (super_admin only)
    reason: '',
  });

  // ─── Booking controls ─────────────────────────────────────────────
  const { data: controls, isLoading: controlsLoading } = useQuery({
    queryKey: ['booking-controls'],
    queryFn: getBookingControls,
    staleTime: 30_000,
  });

  const controlsMutation = useMutation({
    mutationFn: updateBookingControls,
    onSuccess: () => {
      toast.success('Settings updated');
      queryClient.invalidateQueries({ queryKey: ['booking-controls'] });
    },
    onError: (err) => toast.error(err?.message || 'Update failed'),
  });

  // ─── Blocked slots ───────────────────────────────────────────────
  const { data: blockedSlots, isLoading: slotsLoading } = useQuery({
    queryKey: ['blocked-slots', assignedPincodes, isScoped],
    queryFn: () => getBlockedSlots(isScoped ? assignedPincodes : []),
    staleTime: 30_000,
  });

  const addSlotMutation = useMutation({
    mutationFn: createBlockedSlot,
    onSuccess: () => {
      toast.success('Slot blocked');
      queryClient.invalidateQueries({ queryKey: ['blocked-slots'] });
      setAddOpen(false);
      setForm({ blocked_date: '', slot_time: '', pincode: '', reason: '' });
    },
    onError: (err) => toast.error(err?.message || 'Failed to block slot'),
  });

  const deleteSlotMutation = useMutation({
    mutationFn: deleteBlockedSlot,
    onSuccess: () => {
      toast.success('Block removed');
      queryClient.invalidateQueries({ queryKey: ['blocked-slots'] });
    },
    onError: (err) => toast.error(err?.message || 'Failed to remove block'),
  });

  // For the pincode dropdown in the add form — show admin's allowed pincodes
  // Super_admin sees '' (global) option plus all their available pincodes too,
  // but for simplicity we let super_admin type any pincode manually.
  const handleAddSubmit = () => {
    if (!form.blocked_date) {
      toast.error('Date is required');
      return;
    }
    if (!isSuperAdmin && !form.pincode) {
      toast.error('Pincode is required');
      return;
    }
    if (form.pincode && !/^[0-9]{6}$/.test(form.pincode)) {
      toast.error('Pincode must be 6 digits');
      return;
    }
    if (!isSuperAdmin && !assignedPincodes.includes(form.pincode)) {
      toast.error('You can only block slots in your assigned pincodes');
      return;
    }
    addSlotMutation.mutate({
      blocked_date: form.blocked_date,
      slot_time: form.slot_time ? form.slot_time + ':00' : null,
      pincode: form.pincode || null,
      reason: form.reason || null,
    });
  };

  // Today's date as YYYY-MM-DD for the min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-lg font-bold">Operations</h2>
        <p className="text-sm text-muted-foreground">
          Control booking acceptance and block specific time slots.
        </p>
      </div>

      {(isScoped || hasNoPincodes) && (
        <ScopeBanner pincodes={assignedPincodes} hasNoPincodes={hasNoPincodes} />
      )}

      {/* ─── Master Toggles (super_admin only) ─────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Power className="w-4 h-4 text-primary" />
            Booking Acceptance
          </CardTitle>
          <CardDescription>
            {isSuperAdmin
              ? 'These switches control whether new bookings can be created. Existing bookings continue normally.'
              : 'View-only. Only a super admin can change these settings.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {controlsLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {controls && (
            <>
              {/* Master kill switch */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-muted/30">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    Accept all bookings
                    {!controls.accept_all_bookings && (
                      <Badge variant="destructive" className="text-[10px]">PAUSED</Badge>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Master switch. When off, NO new bookings can be created — regardless of the toggles below.
                  </p>
                </div>
                <Switch
                  checked={controls.accept_all_bookings}
                  disabled={!isSuperAdmin || controlsMutation.isPending}
                  onCheckedChange={(v) => controlsMutation.mutate({ accept_all_bookings: v })}
                />
              </div>

              {/* ASAP switch */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" /> Accept ASAP (Book Now) bookings
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle off when your team is fully occupied right now but can still take future bookings.
                  </p>
                </div>
                <Switch
                  checked={controls.accept_asap_bookings}
                  disabled={!isSuperAdmin || !controls.accept_all_bookings || controlsMutation.isPending}
                  onCheckedChange={(v) => controlsMutation.mutate({ accept_asap_bookings: v })}
                />
              </div>

              {/* Scheduled switch */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Accept scheduled bookings
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle off when you need to stop taking advance bookings (e.g. during a hiring lull).
                  </p>
                </div>
                <Switch
                  checked={controls.accept_scheduled_bookings}
                  disabled={!isSuperAdmin || !controls.accept_all_bookings || controlsMutation.isPending}
                  onCheckedChange={(v) => controlsMutation.mutate({ accept_scheduled_bookings: v })}
                />
              </div>

              {/* Blocked message */}
              {isSuperAdmin && (
                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="blocked-message" className="text-xs">
                    Message shown to users when bookings are paused
                  </Label>
                  <Input
                    id="blocked-message"
                    value={controls.blocked_message ?? ''}
                    onChange={(e) =>
                      // Optimistic local update — only persist on blur
                      queryClient.setQueryData(['booking-controls'], (prev) => 
                        prev ? { ...prev, blocked_message: e.target.value } : prev
                      )
                    }
                    onBlur={(e) =>
                      controlsMutation.mutate({ blocked_message: e.target.value })
                    }
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── Blocked Slots ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-primary" />
              Blocked Slots
            </CardTitle>
            <CardDescription>
              Block specific date+time combinations.
              {isSuperAdmin
                ? ' You can block globally (all pincodes) or for a specific pincode.'
                : ' You can block slots only within your assigned pincodes.'}
            </CardDescription>
          </div>
          <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)} disabled={hasNoPincodes && !isSuperAdmin}>
            <Plus className="w-4 h-4" /> Block a Slot
          </Button>
        </CardHeader>
        <CardContent>
          {slotsLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!slotsLoading && blockedSlots?.length === 0 && (
            <EmptyState
              icon={Calendar}
              title="No blocked slots"
              message="When your team is fully booked for a specific time, block it here so customers can't book it."
            />
          )}
          {blockedSlots && blockedSlots.length > 0 && (
            <div className="divide-y divide-border border rounded-lg overflow-hidden">
              {blockedSlots.map((slot) => (
                <div key={slot.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-sm">
                      <p className="font-medium">{formatDate(slot.blocked_date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSlotTime(slot.slot_time)}
                      </p>
                    </div>
                    {slot.pincode ? (
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {slot.pincode}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <AlertTriangle className="w-3 h-3" /> All pincodes
                      </Badge>
                    )}
                    {slot.reason && (
                      <span className="text-xs text-muted-foreground italic truncate max-w-[200px]">
                        {slot.reason}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive gap-1.5 h-8"
                    onClick={() => deleteSlotMutation.mutate(slot.id)}
                    disabled={deleteSlotMutation.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Add blocked slot dialog ──────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Block a Slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="block-date">Date *</Label>
              <Input
                id="block-date"
                type="date"
                min={today}
                value={form.blocked_date}
                onChange={(e) => setForm((f) => ({ ...f, blocked_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-time">Time slot</Label>
              <Select
                value={form.slot_time || '__all_day__'}
                onValueChange={(v) => setForm((f) => ({ ...f, slot_time: v === '__all_day__' ? '' : v }))}
              >
                <SelectTrigger id="block-time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="__all_day__">All day (whole date)</SelectItem>
                  {TIME_SLOTS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-pincode">
                Pincode {isSuperAdmin ? '(leave blank for global)' : '*'}
              </Label>
              {isSuperAdmin ? (
                <Input
                  id="block-pincode"
                  placeholder="6-digit pincode or blank for all"
                  value={form.pincode}
                  onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
                />
              ) : (
                <Select
                  value={form.pincode || ''}
                  onValueChange={(v) => setForm((f) => ({ ...f, pincode: v }))}
                >
                  <SelectTrigger id="block-pincode">
                    <SelectValue placeholder="Select a pincode" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedPincodes.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-reason">Reason (internal note)</Label>
              <Input
                id="block-reason"
                placeholder="e.g. Team is fully booked"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSubmit} disabled={addSlotMutation.isPending}>
              {addSlotMutation.isPending ? 'Blocking…' : 'Block Slot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
