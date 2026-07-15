import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, ToggleLeft, MapPin, X, Check, Mail, Phone, Calendar, PowerOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonGrid } from '@/components/shared/SkeletonLoader';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { 
  getAdmins, updateAdminRole, updateAdminPincodes, deactivateAdmin,
  createAdmin, getPincodes 
} from '@/services/adminService';
import { cn } from '@/lib/utils';
import { ADMIN_ROLES, ADMIN_ROLE_LABELS } from '@/lib/constants';
import useAuthStore from '@/store/authStore';

const createAdminSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().regex(/^[+]?[0-9]{8,15}$/, 'Enter a valid phone number'),
  password: z.string().min(8, 'Min 8 characters'),
});

export default function Admins() {
  const queryClient = useQueryClient();
  const currentAdmin = useAuthStore((s) => s.admin);

  const [createOpen, setCreateOpen] = useState(false);
  const [createPincodes, setCreatePincodes] = useState([]);
  const [createPincodeSearch, setCreatePincodeSearch] = useState('');
  const [credentialsModal, setCredentialsModal] = useState(null);

  const [pincodeDialogAdmin, setPincodeDialogAdmin] = useState(null);
  const [selectedPincodes, setSelectedPincodes] = useState([]);
  const [pincodeSearch, setPincodeSearch] = useState('');

  const { data: admins, isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: getAdmins,
    staleTime: 60_000,
  });

  const { data: allPincodes } = useQuery({
    queryKey: ['pincodes', 'all'],
    queryFn: () => getPincodes({ search: '' }),
    staleTime: 120_000,
  });

  const filteredPincodes = useMemo(() => {
    if (!allPincodes) return [];
    const s = pincodeSearch.toLowerCase();
    return allPincodes.filter(
      (p) => p.pincode.includes(s) || (p.city ?? '').toLowerCase().includes(s) || (p.state ?? '').toLowerCase().includes(s)
    );
  }, [allPincodes, pincodeSearch]);

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => updateAdminRole(id, role),
    onSuccess: () => { toast.success('Role updated'); queryClient.invalidateQueries({ queryKey: ['admins'] }); },
    onError: (err) => toast.error(err.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAdmin,
    onSuccess: () => { toast.success('Admin deactivated'); queryClient.invalidateQueries({ queryKey: ['admins'] }); },
    onError: (err) => toast.error(err.message),
  });

  const pincodeMutation = useMutation({
    mutationFn: ({ id, pincodes }) => updateAdminPincodes(id, pincodes),
    onSuccess: (updatedAdmin) => {
      toast.success(`Pincodes updated for ${updatedAdmin.name ?? updatedAdmin.email} — ${updatedAdmin.assigned_pincodes?.length ?? 0} assigned`);
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setPincodeDialogAdmin(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const openPincodeDialog = (admin) => {
    setPincodeDialogAdmin(admin);
    setSelectedPincodes(admin.assigned_pincodes ?? []);
    setPincodeSearch('');
  };

  const togglePincode = (pincode) => {
    setSelectedPincodes((prev) => prev.includes(pincode) ? prev.filter((p) => p !== pincode) : [...prev, pincode]);
  };

  const { register: registerCreate, handleSubmit: handleSubmitCreate, reset: resetCreate, formState: { errors: createErrors } } = useForm({
    resolver: zodResolver(createAdminSchema),
  });

  const createMutation = useMutation({
    mutationFn: (formData) => {
      if (createPincodes.length === 0) return Promise.reject(new Error('At least one assigned pincode is required'));
      return createAdmin({ ...formData, assigned_pincodes: createPincodes });
    },
    onSuccess: (response) => {
      toast.success('Admin created successfully');
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setCreateOpen(false);
      resetCreate();
      setCreatePincodes([]);
      setCreatePincodeSearch('');
      setCredentialsModal({ login_email: response.credentials.login_email, password: response.credentials.password, admin_name: response.admin.name });
    },
    onError: (err) => { toast.error(err?.message || 'Failed to create admin'); },
  });

  const createFilteredPincodes = useMemo(() => {
    if (!allPincodes) return [];
    const s = createPincodeSearch.toLowerCase();
    return allPincodes.filter(
      (p) => p.pincode.includes(s) || (p.city ?? '').toLowerCase().includes(s) || (p.state ?? '').toLowerCase().includes(s)
    );
  }, [allPincodes, createPincodeSearch]);

  const toggleCreatePincode = (pincode) => {
    setCreatePincodes((prev) => prev.includes(pincode) ? prev.filter((p) => p !== pincode) : [...prev, pincode]);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-stagger-up stagger-1">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Admin Accounts</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">{admins?.length ?? 0} active administrators</p>
        </div>
        <Button className="w-full sm:w-auto h-11 px-6 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-md hover:shadow-lg border-none hover:-translate-y-0.5 transition-all" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Invite Admin
        </Button>
      </div>

      {isLoading ? (
        <SkeletonGrid count={5} cardHeight="h-[320px]" />
      ) : !admins?.length ? (
        <EmptyState 
          icon={Shield} 
          title="No admins found" 
          message="Add your first admin using the invite button." 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pt-2">
          {admins.map((admin, i) => {
            const isMe = admin.id === currentAdmin?.id;
            const isSuper = admin.role === 'super_admin';
            const isActive = admin.is_active !== false;

            return (
              <div 
                key={admin.id}
                className={cn(
                  "group relative bg-white/70 backdrop-blur-3xl border shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 ring-1 inset animate-stagger-up flex flex-col",
                  isActive ? "border-white/80 ring-black/5" : "border-rose-100 ring-rose-50 opacity-75 grayscale-[0.5]",
                  `stagger-${(i % 6) + 1}`
                )}
              >
                {/* Header Gradient Block */}
                <div className={cn("h-24 w-full relative border-b border-white/50 bg-gradient-to-br", isSuper ? "from-indigo-500/10 to-purple-500/10" : "from-slate-200/50 to-slate-100/50")}>
                  {/* Quick Action Overlay (Hidden until hover) */}
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20">
                    {!isSuper && (
                      <Button variant="ghost" size="sm" className="h-9 px-4 rounded-full bg-white/10 text-white hover:bg-white hover:text-slate-900" onClick={(e) => { e.stopPropagation(); openPincodeDialog(admin); }}>
                        <MapPin className="w-3.5 h-3.5 mr-1.5" /> Pincodes
                      </Button>
                    )}
                    {isActive && !isMe && (
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white" onClick={(e) => { e.stopPropagation(); deactivateMutation.mutate(admin.id); }}>
                        <PowerOff className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="px-6 pb-6 flex-1 flex flex-col relative z-10">
                  {/* Floating Avatar */}
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 font-black text-2xl uppercase -mt-8 mb-4 ring-4 ring-white border border-slate-100">
                     {admin.name ? admin.name.charAt(0) : admin.email.charAt(0)}
                  </div>

                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-extrabold text-lg text-slate-900 truncate leading-tight group-hover:text-indigo-600 transition-colors pr-2">
                      {admin.name ?? 'Unnamed Admin'} {isMe && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded ml-1 align-middle uppercase">You</span>}
                    </h3>
                  </div>
                  
                  <div className="space-y-1.5 mb-5">
                    {admin.email && <p className="text-sm text-slate-500 flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5 opacity-50 shrink-0"/> {admin.email}</p>}
                    {admin.phone && <p className="text-sm text-slate-500 flex items-center gap-2 truncate"><Phone className="w-3.5 h-3.5 opacity-50 shrink-0"/> {admin.phone}</p>}
                  </div>

                  <div className="mt-auto space-y-4">
                    {/* Role Dropdown Inline */}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Role</Label>
                      <Select value={admin.role} onValueChange={(role) => roleMutation.mutate({ id: admin.id, role })} disabled={isMe || !isActive}>
                        <SelectTrigger className="w-full h-10 text-sm bg-slate-50/50 border-slate-200/60 rounded-xl focus:ring-indigo-500/20 font-medium text-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-white/60 bg-white/90 backdrop-blur-xl shadow-xl">
                          {Object.entries(ADMIN_ROLE_LABELS).map(([val, label]) => (
                            <SelectItem key={val} value={val} className="rounded-lg font-medium">{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 border-t border-slate-200/60">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">Assigned Scope</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {isSuper ? (
                          <Badge variant="outline" className="font-mono text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-200">Universal Access</Badge>
                        ) : admin.assigned_pincodes?.length ? (
                          <>
                            {admin.assigned_pincodes.slice(0, 3).map((pc) => (
                              <Badge key={pc} variant="outline" className="font-mono text-xs px-2 py-0.5 bg-white border-slate-200">{pc}</Badge>
                            ))}
                            {admin.assigned_pincodes.length > 3 && (
                              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-slate-100">+{admin.assigned_pincodes.length - 3}</Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-rose-500 font-medium bg-rose-50 px-2 py-1 rounded-md">No Scope Assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Admin dialog ───────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); resetCreate(); setCreatePincodes([]); setCreatePincodeSearch(''); } }}>
        <DialogContent className="max-w-md rounded-[2rem] p-6 border-white/60 bg-white/95 backdrop-blur-2xl shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-900">Invite Administrator</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate((d) => createMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name *</Label>
              <Input id="create-name" placeholder="Asha Verma" {...registerCreate('name')} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
              {createErrors.name && <p className="text-xs text-rose-500 font-medium">{createErrors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email *</Label>
              <Input id="create-email" type="email" placeholder="asha@zynkly.com" {...registerCreate('email')} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
              {createErrors.email && <p className="text-xs text-rose-500 font-medium">{createErrors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-phone" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone *</Label>
              <Input id="create-phone" type="tel" placeholder="9876543210" {...registerCreate('phone')} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
              {createErrors.phone && <p className="text-xs text-rose-500 font-medium">{createErrors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-password" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password *</Label>
              <Input id="create-password" type="text" placeholder="min 8 chars" {...registerCreate('password')} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
              {createErrors.password && <p className="text-xs text-rose-500 font-medium">{createErrors.password.message}</p>}
              {!createErrors.password && <p className="text-[10px] text-slate-400 leading-tight">Share with the new admin — they will use this to log in</p>}
            </div>

            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Scope (Pincodes) *</Label>
              <p className="text-[10px] text-slate-400 leading-tight mb-2">
                {createPincodes.length === 0 ? 'Select at least one — admin will only see data in these pincodes' : `${createPincodes.length} selected`}
              </p>
              {createPincodes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                  {createPincodes.map((pc) => (
                    <Badge key={pc} variant="secondary" className="font-mono text-xs gap-1 cursor-pointer hover:bg-rose-100 hover:text-rose-600 transition-colors rounded-lg py-1" onClick={() => toggleCreatePincode(pc)}>
                      {pc}<X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              )}
              <Input placeholder="Search pincode, city or state..." value={createPincodeSearch} onChange={(e) => setCreatePincodeSearch(e.target.value)} className="h-10 text-sm rounded-xl bg-slate-50 border-slate-200" />
              <div className="border border-slate-200 rounded-xl overflow-y-auto max-h-40 divide-y divide-slate-100 mt-2 bg-white">
                {createFilteredPincodes.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No pincodes found</p>
                ) : (
                  createFilteredPincodes.map((p) => {
                    const checked = createPincodes.includes(p.pincode);
                    return (
                      <button key={p.id} type="button" onClick={() => toggleCreatePincode(p.pincode)} className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${checked ? 'bg-indigo-50/50' : ''}`}>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-700">{p.pincode}</span>
                          <span className="text-slate-400 text-xs">{[p.city, p.state].filter(Boolean).join(', ')}</span>
                        </div>
                        {checked && <Check className="w-4 h-4 text-indigo-600" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" className="rounded-xl font-semibold" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="rounded-xl bg-slate-900 text-white font-bold shadow-lg hover:bg-slate-800">
                {createMutation.isPending ? 'Sending Invite…' : 'Send Invite'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Manage Pincodes dialog ────────────────────────────────────── */}
      <Dialog open={!!pincodeDialogAdmin} onOpenChange={(open) => { if (!open) setPincodeDialogAdmin(null); }}>
        <DialogContent className="max-w-md rounded-[2rem] p-6 border-white/60 bg-white/95 backdrop-blur-2xl shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Scope: {pincodeDialogAdmin?.name ?? pincodeDialogAdmin?.email}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {selectedPincodes.length === 0 ? 'No pincodes assigned' : `${selectedPincodes.length} pincodes assigned`}
              </p>
              {selectedPincodes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 min-h-[40px]">
                  {selectedPincodes.map((pc) => (
                    <Badge key={pc} variant="secondary" className="font-mono text-xs gap-1 cursor-pointer hover:bg-rose-100 hover:text-rose-600 transition-colors rounded-lg py-1" onClick={() => togglePincode(pc)}>
                      {pc} <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select from registry</Label>
              <Input placeholder="Search pincode, city or state..." value={pincodeSearch} onChange={(e) => setPincodeSearch(e.target.value)} className="h-10 text-sm rounded-xl bg-slate-50 border-slate-200" />
              <div className="border border-slate-200 rounded-xl overflow-y-auto max-h-56 divide-y divide-slate-100 bg-white">
                {filteredPincodes.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No pincodes found</p>
                ) : (
                  filteredPincodes.map((p) => {
                    const checked = selectedPincodes.includes(p.pincode);
                    return (
                      <button key={p.id} type="button" onClick={() => togglePincode(p.pincode)} className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${checked ? 'bg-indigo-50/50' : ''}`}>
                        <div className="flex items-center gap-3 text-left">
                          <span className="font-mono font-bold text-slate-700">{p.pincode}</span>
                          <span className="text-slate-400 text-xs">{[p.city, p.state].filter(Boolean).join(', ')}</span>
                          {!p.is_active && <Badge variant="muted" className="text-[10px] px-1.5 py-0.5 rounded-md">Inactive</Badge>}
                        </div>
                        {checked && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t border-slate-100">
            <Button variant="ghost" className="rounded-xl font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => setSelectedPincodes([])} disabled={selectedPincodes.length === 0}>
              Clear all
            </Button>
            <Button variant="outline" className="rounded-xl font-semibold" onClick={() => setPincodeDialogAdmin(null)}>Cancel</Button>
            <Button className="rounded-xl bg-slate-900 text-white font-bold shadow-lg hover:bg-slate-800" onClick={() => pincodeMutation.mutate({ id: pincodeDialogAdmin.id, pincodes: selectedPincodes })} disabled={pincodeMutation.isPending}>
              {pincodeMutation.isPending ? 'Saving…' : 'Save Scope'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Credentials modal ─────────────────────────────────────────── */}
      <Dialog open={!!credentialsModal} onOpenChange={(open) => { if (!open) setCredentialsModal(null); }}>
        <DialogContent className="max-w-sm rounded-[2rem] p-6 border-white/60 bg-white/95 backdrop-blur-2xl shadow-2xl">
          <DialogHeader className="mb-2"><DialogTitle className="text-2xl font-black text-slate-900">Admin Credentials</DialogTitle></DialogHeader>
          {credentialsModal && (
            <div className="space-y-4 text-sm">
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 space-y-3 shadow-inner">
                <p className="text-xs text-indigo-800 font-medium leading-relaxed">
                  Share these credentials with <strong>{credentialsModal.admin_name}</strong>. They will use them to log into the admin panel.
                </p>
                <div>
                  <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Login Email</p>
                  <p className="font-mono font-bold text-indigo-950 text-base break-all bg-white/50 py-1 px-2 rounded-md mt-1">{credentialsModal.login_email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Password</p>
                  <p className="font-mono font-bold text-indigo-950 text-base break-all bg-white/50 py-1 px-2 rounded-md mt-1">{credentialsModal.password}</p>
                </div>
              </div>
              <p className="text-xs text-rose-600 font-medium bg-rose-50 p-3 rounded-xl border border-rose-100">⚠️ This password will not be shown again. Copy it now.</p>
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button type="button" className="w-full rounded-xl bg-slate-900 text-white font-bold shadow-lg hover:bg-slate-800" onClick={() => {
                const text = `Zynkly Admin Panel Login\nEmail: ${credentialsModal?.login_email}\nPassword: ${credentialsModal?.password}`;
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
