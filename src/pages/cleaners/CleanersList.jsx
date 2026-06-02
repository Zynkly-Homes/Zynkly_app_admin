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

/**
 * CleanersList page — cleaners table with add cleaner form.
 * Scoped to cleaners in cities matching the admin's assigned pincodes.
 */
export default function CleanersList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState(null);
  // Will hold { login_email, password, cleaner_name } when set
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
      // Strip empty strings → undefined so Edge Function gets clean payload
      const cleaned = Object.fromEntries(
        Object.entries(formData)
          .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      );
      return createCleaner(cleaned);
    },
    onSuccess: (response) => {
      toast.success('Cleaner created successfully');
      queryClient.invalidateQueries({ queryKey: ['cleaners'] });
      setAddOpen(false);
      reset();
      // Show the credentials modal
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
              { id: 'cleaner-name',     name: 'name',     label: 'Full Name *',
                type: 'text', placeholder: 'Amit Kumar' },
              { id: 'cleaner-phone',    name: 'phone',    label: 'Phone *',
                type: 'tel',  placeholder: '9876543210' },
              { id: 'cleaner-username', name: 'username', label: 'Login Username *',
                type: 'text', placeholder: 'amit001',
                helperText: 'Will become amit001@zynkly.com (used to log into worker app)' },
              { id: 'cleaner-password', name: 'password', label: 'Login Password *',
                type: 'text', placeholder: 'min 6 chars',
                helperText: 'Share this with the cleaner — they will need it to log in' },
              { id: 'cleaner-pincode',  name: 'pincode',  label: 'Service Pincode *',
                type: 'text', placeholder: '141001' },
              { id: 'cleaner-transport', name: 'transport', label: 'Transport',
                type: 'text', placeholder: 'e.g. Bicycle, Scooter' },
              { id: 'cleaner-state', name: 'state', label: 'State',
                type: 'text', placeholder: 'e.g. Punjab' },
              { id: 'cleaner-city',  name: 'city',  label: 'City',
                type: 'text', placeholder: 'e.g. Ludhiana' },
            ].map(({ id, name, label, type, placeholder, helperText }) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={id}>{label}</Label>
                <Input id={id} type={type} placeholder={placeholder} {...register(name)} />
                {errors[name] && <p className="text-xs text-destructive">{errors[name].message}</p>}
                {!errors[name] && helperText && (
                  <p className="text-xs text-muted-foreground">{helperText}</p>
                )}
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

      {/* Credentials modal — shown after a successful cleaner creation */}
      <Dialog
        open={!!credentialsModal}
        onOpenChange={(open) => { if (!open) setCredentialsModal(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cleaner Credentials</DialogTitle>
          </DialogHeader>
          {credentialsModal && (
            <div className="space-y-3 text-sm">
              <div className="rounded-md border bg-muted/50 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Share these credentials with <strong>{credentialsModal.cleaner_name}</strong>.
                  They will need them to log into the worker app.
                </p>
                <div>
                  <p className="text-xs text-muted-foreground">Login Email</p>
                  <p className="font-mono font-medium break-all">
                    {credentialsModal.login_email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Password</p>
                  <p className="font-mono font-medium break-all">
                    {credentialsModal.password}
                  </p>
                </div>
              </div>
              <p className="text-xs text-amber-600">
                ⚠️ This password will not be shown again. Copy it now.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const text = `Zynkly Worker App Login\nEmail: ${credentialsModal?.login_email}\nPassword: ${credentialsModal?.password}`;
                navigator.clipboard?.writeText(text);
                toast.success('Credentials copied to clipboard');
              }}
            >
              Copy
            </Button>
            <Button type="button" onClick={() => setCredentialsModal(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
