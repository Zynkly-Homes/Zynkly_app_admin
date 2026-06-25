import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, UserCheck, Phone, MapPin, Star, MoreVertical } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScopeBanner } from '@/components/shared/ScopeBanner';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonGrid } from '@/components/shared/SkeletonLoader';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getCleaners, createCleaner, updateCleanerStatus } from '@/services/cleanersService';
import { DEFAULT_PAGE_SIZE, GRID_PAGE_SIZE } from '@/lib/constants';
import { useAdmin } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';

const cleanerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[+]?[0-9]{8,15}$/, 'Enter a valid phone number'),
  username: z.string()
    .regex(/^[a-z0-9_]{3,30}$/i, '3–30 chars, letters/digits/underscore only')
    .transform((v) => v.toLowerCase()),
  password: z.string().min(6, 'Min 6 characters'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be exactly 6 digits'),
  transport: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
});

export default function CleanersList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: GRID_PAGE_SIZE });
  const { assignedPincodes, isScoped, hasNoPincodes } = useAdmin();
  const pincodes = isScoped ? assignedPincodes : [];

  const { data, isLoading, error } = useQuery({
    queryKey: ['cleaners', search, pagination.pageIndex, pincodes],
    queryFn: () => getCleaners({ search, page: pagination.pageIndex, pageSize: pagination.pageSize, pincodes }),
    keepPreviousData: true,
    staleTime: 60_000,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(cleanerSchema),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateCleanerStatus(id, status),
    onSuccess: (_, variables) => {
      toast.success(`Status updated to ${variables.status}`);
      queryClient.invalidateQueries({ queryKey: ['cleaners'] });
    },
    onError: (err) => {
      console.error('Status update mutation failed:', err);
      toast.error(`Failed to update status: ${err.message}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (formData) => {
      const cleaned = Object.fromEntries(
        Object.entries(formData).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      );
      return createCleaner(cleaned);
    },
    onSuccess: (response) => {
      toast.success('Cleaner created successfully');
      queryClient.invalidateQueries({ queryKey: ['cleaners'] });
      setAddOpen(false);
      reset();
      setCredentialsModal({
        login_email: response.credentials.login_email,
        password: response.credentials.password,
        cleaner_name: response.cleaner.name,
      });
    },
    onError: (err) => {
      console.error('[AddCleaner] create failed', err);
      toast.error(err?.message || 'Failed to create cleaner');
    },
  });

  useEffect(() => {
    if (addOpen) createMutation.reset();
  }, [addOpen, createMutation]);

  const pageCount = data?.count ? Math.ceil(data.count / pagination.pageSize) : undefined;
  const cleanersList = data?.data ?? [];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-stagger-up stagger-1">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Cleaners</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">{data?.count ?? 0} active cleaners</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              className="pl-9 h-11 bg-white/50 backdrop-blur-md border-white/80 focus:bg-white rounded-xl shadow-sm transition-all"
              placeholder="Search cleaners..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
            />
          </div>
          <Button className="w-full sm:w-auto h-11 px-6 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-white shadow-md hover:shadow-lg border-none hover:-translate-y-0.5 transition-all" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Cleaner
          </Button>
        </div>
      </div>

      {(isScoped || hasNoPincodes) && (
        <div className="animate-stagger-up stagger-2">
          <ScopeBanner pincodes={assignedPincodes} hasNoPincodes={hasNoPincodes} />
        </div>
      )}

      {error && <div className="text-rose-600 font-bold p-4 bg-rose-50 rounded-2xl border border-rose-200 shadow-sm animate-stagger-up stagger-2">Error loading cleaners: {error.message}</div>}

      {isLoading ? (
        <SkeletonGrid count={8} cardHeight="h-[280px]" />
      ) : !cleanersList.length ? (
        <EmptyState 
          icon={UserCheck} 
          title="No cleaners found" 
          message="Try adjusting your search query or add a new cleaner." 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pt-2">
          {cleanersList.map((cleaner, i) => {
            let label = 'Busy';
            let color = 'bg-rose-500';
            let gradient = 'from-rose-500/10 to-pink-500/10';

            if (cleaner.is_available) {
              label = 'Available';
              color = 'bg-emerald-500';
              gradient = 'from-emerald-500/10 to-teal-400/10';
            } else if (cleaner.is_on_leave) {
              label = 'On Leave';
              color = 'bg-amber-500';
              gradient = 'from-amber-500/10 to-orange-400/10';
            }

            return (
              <div 
                key={cleaner.id}
                onClick={() => navigate(`/cleaners/${cleaner.id}`)}
                className={cn(
                  "group relative bg-white/70 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 ring-1 ring-black/5 inset animate-stagger-up flex flex-col",
                  `stagger-${(i % 6) + 1}`
                )}
              >
                {/* Header Gradient Block with Status Inline Dropdown */}
                <div className={cn("h-24 w-full relative border-b border-white/50 bg-gradient-to-br", gradient)}>
                  
                  <div className="absolute top-3 right-3 z-20" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 gap-2 px-3 bg-white/80 hover:bg-white shadow-sm border border-white rounded-full transition-colors"
                          disabled={statusMutation.isPending && statusMutation.variables?.id === cleaner.id}
                        >
                          <div className={cn("w-2 h-2 rounded-full", color)} />
                          <span className="text-xs font-bold text-slate-700">{label}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[140px] rounded-2xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-xl p-2">
                        <DropdownMenuItem className="gap-2 rounded-xl cursor-pointer hover:bg-slate-50" onClick={() => statusMutation.mutate({ id: cleaner.id, status: 'available' })}>
                          <div className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="font-medium text-slate-700">Available</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 rounded-xl cursor-pointer hover:bg-slate-50" onClick={() => statusMutation.mutate({ id: cleaner.id, status: 'busy' })}>
                          <div className="w-2 h-2 rounded-full bg-rose-500" /> <span className="font-medium text-slate-700">Busy</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 rounded-xl cursor-pointer hover:bg-slate-50" onClick={() => statusMutation.mutate({ id: cleaner.id, status: 'leave' })}>
                          <div className="w-2 h-2 rounded-full bg-amber-500" /> <span className="font-medium text-slate-700">On Leave</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Quick Action Overlay */}
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-10">
                    {cleaner.phone && (
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white text-slate-900 hover:scale-110 shadow-lg" onClick={(e) => { e.stopPropagation(); window.location.href=`tel:${cleaner.phone}`; }}>
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="px-6 pb-6 flex-1 flex flex-col relative z-10">
                  {/* Floating Avatar */}
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-600 font-black text-2xl uppercase -mt-8 mb-4 ring-4 ring-white border border-slate-100">
                     {cleaner.name ? cleaner.name.charAt(0) : '?'}
                  </div>

                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-extrabold text-lg text-slate-900 truncate leading-tight group-hover:text-cyan-600 transition-colors pr-2">{cleaner.name ?? 'Unknown'}</h3>
                    {cleaner.rating && (
                       <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg border border-amber-100 shrink-0">
                         <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                         <span className="text-xs font-bold">{Number(cleaner.rating).toFixed(1)}</span>
                       </div>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 mb-6">
                    {cleaner.phone && <p className="text-sm text-slate-500 flex items-center gap-2 truncate"><Phone className="w-3.5 h-3.5 opacity-50 shrink-0"/> {cleaner.phone}</p>}
                    {(cleaner.city || cleaner.pincode) && <p className="text-sm text-slate-500 flex items-center gap-2 truncate"><MapPin className="w-3.5 h-3.5 opacity-50 shrink-0"/> {[cleaner.city, cleaner.pincode].filter(Boolean).join(', ')}</p>}
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-200/60 flex items-center justify-between">
                     <div className="flex flex-col">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Transport</span>
                       <span className="font-medium text-slate-700 text-sm truncate max-w-[120px]">{cleaner.transport || '—'}</span>
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
              className="rounded-xl bg-white/50 backdrop-blur-md border-white/80 hover:bg-white/80 transition-colors shadow-sm" 
              disabled={pagination.pageIndex === 0}
              onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex - 1 }))}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl bg-white/50 backdrop-blur-md border-white/80 hover:bg-white/80 transition-colors shadow-sm" 
              disabled={pagination.pageIndex >= pageCount - 1}
              onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add cleaner dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm rounded-[2rem] p-6 border-white/60 bg-white/95 backdrop-blur-2xl shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-900">Add New Cleaner</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(
              (d) => createMutation.mutate(d),
              (errs) => console.warn('[AddCleaner] validation failed', errs),
            )}
            className="space-y-4"
          >
            {[
              { id: 'cleaner-name', name: 'name', label: 'Full Name *', type: 'text', placeholder: 'Amit Kumar' },
              { id: 'cleaner-phone', name: 'phone', label: 'Phone *', type: 'tel',  placeholder: '9876543210' },
              { id: 'cleaner-username', name: 'username', label: 'Login Username *', type: 'text', placeholder: 'amit001', helperText: 'Will become amit001@zynkly.com (used to log into worker app)' },
              { id: 'cleaner-password', name: 'password', label: 'Login Password *', type: 'text', placeholder: 'min 6 chars', helperText: 'Share this with the cleaner — they will need it to log in' },
              { id: 'cleaner-pincode', name: 'pincode', label: 'Service Pincode *', type: 'text', placeholder: '141001' },
              { id: 'cleaner-transport', name: 'transport', label: 'Transport', type: 'text', placeholder: 'e.g. Bicycle, Scooter' },
              { id: 'cleaner-state', name: 'state', label: 'State', type: 'text', placeholder: 'e.g. Punjab' },
              { id: 'cleaner-city',  name: 'city',  label: 'City', type: 'text', placeholder: 'e.g. Ludhiana' },
            ].map(({ id, name, label, type, placeholder, helperText }) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={id} className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</Label>
                <Input id={id} type={type} placeholder={placeholder} {...register(name)} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
                {errors[name] && <p className="text-xs text-rose-500 font-medium">{errors[name].message}</p>}
                {!errors[name] && helperText && <p className="text-[10px] text-slate-400 leading-tight">{helperText}</p>}
              </div>
            ))}
            {createMutation.isError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <strong>Failed to add cleaner:</strong> {createMutation.error?.message ?? 'Unknown error'}
              </div>
            )}
            <DialogFooter className="pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" className="rounded-xl font-semibold" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="rounded-xl bg-slate-900 text-white font-bold shadow-lg hover:bg-slate-800">
                {createMutation.isPending ? 'Adding…' : 'Add Cleaner'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Credentials modal */}
      <Dialog open={!!credentialsModal} onOpenChange={(open) => { if (!open) setCredentialsModal(null); }}>
        <DialogContent className="max-w-sm rounded-[2rem] p-6 border-white/60 bg-white/95 backdrop-blur-2xl shadow-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl font-black text-slate-900">Cleaner Credentials</DialogTitle>
          </DialogHeader>
          {credentialsModal && (
            <div className="space-y-4 text-sm">
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 space-y-3 shadow-inner">
                <p className="text-xs text-cyan-800 font-medium leading-relaxed">
                  Share these credentials with <strong>{credentialsModal.cleaner_name}</strong>. They will need them to log into the worker app.
                </p>
                <div>
                  <p className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">Login Email</p>
                  <p className="font-mono font-bold text-cyan-950 text-base break-all bg-white/50 py-1 px-2 rounded-md mt-1">{credentialsModal.login_email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">Password</p>
                  <p className="font-mono font-bold text-cyan-950 text-base break-all bg-white/50 py-1 px-2 rounded-md mt-1">{credentialsModal.password}</p>
                </div>
              </div>
              <p className="text-xs text-rose-600 font-medium bg-rose-50 p-3 rounded-xl border border-rose-100">
                ⚠️ This password will not be shown again. Copy it now.
              </p>
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button type="button" className="w-full rounded-xl bg-slate-900 text-white font-bold shadow-lg hover:bg-slate-800" onClick={() => {
                const text = `Zynkly Worker App Login\nEmail: ${credentialsModal?.login_email}\nPassword: ${credentialsModal?.password}`;
                navigator.clipboard?.writeText(text);
                toast.success('Credentials copied to clipboard');
              }}>
              Copy to Clipboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
