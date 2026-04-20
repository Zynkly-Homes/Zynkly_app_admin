import { useState, useMemo } from 'react';
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
import { getAdmins, updateAdminRole, updateAdminPincodes, deactivateAdmin } from '@/services/adminService';
import { getPincodes } from '@/services/adminService';
import { formatDate } from '@/lib/utils';
import { ADMIN_ROLES, ADMIN_ROLE_LABELS } from '@/lib/constants';
import useAuthStore from '@/store/authStore';

/**
 * Admins page (Super Admin only) — manage admin accounts and their pincode assignments.
 *
 * Features:
 * - Invite new admin via Edge Function
 * - Change admin role
 * - Manage assigned pincodes per admin (multi-select from serviceable pincodes)
 * - Deactivate admin
 */
export default function Admins() {
  const queryClient = useQueryClient();
  const currentAdmin = useAuthStore((s) => s.admin);

  // Invite dialog state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('admin');
  const [inviteLoading, setInviteLoading] = useState(false);

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

  // ── Invite ──────────────────────────────────────────────────────────────
  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviteLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (!res.ok) throw new Error('Invite failed — deploy the invite-admin Edge Function first.');
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail('');
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setInviteLoading(false);
    }
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
        <Button id="invite-admin-btn" size="sm" className="gap-2" onClick={() => setInviteOpen(true)}>
          <Plus className="w-4 h-4" /> Invite Admin
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

      {/* ── Invite dialog ─────────────────────────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Invite Admin</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="newadmin@zynkly.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={inviteLoading || !inviteEmail}>
              {inviteLoading ? 'Sending…' : 'Send Invite'}
            </Button>
          </DialogFooter>
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
    </div>
  );
}
