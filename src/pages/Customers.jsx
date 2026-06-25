import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Phone, Mail, Calendar, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonGrid } from '@/components/shared/SkeletonLoader';
import { ScopeBanner } from '@/components/shared/ScopeBanner';
import { formatDate, cn } from '@/lib/utils';
import { getCustomers, getCustomersUnscoped } from '@/services/customersService';
import { DEFAULT_PAGE_SIZE, GRID_PAGE_SIZE } from '@/lib/constants';
import { useAdmin } from '@/hooks/useAdmin';

export default function Customers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: GRID_PAGE_SIZE });
  const { assignedPincodes, isScoped, hasNoPincodes } = useAdmin();
  const pincodes = isScoped ? assignedPincodes : [];

  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', search, pagination.pageIndex, pincodes],
    queryFn: () => {
      if (isScoped) {
        return getCustomers({ search, page: pagination.pageIndex, pageSize: pagination.pageSize, pincodes });
      }
      return getCustomersUnscoped({ search, page: pagination.pageIndex, pageSize: pagination.pageSize });
    },
    keepPreviousData: true,
    staleTime: 60_000,
  });

  const pageCount = data?.count ? Math.ceil(data.count / pagination.pageSize) : undefined;
  const customersList = data?.data ?? [];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-stagger-up stagger-1">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Customers</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">{data?.count ?? 0} registered users</p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9 h-11 bg-white/50 backdrop-blur-md border-white/80 focus:bg-white rounded-xl shadow-sm transition-all"
            placeholder="Search by name, phone, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
          />
        </div>
      </div>

      {(isScoped || hasNoPincodes) && (
        <div className="animate-stagger-up stagger-2">
          <ScopeBanner pincodes={assignedPincodes} hasNoPincodes={hasNoPincodes} />
        </div>
      )}
      
      {error && <div className="text-rose-600 font-bold p-4 bg-rose-50 rounded-2xl border border-rose-200 shadow-sm animate-stagger-up stagger-2">Error loading customers: {error.message}</div>}

      {isLoading ? (
        <SkeletonGrid count={8} cardHeight="h-[280px]" />
      ) : !customersList.length ? (
        <EmptyState 
          icon={Users} 
          title="No customers found" 
          message="Try adjusting your search query." 
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pt-2">
          {customersList.map((customer, i) => {
            const bookingCount = Array.isArray(customer.bookings) ? customer.bookings.length : (customer.bookings ?? 0);
            
            return (
              <div 
                key={customer.id}
                onClick={() => navigate(`/customers/${customer.id}`)}
                className={cn(
                  "group relative bg-white/70 backdrop-blur-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 ring-1 ring-black/5 inset animate-stagger-up flex flex-col",
                  `stagger-${(i % 6) + 1}`
                )}
              >
                {/* Header Gradient Block */}
                <div className="h-20 bg-gradient-to-br from-teal-500/10 to-cyan-400/10 w-full relative border-b border-white/50">
                  {/* Quick Action Overlay (Hidden until hover) */}
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/90 to-cyan-500/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-20">
                    {customer.email && (
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white text-teal-600 hover:scale-110 hover:bg-white shadow-sm" onClick={(e) => { e.stopPropagation(); window.location.href=`mailto:${customer.email}`; }}>
                        <Mail className="w-4 h-4" />
                      </Button>
                    )}
                    {customer.phone && (
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white text-teal-600 hover:scale-110 hover:bg-white shadow-sm" onClick={(e) => { e.stopPropagation(); window.location.href=`tel:${customer.phone}`; }}>
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="px-6 pb-6 flex-1 flex flex-col relative z-10">
                  {/* Floating Avatar */}
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-teal-600 font-black text-2xl uppercase -mt-8 mb-4 ring-4 ring-white">
                     {customer.name ? customer.name.charAt(0) : '?'}
                  </div>

                  <h3 className="font-extrabold text-lg text-slate-900 truncate leading-tight group-hover:text-teal-600 transition-colors">{customer.name ?? 'Unknown Customer'}</h3>
                  
                  <div className="space-y-1.5 mt-2 mb-6">
                    {customer.email && <p className="text-sm text-slate-500 flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5 opacity-50 shrink-0"/> {customer.email}</p>}
                    {customer.phone && <p className="text-sm text-slate-500 flex items-center gap-2 truncate"><Phone className="w-3.5 h-3.5 opacity-50 shrink-0"/> {customer.phone}</p>}
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-200/60 flex items-center justify-between">
                     <div className="flex flex-col">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Total Bookings</span>
                       <span className="font-black text-slate-800 text-lg">{bookingCount}</span>
                     </div>
                     <div className="flex flex-col text-right">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Joined</span>
                       <span className="font-medium text-slate-600 text-sm flex items-center gap-1 justify-end"><Calendar className="w-3 h-3 opacity-50"/> {formatDate(customer.created_at, 'MMM yyyy')}</span>
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
    </div>
  );
}
