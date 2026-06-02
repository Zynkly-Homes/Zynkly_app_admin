import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, ToggleLeft, MapPin, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { 
  getAdmins, updateAdminRole, updateAdminPincodes, deactivateAdmin,
  createAdmin,
} from '@/services/adminService';
import { getPincodes } from '@/services/adminService';
import { formatDate } from '@/lib/utils';
import { ADMIN_ROLES, ADMIN_ROLE_LABELS } from '@/lib/constants';
import useAuthStore from '@/store/authStore';

const createAdminSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().regex(/^[+]?[0-9]{8,15}$/, 'Enter a valid phone number'),
  password: z.string().min(8, 'Min 8 characters'),
});

/**
 * Admins page (Super Admin only) — manage admin accounts and their pincode assignments.
 *
 * Features:
 * - Create new admin via Edge Function
 * - Change admin role
 * - Manage assigned pincodes per admin (multi-select from serviceable pincodes)
 * - Deactivate admin
 */
export default function Admins() {
  const queryClient = useQueryClient();
  const currentAdmin = useAuthStore((s) => s.admin);

  // Create admin dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createPincodes, setCreatePincodes] = useState([]);
  // pincodes to assign to the new admin
  const [createPincodeSearch, setCreatePincodeSearch] = useState('');
  const [credentialsModal, setCredentialsModal] = useState(null);
  // { login_email, password, admin_name } when set

  // Pincode management dialog state
  const [pincodeDialogAdmin, setPincodeDialogAdmin] = useState(null); // admin row being edited
  const [selectedPincodes, setSelectedPincodes] = useState([]);       // currently selected pincodes
  const [pincodeSearch, setPincodeSearch] = useState('');

  const { data: admins, isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: getAdmins,
    staleTime: 60_000,
  });

  // Fetch all serviceable pincodes for the picker
  const { data: allPincodes } = useQuery({
    queryKey: ['pincodes', 'all'],
    queryFn: () => getPincodes({ search: '' }),
    staleTime: 120_000,
  });

  // Filtered pincodes for the search box in the dialog
  const filteredPincodes = useMemo(() => {
    if (!allPincodes) return [];
    const s = pincodeSearch.toLowerCase();
    return allPincodes.filter(
      (p) =>
        p.pincode.includes(s) ||
        (p.city ?? '').toLowerCase().includes(s) ||
        (p.state ?? '').toLowerCase().includes(s)
    );
  }, [allPincodes, pincodeSearch]);

  // ── Role mutation ─────────────────────────────────────────────────────────
  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => updateAdminRole(id, role),
    onSuccess: () => { toast.success('Role updated'); queryClient.invalidateQueries({ queryKey: ['admins'] }); },
    onError: (err) => toast.error(err.message),
  });

  // ── Deactivate mutation ──────────────────────────────────────────────────
  const deactivateMutation = useMutation({
    mutationFn: deactivateAdmin,
    onSuccess: () => { toast.success('Admin deactivated'); queryClient.invalidateQueries({ queryKey: ['admins'] }); },
    onError: (err) => toast.error(err.message),
  });

  // ── Pincode assignment mutation ──────────────────────────────────────────
  const pincodeMutation = useMutation({
    mutationFn: ({ id, pincodes }) => updateAdminPincodes(id, pincodes),
    onSuccess: (updatedAdmin) => {
      toast.success(
        `Pincodes updated for ${updatedAdmin.name ?? updatedAdmin.email} — ${updatedAdmin.assigned_pincodes?.length ?? 0} assigned`
      );
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setPincodeDialogAdmin(null);
    },
    onError: (err) => toast.error(err.message),
  });

  // ── Open pincode dialog ──────────────────────────────────────────────────
  const openPincodeDialog = (admin) => {
    setPincodeDialogAdmin(admin);
    setSelectedPincodes(admin.assigned_pincodes ?? []);
    setPincodeSearch('');
  };

  const togglePincode = (pincode) => {
    setSelectedPincodes((prev) =>
      prev.includes(pincode) ? prev.filter((p) => p !== pincode) : [...prev, pincode]
    );
  };

  // ── Create admin form ────────────────────────────────────────────────────
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm({
    resolver: zodResolver(createAdminSchema),
  });

  const createMutation = useMutation({
    mutationFn: (formData) => {
      if (createPincodes.length === 0) {
        return Promise.reject(new Error('At least one assigned pincode is required'));
      }
      return createAdmin({
        ...formData,
        assigned_pincodes: createPincodes,
      });
    },
    onSuccess: (response) => {
      toast.success('Admin created successfully');
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setCreateOpen(false);
      resetCreate();
      setCreatePincodes([]);
      setCreatePincodeSearch('');
      setCredentialsModal({
        login_email: response.credentials.login_email,
        password: response.credentials.password,
        admin_name: response.admin.name,
      });
    },
    onError: (err) => {
      console.error('[CreateAdmin] failed', err);
      toast.error(err?.message || 'Failed to create admin');
    },
  });

  // Filter pincodes for the create dialog (mirror of the existing filter)
  const createFilteredPincodes = useMemo(() => {
    if (!allPincodes) return [];
    const s = createPincodeSearch.toLowerCase();
    return allPincodes.filter(
      (p) =>
        p.pincode.includes(s) ||
        (p.city ?? '').toLowerCase().includes(s) ||
        (p.state ?? '').toLowerCase().includes(s)
    );
  }, [allPincodes, createPincodeSearch]);

  const toggleCreatePincode = (pincode) => {
    setCreatePincodes((prev) =>
      prev.includes(pincode) ? prev.filter((p) => p !== pincode) : [...prev, pincode]
    );
  };

  // ── Table columns ────────────────────────────────────────────────────────
  const columns = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ getValue, row }) => (
        <div>
          <p className="font-medium">{getValue() ?? row.original.email}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ getValue, row }) => (
        <Select
          value={getValue()}
          onValueChange={(role) => roleMutation.mutate({ id: row.original.id, role })}
          // Prevent changing own role
          disabled={row.original.id === currentAdmin?.id}
        >
          <SelectTrigger className="w-36 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ADMIN_ROLE_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      id: 'assigned_pincodes',
      header: 'Assigned Pincodes',
      cell: ({ row }) => {
        const pcs = row.original.assigned_pincodes ?? [];
        if (pcs.length === 0) {
          return <span className="text-xs text-muted-foreground italic">None</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-[240px]">
            {pcs.slice(0, 4).map((pc) => (
              <Badge key={pc} variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                {pc}
              </Badge>
            ))}
            {pcs.length > 4 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                +{pcs.length - 4} more
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ getValue }) => (
        <Badge variant={getValue() !== false ? 'success' : 'muted'}>
          {getValue() !== false ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Joined',
      cell: ({ getValue }) => formatDate(getValue()),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          {/* Manage pincodes — only for non-super-admin accounts */}
          {row.original.role !== 'super_admin' && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-xs"
              onClick={(e) => { e.stopPropagation(); openPincodeDialog(row.original); }}
            >
              <MapPin className="w-3.5 h-3.5" /> Pincodes
            </Button>
          )}
          {/* Deactivate */}
          {row.original.is_active !== false && row.original.id !== currentAdmin?.id && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive h-7 text-xs"
              onClick={(e) => { e.stopPropagation(); deactivateMutation.mutate(row.original.id); }}
            >
              <ToggleLeft className="w-3.5 h-3.5" /> Deactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Admins</h2>
          <p className="text-sm text-muted-foreground">{admins?.length ?? 0} admin accounts</p>
        </div>
        <Button id="create-admin-btn" size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Create Admin
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={admins ?? []}
            isLoading={isLoading}
            emptyState={<EmptyState icon={Shield} title="No admins" message="Add your first admin using the invite button." />}
          />
        </CardContent>
      </Card>

      {/* ── Create Admin dialog ───────────────────────────────────────── */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            resetCreate();
            setCreatePincodes([]);
            setCreatePincodeSearch('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Admin</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmitCreate((d) => createMutation.mutate(d))}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Full Name *</Label>
              <Input id="create-name" placeholder="Asha Verma" {...registerCreate('name')} />
              {createErrors.name && <p className="text-xs text-destructive">{createErrors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-email">Email *</Label>
              <Input id="create-email" type="email" placeholder="asha@zynkly.com" {...registerCreate('email')} />
              {createErrors.email && <p className="text-xs text-destructive">{createErrors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-phone">Phone *</Label>
              <Input id="create-phone" type="tel" placeholder="9876543210" {...registerCreate('phone')} />
              {createErrors.phone && <p className="text-xs text-destructive">{createErrors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-password">Password *</Label>
              <Input id="create-password" type="text" placeholder="min 8 chars" {...registerCreate('password')} />
              {createErrors.password && <p className="text-xs text-destructive">{createErrors.password.message}</p>}
              {!createErrors.password && (
                <p className="text-xs text-muted-foreground">Share with the new admin — they will use this to log in</p>
              )}
            </div>

            {/* Assigned pincodes picker */}
            <div className="space-y-1.5">
              <Label>Assigned Pincodes *</Label>
              <p className="text-xs text-muted-foreground">
                {createPincodes.length === 0
                  ? 'Select at least one — admin will only see data in these pincodes'
                  : `${createPincodes.length} selected`}
              </p>
              {createPincodes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-muted/40 border border-border">
                  {createPincodes.map((pc) => (
                    <Badge
                      key={pc}
                      variant="secondary"
                      className="font-mono text-xs gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => toggleCreatePincode(pc)}
                    >
                      {pc}<X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              )}
              <Input
                placeholder="Search pincode, city or state..."
                value={createPincodeSearch}
                onChange={(e) => setCreatePincodeSearch(e.target.value)}
                className="h-8 text-sm"
              />
              <div className="border border-border rounded-lg overflow-y-auto max-h-40 divide-y divide-border">
                {createFilteredPincodes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No pincodes found</p>
                ) : (
                  createFilteredPincodes.map((p) => {
                    const checked = createPincodes.includes(p.pincode);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleCreatePincode(p.pincode)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/50 ${checked ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{p.pincode}</span>
                          <span className="text-muted-foreground text-xs">
                            {[p.city, p.state].filter(Boolean).join(', ')}
                          </span>
                        </div>
                        {checked && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create Admin'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Manage Pincodes dialog ────────────────────────────────────── */}
      <Dialog open={!!pincodeDialogAdmin} onOpenChange={(open) => { if (!open) setPincodeDialogAdmin(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Assign Pincodes — {pincodeDialogAdmin?.name ?? pincodeDialogAdmin?.email}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* Selected pincodes chips */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                {selectedPincodes.length === 0
                  ? 'No pincodes assigned — this admin will see NO data.'
                  : `${selectedPincodes.length} pincode${selectedPincodes.length !== 1 ? 's' : ''} assigned`}
              </p>
              {selectedPincodes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg bg-muted/40 border border-border min-h-[40px]">
                  {selectedPincodes.map((pc) => (
                    <Badge
                      key={pc}
                      variant="secondary"
                      className="font-mono text-xs gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                      onClick={() => togglePincode(pc)}
                    >
                      {pc}
                      <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Pincode picker */}
            <div className="space-y-1.5">
              <Label>Select from serviceable pincodes</Label>
              <Input
                placeholder="Search pincode, city or state..."
                value={pincodeSearch}
                onChange={(e) => setPincodeSearch(e.target.value)}
                className="h-8 text-sm"
              />
              <div className="border border-border rounded-lg overflow-y-auto max-h-56 divide-y divide-border">
                {filteredPincodes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No pincodes found</p>
                ) : (
                  filteredPincodes.map((p) => {
                    const checked = selectedPincodes.includes(p.pincode);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePincode(p.pincode)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${checked ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex items-center gap-2 text-left">
                          <span className="font-mono font-medium">{p.pincode}</span>
                          <span className="text-muted-foreground text-xs">
                            {[p.city, p.state].filter(Boolean).join(', ')}
                          </span>
                          {!p.is_active && (
                            <Badge variant="muted" className="text-[10px] px-1 py-0">Inactive</Badge>
                          )}
                        </div>
                        {checked && <Check className="w-4 h-4 text-primary shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPincodes([])}
              disabled={selectedPincodes.length === 0}
            >
              Clear all
            </Button>
            <Button variant="outline" onClick={() => setPincodeDialogAdmin(null)}>Cancel</Button>
            <Button
              onClick={() => pincodeMutation.mutate({ id: pincodeDialogAdmin.id, pincodes: selectedPincodes })}
              disabled={pincodeMutation.isPending}
            >
              {pincodeMutation.isPending ? 'Saving…' : 'Save Pincodes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Credentials modal ─────────────────────────────────────────── */}
      <Dialog
        open={!!credentialsModal}
        onOpenChange={(open) => { if (!open) setCredentialsModal(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Admin Credentials</DialogTitle></DialogHeader>
          {credentialsModal && (
            <div className="space-y-3 text-sm">
              <div className="rounded-md border bg-muted/50 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Share these credentials with <strong>{credentialsModal.admin_name}</strong>.
                  They will use them to log into the admin panel.
                </p>
                <div>
                  <p className="text-xs text-muted-foreground">Login Email</p>
                  <p className="font-mono font-medium break-all">{credentialsModal.login_email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Password</p>
                  <p className="font-mono font-medium break-all">{credentialsModal.password}</p>
                </div>
              </div>
              <p className="text-xs text-amber-600">⚠️ This password will not be shown again. Copy it now.</p>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const text = `Zynkly Admin Panel Login\nEmail: ${credentialsModal?.login_email}\nPassword: ${credentialsModal?.password}`;
                navigator.clipboard?.writeText(text);
                toast.success('Credentials copied to clipboard');
              }}
            >
              Copy
            </Button>
            <Button type="button" onClick={() => setCredentialsModal(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
