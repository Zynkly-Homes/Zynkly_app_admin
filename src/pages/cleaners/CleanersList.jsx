import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, UserCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { ScopeBanner } from '@/components/shared/ScopeBanner';
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
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { useAdmin } from '@/hooks/useAdmin';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

const cleanerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  email: z.string().email().optional().or(z.literal('')),
  transport: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
});

/**
 * CleanersList page — cleaners table with add cleaner form.
 * Scoped to cleaners in cities matching the admin's assigned pincodes.
 */
export default function CleanersList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: DEFAULT_PAGE_SIZE });
  const { assignedPincodes, isScoped, hasNoPincodes } = useAdmin();
  const pincodes = isScoped ? assignedPincodes : [];

  const { data, isLoading } = useQuery({
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
      // Strip empty strings → null so Supabase nullable columns don't choke
      const cleaned = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v === '' ? null : v])
      );
      console.log('[AddCleaner] cleaned payload', cleaned);
      return createCleaner({ ...cleaned, is_available: true, is_on_leave: false });
    },
    onSuccess: () => {
      toast.success('Cleaner added successfully');
      queryClient.invalidateQueries({ queryKey: ['cleaners'] });
      setAddOpen(false);
      reset();
    },
    onError: (err) => {
      console.error('[AddCleaner] insert failed', err);
      const text = [err?.message, err?.details, err?.hint]
        .filter(Boolean)
        .join(' — ') || 'Unknown error from Supabase';
      toast.error(text);
    },
  });

  useEffect(() => {
    if (addOpen) createMutation.reset();
  }, [addOpen]);

  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ getValue, row }) => (
        <div>
          <p className="font-medium">{getValue()}</p>
          <p className="text-xs text-muted-foreground">{row.original.phone}</p>
        </div>
      ),
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ getValue }) => {
        const r = getValue();
        return r ? (
          <span className="text-amber-500 font-medium">⭐ {Number(r).toFixed(1)}</span>
        ) : '—';
      },
    },
    {
      accessorKey: 'transport',
      header: 'Transport',
      cell: ({ getValue }) => getValue() ?? '—',
    },
    {
      id: 'location',
      header: 'Location',
      cell: ({ row }) => {
        const { city, pincode } = row.original;
        if (!city && !pincode) return '—';
        return (
          <span className="text-xs">
            {[city, pincode].filter(Boolean).join(', ')}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const cleaner = row.original;
        let label = 'Busy';
        let color = 'bg-destructive';

        if (cleaner.is_available) {
          label = 'Available';
          color = 'bg-emerald-500';
        } else if (cleaner.is_on_leave) {
          label = 'On Leave';
          color = 'bg-amber-500';
        }

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 gap-2 px-2 hover:bg-muted"
                  disabled={statusMutation.isPending && statusMutation.variables?.id === cleaner.id}
                >
                  <div className={cn("w-2 h-2 rounded-full", color)} />
                  <span className="text-xs font-medium">{label}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[140px]">
                <DropdownMenuItem 
                  className="gap-2 cursor-pointer" 
                  onClick={() => statusMutation.mutate({ id: cleaner.id, status: 'available' })}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Available</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="gap-2 cursor-pointer" 
                  onClick={() => statusMutation.mutate({ id: cleaner.id, status: 'busy' })}
                >
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span>Busy</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="gap-2 cursor-pointer" 
                  onClick={() => statusMutation.mutate({ id: cleaner.id, status: 'leave' })}
                >
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>On Leave</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [statusMutation]);

  const pageCount = data?.count ? Math.ceil(data.count / pagination.pageSize) : undefined;

  return (
    <div className="space-y-4 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Cleaners</h2>
          <p className="text-sm text-muted-foreground">{data?.count ?? 0} cleaners</p>
        </div>
        <Button id="add-cleaner-btn" size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" /> Add Cleaner
        </Button>
      </div>

      {(isScoped || hasNoPincodes) && (
        <ScopeBanner pincodes={assignedPincodes} hasNoPincodes={hasNoPincodes} />
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="cleaner-search"
              className="pl-9"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            onRowClick={(row) => navigate(`/cleaners/${row.id}`)}
            emptyState={
              <EmptyState
                icon={UserCheck}
                title="No cleaners yet"
                message="Add your first cleaner to get started."
                action={
                  <Button size="sm" onClick={() => setAddOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Cleaner
                  </Button>
                }
              />
            }
          />
        </CardContent>
      </Card>

      {/* Add cleaner dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Cleaner</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(
              (d) => {
                console.log('[AddCleaner] submitting', d);
                createMutation.mutate(d);
              },
              (errs) => console.warn('[AddCleaner] validation failed', errs),
            )}
            className="space-y-3"
          >
            {[
              { id: 'cleaner-name', name: 'name', label: 'Full Name *', type: 'text', placeholder: 'Amit Kumar' },
              { id: 'cleaner-phone', name: 'phone', label: 'Phone *', type: 'tel', placeholder: '9876543210' },
              { id: 'cleaner-email', name: 'email', label: 'Email', type: 'text', placeholder: 'optional' },
              { id: 'cleaner-transport', name: 'transport', label: 'Transport', type: 'text', placeholder: 'e.g. Bicycle, Scooter' },
              { id: 'cleaner-state', name: 'state', label: 'State', type: 'text', placeholder: 'e.g. Maharashtra' },
              { id: 'cleaner-city', name: 'city', label: 'City', type: 'text', placeholder: 'e.g. Mumbai' },
              { id: 'cleaner-pincode', name: 'pincode', label: 'Pincode', type: 'text', placeholder: 'e.g. 400001' },
              { id: 'cleaner-avatar', name: 'avatar_url', label: 'Avatar URL', type: 'text', placeholder: 'https://example.com/photo.jpg' },
            ].map(({ id, name, label, type, placeholder }) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={id}>{label}</Label>
                <Input id={id} type={type} placeholder={placeholder} {...register(name)} />
                {errors[name] && <p className="text-xs text-destructive">{errors[name].message}</p>}
              </div>
            ))}
            {createMutation.isError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <strong>Failed to add cleaner:</strong>{' '}
                {createMutation.error?.message ?? 'Unknown error'}
                {createMutation.error?.code && (
                  <span className="block opacity-80 mt-1">
                    Code: {createMutation.error.code}
                  </span>
                )}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Adding…' : 'Add Cleaner'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
