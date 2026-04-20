import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Search, MapPin, Lock } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { ScopeBanner } from '@/components/shared/ScopeBanner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
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

/**
 * Pincodes page.
 * - Super admin: full CRUD — add, toggle active, delete pincodes.
 * - Regular admin (scoped): read-only view of their assigned pincodes only.
 */
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
      (p) =>
        String(p.pincode || '').includes(s) ||
        String(p.city || '').toLowerCase().includes(s) ||
        String(p.state || '').toLowerCase().includes(s)
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
    onSuccess: () => { 
      toast.success('Pincode removed'); 
      queryClient.invalidateQueries({ queryKey: ['pincodes'] }); 
    },
    onError: (err) => toast.error(err.message),
  });

  const columns = useMemo(() => [
    {
      accessorKey: 'pincode',
      header: 'Pincode',
      cell: ({ getValue }) => (
        <span className="font-mono font-bold text-primary tracking-wider bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
          {getValue()}
        </span>
      ),
    },
    {
      accessorKey: 'city',
      header: 'City',
      cell: ({ getValue }) => <span className="font-medium">{getValue() ?? '—'}</span>,
    },
    {
      accessorKey: 'state',
      header: 'State',
      cell: ({ getValue }) => <span className="text-muted-foreground">{getValue() ?? '—'}</span>,
    },
    {
      accessorKey: 'is_active',
      header: 'Availability',
      cell: ({ getValue, row }) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {isSuperAdmin ? (
            <Switch
              checked={!!getValue()}
              onCheckedChange={(checked) => upsertMutation.mutate({ ...row.original, is_active: checked })}
              disabled={upsertMutation.isPending && upsertMutation.variables?.id === row.original.id}
            />
          ) : null}
          <Badge variant={getValue() ? 'success' : 'muted'} className="text-[10px] px-1.5 py-0">
            {getValue() ? 'Active' : 'Paused'}
          </Badge>
        </div>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
              <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                  onClick={() => {
                    if (confirm('Remove this pincode? Customers in this area won\'t be able to book.')) {
                      deleteMutation.mutate(row.original.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ], [isSuperAdmin, upsertMutation, deleteMutation]);

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Serviceable Areas</h2>
          <p className="text-sm text-muted-foreground">
            {isScoped 
              ? `Showing ${filteredPincodes.length} assigned locations.` 
              : "Define geographic areas where Zynkly services are available."}
          </p>
        </div>
        {isSuperAdmin && (
          <Button id="add-pincode-btn" size="sm" className="gap-2 shadow-sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" /> Add Pincode
          </Button>
        )}
      </div>

      {(isScoped || hasNoPincodes) && (
        <ScopeBanner pincodes={assignedPincodes} hasNoPincodes={hasNoPincodes} />
      )}

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="pincode-search"
              className="pl-9 h-9 text-sm"
              placeholder="Filter by pincode or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredPincodes}
            isLoading={isLoading}
            emptyState={
              <EmptyState 
                icon={MapPin} 
                title="No areas found" 
                message={isScoped ? "You don't have access to this area." : "Add a pincode to start receiving bookings from that area."} 
              />
            }
          />
        </CardContent>
      </Card>

      {isSuperAdmin && (
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Serviceable Area</DialogTitle>
              <DialogDescription>
                Define a new pincode where customers can request services.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit((d) => upsertMutation.mutate(d))} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="pc-pincode" className="text-sm font-semibold">Pincode (6 digits)</Label>
                <Input id="pc-pincode" placeholder="411001" {...register('pincode')} className={cn(errors.pincode && "border-destructive")} />
                {errors.pincode && <p className="text-xs text-destructive font-medium">{errors.pincode.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pc-city" className="text-sm font-semibold">City</Label>
                  <Input id="pc-city" placeholder="Pune" {...register('city')} className={cn(errors.city && "border-destructive")} />
                  {errors.city && <p className="text-xs text-destructive font-medium">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pc-state" className="text-sm font-semibold">State</Label>
                  <Input id="pc-state" placeholder="Maharashtra" {...register('state')} className={cn(errors.state && "border-destructive")} />
                  {errors.state && <p className="text-xs text-destructive font-medium">{errors.state.message}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="space-y-0.5">
                  <Label htmlFor="pc-active" className="text-sm font-semibold">Serviceability Status</Label>
                  <p className="text-[10px] text-muted-foreground">Toggle to temporarily pause bookings in this area</p>
                </div>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <Switch id="pc-active" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="ghost" onClick={() => setAddOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
                  {isSubmitting ? 'Adding...' : 'Add Pincode'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
