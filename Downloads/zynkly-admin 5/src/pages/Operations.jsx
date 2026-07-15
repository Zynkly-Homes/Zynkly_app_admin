import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Power, Zap, Calendar, Plus, Trash2, AlertTriangle, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
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
import { ScopeBanner } from '@/components/shared/ScopeBanner';
import { useAdmin } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';
import {
  getBookingControls, updateBookingControls, getBlockedSlots, createBlockedSlot, deleteBlockedSlot,
} from '@/services/operationsService';

const TIME_SLOTS = (() => {
  const out = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return out;
})();

function formatSlotTime(t) { return !t ? 'All day' : t.slice(0, 5); }
function formatDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Operations() {
  const queryClient = useQueryClient();
  const { isSuperAdmin, assignedPincodes, isScoped, hasNoPincodes } = useAdmin();

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ blocked_date: '', slot_time: '', pincode: '', reason: '' });

  const { data: controls, isLoading: controlsLoading } = useQuery({ queryKey: ['booking-controls'], queryFn: getBookingControls, staleTime: 30_000 });
  const controlsMutation = useMutation({
    mutationFn: updateBookingControls,
    onSuccess: () => { toast.success('Settings updated'); queryClient.invalidateQueries({ queryKey: ['booking-controls'] }); },
    onError: (err) => toast.error(err?.message || 'Update failed'),
  });

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
    onSuccess: () => { toast.success('Block removed'); queryClient.invalidateQueries({ queryKey: ['blocked-slots'] }); },
    onError: (err) => toast.error(err?.message || 'Failed to remove block'),
  });

  const handleAddSubmit = () => {
    if (!form.blocked_date) return toast.error('Date is required');
    if (!isSuperAdmin && !form.pincode) return toast.error('Pincode is required');
    if (form.pincode && !/^[0-9]{6}$/.test(form.pincode)) return toast.error('Pincode must be 6 digits');
    if (!isSuperAdmin && !assignedPincodes.includes(form.pincode)) return toast.error('You can only block slots in your assigned pincodes');
    addSlotMutation.mutate({
      blocked_date: form.blocked_date, slot_time: form.slot_time ? form.slot_time + ':00' : null, pincode: form.pincode || null, reason: form.reason || null,
    });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-stagger-up stagger-1">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Operations Control</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage global booking acceptance and block out dates.</p>
        </div>
        <Button className="w-full sm:w-auto h-11 px-6 rounded-xl bg-slate-900 text-white shadow-md hover:shadow-lg border-none hover:-translate-y-0.5 transition-all" onClick={() => setAddOpen(true)} disabled={hasNoPincodes && !isSuperAdmin}>
          <Plus className="w-4 h-4 mr-2" /> Block Slot
        </Button>
      </div>

      {(isScoped || hasNoPincodes) && <div className="animate-stagger-up stagger-2"><ScopeBanner pincodes={assignedPincodes} hasNoPincodes={hasNoPincodes} /></div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Master Toggles */}
        <div className="lg:col-span-2 space-y-6 animate-stagger-up stagger-3">
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Power className="w-5 h-5 text-indigo-500" /> Booking Engines
                </h3>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  {isSuperAdmin ? 'Master switches controlling all incoming bookings.' : 'View-only. Contact super admin to change.'}
                </p>
              </div>
              {!controls?.accept_all_bookings && !controlsLoading && (
                <div className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-rose-100 animate-pulse">
                  <ShieldAlert className="w-4 h-4" /> SYSTEM PAUSED
                </div>
              )}
            </div>

            {controlsLoading ? (
              <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
            ) : controls && (
              <div className="space-y-4">
                {/* Master Kill Switch */}
                <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border transition-all duration-300", controls.accept_all_bookings ? "bg-white border-slate-200" : "bg-rose-50/50 border-rose-200")}>
                  <div className="space-y-1 pr-6">
                    <Label className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Power className={cn("w-5 h-5", controls.accept_all_bookings ? "text-emerald-500" : "text-rose-500")} /> Master Booking Switch
                    </Label>
                    <p className="text-sm text-slate-500">When disabled, the customer app will completely stop accepting any new bookings across all pincodes.</p>
                  </div>
                  <Switch 
                    checked={controls.accept_all_bookings} 
                    disabled={!isSuperAdmin || controlsMutation.isPending} 
                    onCheckedChange={(v) => controlsMutation.mutate({ accept_all_bookings: v })} 
                    className={cn("scale-125 shrink-0", controls.accept_all_bookings && "data-[state=checked]:bg-emerald-500")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ASAP Switch */}
                  <div className={cn("flex flex-col justify-between gap-4 p-6 rounded-2xl border transition-all duration-300", controls.accept_asap_bookings ? "bg-slate-50/50 border-slate-200" : "bg-slate-100/50 border-slate-200 opacity-75")}>
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center mb-2"><Zap className="w-5 h-5" /></div>
                      <Label className="text-base font-bold text-slate-900 block">ASAP Bookings</Label>
                      <p className="text-xs text-slate-500 leading-relaxed">Turn off if your workforce is currently fully deployed and cannot take immediate dispatch requests.</p>
                    </div>
                    <div className="pt-4 border-t border-slate-200/60 flex justify-end">
                      <Switch 
                        checked={controls.accept_asap_bookings} 
                        disabled={!isSuperAdmin || !controls.accept_all_bookings || controlsMutation.isPending} 
                        onCheckedChange={(v) => controlsMutation.mutate({ accept_asap_bookings: v })} 
                        className="data-[state=checked]:bg-cyan-500 scale-110"
                      />
                    </div>
                  </div>

                  {/* Scheduled Switch */}
                  <div className={cn("flex flex-col justify-between gap-4 p-6 rounded-2xl border transition-all duration-300", controls.accept_scheduled_bookings ? "bg-slate-50/50 border-slate-200" : "bg-slate-100/50 border-slate-200 opacity-75")}>
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-2"><Calendar className="w-5 h-5" /></div>
                      <Label className="text-base font-bold text-slate-900 block">Scheduled Bookings</Label>
                      <p className="text-xs text-slate-500 leading-relaxed">Turn off to stop taking future bookings. Useful for system maintenance or extended team holidays.</p>
                    </div>
                    <div className="pt-4 border-t border-slate-200/60 flex justify-end">
                      <Switch 
                        checked={controls.accept_scheduled_bookings} 
                        disabled={!isSuperAdmin || !controls.accept_all_bookings || controlsMutation.isPending} 
                        onCheckedChange={(v) => controlsMutation.mutate({ accept_scheduled_bookings: v })} 
                        className="data-[state=checked]:bg-purple-500 scale-110"
                      />
                    </div>
                  </div>
                </div>

                {isSuperAdmin && !controls.accept_all_bookings && (
                  <div className="mt-6 p-6 bg-rose-50 border border-rose-100 rounded-2xl space-y-3">
                    <Label htmlFor="blocked-message" className="text-sm font-bold text-rose-900 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Outage Message (Customer Facing)
                    </Label>
                    <p className="text-xs text-rose-700">This message is shown in the app when users try to book while the system is paused.</p>
                    <Input
                      id="blocked-message"
                      className="bg-white border-rose-200 text-slate-900 focus-visible:ring-rose-500"
                      value={controls.blocked_message ?? ''}
                      onChange={(e) => queryClient.setQueryData(['booking-controls'], (prev) => prev ? { ...prev, blocked_message: e.target.value } : prev)}
                      onBlur={(e) => controlsMutation.mutate({ blocked_message: e.target.value })}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Blocked Slots */}
        <div className="lg:col-span-1 animate-stagger-up stagger-4">
          <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" /> Blocked Calendar
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {slotsLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
              ) : !blockedSlots?.length ? (
                <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">No active blocks</p>
                  <p className="text-xs text-slate-500 mt-1">The calendar is fully open according to standard operating hours.</p>
                </div>
              ) : (
                blockedSlots.map((slot) => (
                  <div key={slot.id} className="group relative bg-white border border-slate-200 p-4 rounded-2xl hover:border-amber-300 hover:shadow-md transition-all flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{formatDate(slot.blocked_date)}</p>
                        <p className="text-xs font-mono text-slate-500 mt-0.5">{formatSlotTime(slot.slot_time)}</p>
                      </div>
                      {slot.pincode ? (
                        <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 text-slate-600 border-slate-200">{slot.pincode}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 flex items-center gap-1 border-none"><AlertTriangle className="w-3 h-3" /> Global</Badge>
                      )}
                    </div>
                    {slot.reason && <p className="text-xs text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg line-clamp-2">{slot.reason}</p>}
                    
                    <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteSlotMutation.mutate(slot.id)} disabled={deleteSlotMutation.isPending}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            
            <div className="pt-4 mt-4 border-t border-slate-100">
              <Button className="w-full h-12 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 shadow-sm" onClick={() => setAddOpen(true)} disabled={hasNoPincodes && !isSuperAdmin}>
                <Plus className="w-4 h-4 mr-2 text-slate-400" /> New Blocked Slot
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add blocked slot dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm rounded-[2rem] p-6 border-white/60 bg-white/95 backdrop-blur-2xl shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" /> Block Time
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="block-date" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date *</Label>
              <Input id="block-date" type="date" min={today} value={form.blocked_date} onChange={(e) => setForm((f) => ({ ...f, blocked_date: e.target.value }))} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-time" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Time Slot</Label>
              <Select value={form.slot_time || '__all_day__'} onValueChange={(v) => setForm((f) => ({ ...f, slot_time: v === '__all_day__' ? '' : v }))}>
                <SelectTrigger id="block-time" className="h-11 rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72 rounded-xl border-slate-200 shadow-xl">
                  <SelectItem value="__all_day__" className="font-bold text-amber-700">All day (whole date)</SelectItem>
                  {TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-pincode" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Scope {isSuperAdmin ? '(Global if blank)' : '*'}
              </Label>
              {isSuperAdmin ? (
                <Input id="block-pincode" placeholder="6-digit pincode or blank" value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))} className="h-11 rounded-xl bg-slate-50 border-slate-200 font-mono" />
              ) : (
                <Select value={form.pincode || ''} onValueChange={(v) => setForm((f) => ({ ...f, pincode: v }))}>
                  <SelectTrigger id="block-pincode" className="h-11 rounded-xl bg-slate-50 border-slate-200 font-mono">
                    <SelectValue placeholder="Select a pincode" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    {assignedPincodes.map((p) => <SelectItem key={p} value={p} className="font-mono">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-reason" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason (Internal)</Label>
              <Input id="block-reason" placeholder="e.g. Team fully booked" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
            </div>
          </div>
          <DialogFooter className="pt-4 border-t border-slate-100">
            <Button variant="ghost" className="rounded-xl font-semibold text-slate-500" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-amber-500 text-white font-bold shadow-lg shadow-amber-500/20 hover:bg-amber-600" onClick={handleAddSubmit} disabled={addSlotMutation.isPending}>
              {addSlotMutation.isPending ? 'Blocking…' : 'Confirm Block'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
