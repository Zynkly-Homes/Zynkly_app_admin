import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Search, MapPin, Navigation, Globe2, Activity } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonGrid } from '@/components/shared/SkeletonLoader';
import { ScopeBanner } from '@/components/shared/ScopeBanner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getPincodes, upsertPincode, deletePincode } from '@/services/adminService';
import { useAdmin } from '@/hooks/useAdmin';

const pincodeSchema = z.object({
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  is_active: z.boolean().default(true),
});

export default function Pincodes() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const { isSuperAdmin, assignedPincodes, isScoped, hasNoPincodes } = useAdmin();

  const scopePincodes = isScoped ? assignedPincodes : [];

  const { data: pincodes, isLoading } = useQuery({
    queryKey: ['pincodes', scopePincodes],
    queryFn: () => getPincodes({ search: '', pincodes: scopePincodes }),
    staleTime: 120_000,
  });

  const filteredPincodes = useMemo(() => {
    if (!Array.isArray(pincodes)) return [];
    const s = search.toLowerCase();
    return pincodes.filter(
      (p) => String(p.pincode || '').includes(s) || String(p.city || '').toLowerCase().includes(s) || String(p.state || '').toLowerCase().includes(s)
    );
  }, [pincodes, search]);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(pincodeSchema),
    defaultValues: { is_active: true },
  });

  const upsertMutation = useMutation({
    mutationFn: upsertPincode,
    onSuccess: () => {
      toast.success('Pincode settings saved');
      queryClient.invalidateQueries({ queryKey: ['pincodes'] });
      setAddOpen(false);
      reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePincode,
    onSuccess: () => { toast.success('Pincode removed'); queryClient.invalidateQueries({ queryKey: ['pincodes'] }); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-stagger-up stagger-1">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Territories</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {isScoped ? `You have access to ${filteredPincodes.length} assigned locations.` : "Manage active geographic service zones."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              className="pl-9 h-11 bg-white/50 backdrop-blur-md border-white/80 focus:bg-white rounded-xl shadow-sm transition-all"
              placeholder="Search pincode or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {isSuperAdmin && (
            <Button className="w-full sm:w-auto h-11 px-6 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg border-none hover:-translate-y-0.5 transition-all" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Territory
            </Button>
          )}
        </div>
      </div>

      {(isScoped || hasNoPincodes) && <div className="animate-stagger-up stagger-2"><ScopeBanner pincodes={assignedPincodes} hasNoPincodes={hasNoPincodes} /></div>}

      {isLoading ? (
        <SkeletonGrid count={8} cardHeight="h-[160px]" className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" />
      ) : !filteredPincodes.length ? (
        <EmptyState 
          icon={MapPin} 
          title="No territories found" 
          message={isScoped ? "You don't have access to this area." : "Add a pincode to open a new zone."} 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pt-2">
          {filteredPincodes.map((pc, i) => (
            <div 
              key={pc.id}
              className={cn(
                "group relative bg-white border shadow-sm rounded-[1.5rem] p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-md animate-stagger-up",
                pc.is_active ? "border-slate-100" : "border-rose-100 bg-rose-50/50 opacity-75 grayscale-[0.3]",
                `stagger-${(i % 6) + 1}`
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <Navigation className={cn("w-4 h-4", pc.is_active ? "text-emerald-500" : "text-rose-400")} />
                </div>
                
                {isSuperAdmin && (
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-rose-500 hover:bg-rose-100" onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Remove territory ${pc.pincode}? Customers in this area won't be able to book.`)) {
                          deleteMutation.mutate(pc.id);
                        }
                      }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-mono text-2xl font-black tracking-widest text-slate-900 mb-1 leading-none">{pc.pincode}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate"><Globe2 className="w-3 h-3 inline mr-1 opacity-50" />{[pc.city, pc.state].filter(Boolean).join(', ')}</p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider flex items-center gap-1", pc.is_active ? "text-emerald-600" : "text-rose-500")}>
                  <Activity className="w-3 h-3" /> {pc.is_active ? 'Active Zone' : 'Paused Zone'}
                </span>
                
                {isSuperAdmin && (
                  <Switch
                    checked={!!pc.is_active}
                    onCheckedChange={(checked) => upsertMutation.mutate({ ...pc, is_active: checked })}
                    disabled={upsertMutation.isPending && upsertMutation.variables?.id === pc.id}
                    className="scale-75 origin-right data-[state=checked]:bg-emerald-500"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isSuperAdmin && (
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-md rounded-[2rem] p-6 border-white/60 bg-white/95 backdrop-blur-2xl shadow-2xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Globe2 className="w-6 h-6 text-emerald-500" /> New Territory
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit((d) => upsertMutation.mutate(d))} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pc-pincode" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Postal Code *</Label>
                <Input id="pc-pincode" placeholder="411001" {...register('pincode')} className={cn("h-11 rounded-xl bg-slate-50 border-slate-200 font-mono font-bold text-lg tracking-widest", errors.pincode && "border-rose-300 bg-rose-50")} />
                {errors.pincode && <p className="text-xs text-rose-500 font-medium">{errors.pincode.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pc-city" className="text-xs font-bold text-slate-500 uppercase tracking-wider">City *</Label>
                  <Input id="pc-city" placeholder="Pune" {...register('city')} className={cn("h-11 rounded-xl bg-slate-50 border-slate-200", errors.city && "border-rose-300")} />
                  {errors.city && <p className="text-xs text-rose-500 font-medium">{errors.city.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pc-state" className="text-xs font-bold text-slate-500 uppercase tracking-wider">State *</Label>
                  <Input id="pc-state" placeholder="Maharashtra" {...register('state')} className={cn("h-11 rounded-xl bg-slate-50 border-slate-200", errors.state && "border-rose-300")} />
                  {errors.state && <p className="text-xs text-rose-500 font-medium">{errors.state.message}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="space-y-1">
                  <Label htmlFor="pc-active" className="text-sm font-bold text-slate-700">Activate Immediately</Label>
                  <p className="text-xs text-slate-400">Toggle off to create the zone but keep bookings paused.</p>
                </div>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <Switch id="pc-active" checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-emerald-500" />
                  )}
                />
              </div>

              <DialogFooter className="pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" className="rounded-xl font-semibold text-slate-500" onClick={() => setAddOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600">
                  {isSubmitting ? 'Opening Zone...' : 'Open Territory'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
