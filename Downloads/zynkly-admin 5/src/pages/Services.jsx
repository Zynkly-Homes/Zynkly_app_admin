import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Sparkles, Search, Clock, Tag, Image as ImageIcon, X, CheckCircle2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonGrid } from '@/components/shared/SkeletonLoader';
import { formatCurrency, cn } from '@/lib/utils';
import { getServices, upsertService, deleteService } from '@/services/adminService';

const serviceSchema = z.object({
  name: z.string().min(2, 'Name required'),
  description: z.string().optional(),
  price: z.coerce.number().min(1, 'Price must be > 0'),
  category: z.string().optional(),
  image_url: z.string().optional(),
  estimated_time: z.string().optional(),
  popular: z.boolean().default(false),
  includes: z.string().optional(),
});

export default function Services() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      (svc.description || '').toLowerCase().includes(s) ||
      (svc.category || '').toLowerCase().includes(s)
    );
  }, [services, search]);

  const { register, handleSubmit, reset, control, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: { popular: false },
  });

  // Watch image_url for live preview in the drawer
  const watchImageUrl = watch('image_url');

  const upsertMutation = useMutation({
    mutationFn: upsertService,
    onSuccess: () => {
      toast.success(editService ? 'Service updated' : 'Service added');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      closeDrawer();
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

  const onSubmit = (data) => {
    const includesArray = data.includes
      ? data.includes.split(',').map(item => item.trim()).filter(Boolean)
      : [];

    const payload = {
      ...editService,
      name: data.name,
      description: data.description || null,
      price: data.price,
      category: data.category || null,
      image_url: data.image_url || null,
      estimated_time: data.estimated_time || null,
      popular: data.popular,
      includes: includesArray.length > 0 ? includesArray : null,
    };
    upsertMutation.mutate(payload);
  };

  const openEdit = (svc) => {
    setEditService(svc);
    reset({
      name: svc.name,
      description: svc.description || '',
      price: svc.price,
      category: svc.category || '',
      image_url: svc.image_url || '',
      estimated_time: svc.estimated_time || '',
      popular: svc.popular ?? false,
      includes: Array.isArray(svc.includes) ? svc.includes.join(', ') : '',
    });
    setDrawerOpen(true);
  };

  const openAdd = () => {
    setEditService(null);
    reset({
      name: '',
      description: '',
      price: '',
      category: '',
      image_url: '',
      estimated_time: '',
      popular: false,
      includes: '',
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setEditService(null);
      reset();
    }, 300); // Wait for transition
  };

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [drawerOpen]);

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-stagger-up stagger-1">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Service Catalog</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {services?.length ?? 0} active services available in the customer app.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              className="pl-9 h-11 bg-white/50 backdrop-blur-md border-white/80 focus:bg-white rounded-xl shadow-sm transition-all"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button className="w-full sm:w-auto h-11 px-6 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-500 text-white shadow-md hover:shadow-lg border-none hover:-translate-y-0.5 transition-all" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" /> Add Service
          </Button>
        </div>
      </div>

      {isLoading ? (
        <SkeletonGrid count={6} cardHeight="h-[340px]" />
      ) : !filteredServices.length ? (
        <EmptyState 
          icon={Sparkles} 
          title="No services found" 
          message="Try a different search term or add a new service." 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pt-2">
          {filteredServices.map((svc, i) => (
            <div 
              key={svc.id}
              className={cn(
                "group relative bg-white border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-stagger-up flex flex-col cursor-pointer",
                `stagger-${(i % 6) + 1}`
              )}
              onClick={() => openEdit(svc)}
            >
              {/* Card Image / Banner */}
              <div className="h-44 w-full relative bg-slate-100 overflow-hidden">
                {svc.image_url ? (
                  <img src={svc.image_url} alt={svc.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-rose-100 to-orange-50 flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
                    <Sparkles className="w-12 h-12 text-rose-300 opacity-50" />
                  </div>
                )}
                
                {/* Popular Badge */}
                {svc.popular && (
                  <div className="absolute top-4 left-4 z-10 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Popular
                  </div>
                )}

                {/* Category Floating Badge */}
                {svc.category && (
                  <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-md text-slate-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm border border-white/50">
                    {svc.category}
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                  <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-sm" onClick={(e) => { e.stopPropagation(); openEdit(svc); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="destructive" size="icon" className="h-8 w-8 rounded-full bg-rose-500/90 hover:bg-rose-600 shadow-sm" onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to delete ${svc.name}?`)) {
                      deleteMutation.mutate(svc.id);
                    }
                  }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Gradient Overlay for bottom text readability if needed */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2 gap-3">
                  <h3 className="font-extrabold text-lg text-slate-900 leading-tight group-hover:text-rose-600 transition-colors line-clamp-2">
                    {svc.name}
                  </h3>
                  <span className="font-mono font-black text-lg text-slate-900 shrink-0 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                    {formatCurrency(svc.price)}
                  </span>
                </div>
                
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                  {svc.description || 'No description provided.'}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    {svc.estimated_time || 'Variable'}
                  </div>
                  
                  {svc.includes?.length > 0 && (
                    <div className="flex items-center text-[11px] font-bold text-cyan-600 uppercase tracking-wider bg-cyan-50 px-2 py-1 rounded-md">
                      {svc.includes.length} Features
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Slide-Over Drawer Form ───────────────────────────────────────── */}
      {/* Backdrop */}
      <div 
        style={{ zIndex: 9998 }}
        className={cn("fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300", drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none")}
        onClick={closeDrawer}
      />
      
      {/* Drawer */}
      <div 
        style={{ zIndex: 9999 }}
        className={cn(
        "fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-100",
        drawerOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-xl z-10 sticky top-0">
          <div>
            <h2 className="text-xl font-black text-slate-900">{editService ? 'Edit Service' : 'New Service'}</h2>
            <p className="text-xs text-slate-500 font-medium">{editService ? 'Update the details below' : 'Add a new offering to the catalog'}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100" onClick={closeDrawer}>
            <X className="w-4 h-4 text-slate-500" />
          </Button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto">
          <form id="service-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            
            {/* Interactive Image Preview */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Image</Label>
              <div className="h-48 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden relative flex items-center justify-center group transition-colors hover:border-slate-300">
                {watchImageUrl ? (
                  <img src={watchImageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                ) : null}
                <div className={cn("flex-col items-center justify-center text-slate-400 gap-2", watchImageUrl ? "hidden absolute inset-0 bg-slate-50" : "flex")}>
                  <ImageIcon className="w-8 h-8 opacity-50" />
                  <span className="text-xs font-medium">Paste Image URL below</span>
                </div>
              </div>
              <Input placeholder="https://example.com/image.jpg" {...register('image_url')} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="svc-name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Name *</Label>
                <Input id="svc-name" placeholder="Deep Cleaning" {...register('name')} className="h-11 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-semibold" />
                {errors.name && <p className="text-xs text-rose-500 font-medium">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="svc-price" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Base Price (₹) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">₹</span>
                    <Input id="svc-price" type="number" placeholder="499" {...register('price')} className="h-11 pl-7 rounded-xl bg-slate-50 border-slate-200 font-mono font-bold" />
                  </div>
                  {errors.price && <p className="text-xs text-rose-500 font-medium">{errors.price.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="svc-estimated-time" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Est. Time</Label>
                  <Input id="svc-estimated-time" placeholder="e.g. 2 hours" {...register('estimated_time')} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="svc-category" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</Label>
                <Input id="svc-category" placeholder="e.g. Cleaning, Repair" {...register('category')} className="h-11 rounded-xl bg-slate-50 border-slate-200" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="svc-desc" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</Label>
                <textarea
                  id="svc-desc"
                  rows={3}
                  className="flex w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300 resize-none"
                  placeholder="Provide a detailed description..."
                  {...register('description')}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="space-y-1.5">
                <Label htmlFor="svc-includes" className="text-xs font-bold text-slate-500 uppercase tracking-wider">What's Included</Label>
                <p className="text-[10px] text-slate-400 mb-1">Separate items with commas (e.g. Equipment provided, 2 Professionals)</p>
                <textarea
                  id="svc-includes"
                  rows={2}
                  className="flex w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300 resize-none"
                  placeholder="Item 1, Item 2, Item 3..."
                  {...register('includes')}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border border-amber-200 bg-amber-50">
                <div className="space-y-1 cursor-pointer pr-4">
                  <Label htmlFor="svc-popular" className="text-sm font-bold text-amber-900 cursor-pointer flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Mark as Popular
                  </Label>
                  <p className="text-xs text-amber-700/70">Highlight this service with a 'Popular' badge in the customer app to drive more bookings.</p>
                </div>
                <Controller
                  name="popular"
                  control={control}
                  render={({ field }) => (
                    <Switch id="svc-popular" checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-amber-500" />
                  )}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 mt-auto">
          <Button form="service-form" type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold shadow-xl shadow-slate-900/10 hover:bg-slate-800 text-base">
            {isSubmitting ? 'Saving...' : editService ? 'Save Changes' : 'Create Service'}
          </Button>
        </div>
      </div>
    </div>
  );
}
