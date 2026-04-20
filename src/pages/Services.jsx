import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Sparkles, Search } from 'lucide-react';
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { formatCurrency, cn } from '@/lib/utils';
import { getServices, upsertService, deleteService } from '@/services/adminService';

const serviceSchema = z.object({
  name: z.string().min(2, 'Name required'),
  description: z.string().min(5, 'Description required'),
  price: z.coerce.number().min(1, 'Price must be > 0'),
  icon: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});

/**
 * Services page (Super Admin only) — edit service catalog.
 */
export default function Services() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editService, setEditService] = useState(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: getServices,
    staleTime: 120_000,
  });

  const filteredServices = useMemo(() => {
    if (!Array.isArray(services)) return [];
    const s = search.toLowerCase();
    return services.filter(svc => 
      (svc.name || '').toLowerCase().includes(s) || 
      (svc.description || '').toLowerCase().includes(s)
    );
  }, [services, search]);

  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: { is_active: true },
  });

  const upsertMutation = useMutation({
    mutationFn: upsertService,
    onSuccess: () => {
      toast.success(editService ? 'Service updated' : 'Service added');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setDialogOpen(false);
      setEditService(null);
      reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => { 
      toast.success('Service deleted'); 
      queryClient.invalidateQueries({ queryKey: ['services'] }); 
    },
    onError: (err) => toast.error(err.message),
  });

  const openEdit = (svc) => {
    setEditService(svc);
    reset({
      name: svc.name,
      description: svc.description,
      price: svc.price,
      icon: svc.icon || '',
      is_active: svc.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditService(null);
    reset({ name: '', description: '', price: '', icon: '', is_active: true });
    setDialogOpen(true);
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'icon',
      header: '',
      size: 50,
      cell: ({ getValue }) => (
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl shadow-sm border border-border/50">
          {getValue() || '🧹'}
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Service Name',
      cell: ({ getValue, row }) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{getValue()}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{row.original.description}</span>
        </div>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Base Price',
      cell: ({ getValue }) => (
        <span className="font-mono font-bold text-primary">
          {formatCurrency(getValue())}
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Visibility',
      cell: ({ getValue, row }) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Switch 
            checked={!!getValue()} 
            onCheckedChange={(checked) => upsertMutation.mutate({ ...row.original, is_active: checked })}
            disabled={upsertMutation.isPending && upsertMutation.variables?.id === row.original.id}
          />
          <Badge variant={getValue() ? 'success' : 'muted'} className="text-[10px] px-1.5 py-0">
            {getValue() ? 'Live' : 'Hidden'}
          </Badge>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors" 
            onClick={() => openEdit(row.original)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors" 
            onClick={() => {
              if (confirm('Are you sure you want to delete this service?')) {
                deleteMutation.mutate(row.original.id);
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ], [upsertMutation, deleteMutation]);

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Services</h2>
          <p className="text-sm text-muted-foreground">
            Manage your service catalog. Changes are synced to the customer app in real-time.
          </p>
        </div>
        <Button id="add-service-btn" size="sm" className="gap-2 shadow-sm" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Service
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              className="pl-9 h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredServices}
            isLoading={isLoading}
            emptyState={
              <EmptyState 
                icon={Sparkles} 
                title="No services found" 
                message={search ? "Try a different search term." : "Add your first service to get started."} 
              />
            }
          />
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editService ? 'Update Service' : 'Create New Service'}</DialogTitle>
            <DialogDescription>
              {editService ? 'Update the details for this service.' : 'Add a new service to your catalog.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => upsertMutation.mutate({ ...editService, ...d }))} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="svc-name" className="text-sm font-semibold">Service Name</Label>
                <Input id="svc-name" placeholder="Deep Cleaning" {...register('name')} className={cn(errors.name && "border-destructive")} />
                {errors.name && <p className="text-xs text-destructive font-medium">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="svc-price" className="text-sm font-semibold">Base Price (₹)</Label>
                  <Input id="svc-price" type="number" placeholder="499" {...register('price')} className={cn(errors.price && "border-destructive")} />
                  {errors.price && <p className="text-xs text-destructive font-medium">{errors.price.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="svc-icon" className="text-sm font-semibold">Icon (Emoji)</Label>
                  <Input id="svc-icon" placeholder="🧹" {...register('icon')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="svc-desc" className="text-sm font-semibold">Description</Label>
                <textarea
                  id="svc-desc"
                  rows={3}
                  className={cn(
                    "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none",
                    errors.description && "border-destructive"
                  )}
                  placeholder="Complete home deep cleaning with premium equipment..."
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-destructive font-medium">{errors.description.message}</p>}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="space-y-0.5">
                  <Label htmlFor="svc-active" className="text-sm font-semibold">Live Status</Label>
                  <p className="text-[10px] text-muted-foreground">Visible to customers in the app</p>
                </div>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <Switch id="svc-active" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
                {isSubmitting ? 'Saving...' : editService ? 'Update Service' : 'Create Service'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
