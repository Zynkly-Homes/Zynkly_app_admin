import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Users, Droplets,
  Star, TrendingUp, HelpCircle, Settings, MapPin, ShieldAlert, LogOut, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Bookings', path: '/bookings', icon: CalendarDays },
  { label: 'Customers', path: '/customers', icon: Users },
  { label: 'Cleaners', path: '/cleaners', icon: Droplets },
  { label: 'Reviews', path: '/reviews', icon: Star },
  { label: 'Revenue', path: '/revenue', icon: TrendingUp },
];

const secondaryItems = [
  { label: 'Support', path: '/support', icon: HelpCircle },
  { label: 'Operations', path: '/operations', icon: Settings },
  { label: 'Services', path: '/services', icon: Sparkles },
  { label: 'Pincodes', path: '/pincodes', icon: MapPin },
];

export default function TopDock() {
  const { admin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isSuperAdmin = admin?.role === 'super_admin';

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 flex justify-center pointer-events-none animate-stagger-up">
      <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1 p-1.5 bg-white/70 backdrop-blur-3xl border border-white/80 rounded-2xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.15)] shadow-inner ring-1 ring-white/50">
        
        {/* Brand */}
        <div className="flex items-center gap-2 px-3 mr-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(20,184,166,0.3)] shadow-inner ring-1 ring-white/30">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-800">Zynkly</span>
        </div>

        <div className="hidden sm:block w-px h-6 bg-slate-200/50 mx-1" />

        {/* Primary Nav */}
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                isActive
                  ? 'bg-gradient-to-b from-teal-500/10 to-cyan-400/10 text-teal-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] border border-teal-500/10 scale-[1.02]'
                  : 'text-slate-500 hover:bg-white/50 hover:text-slate-900 hover:scale-[1.02]'
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-teal-600" : "opacity-70")} />
              <span className="hidden md:inline">{item.label}</span>
            </NavLink>
          );
        })}

        <div className="w-px h-6 bg-slate-200/50 mx-1" />

        {/* Admin Nav */}
        <div className="flex items-center gap-1">
          {secondaryItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={item.label}
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                  isActive
                    ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200 scale-[1.05]'
                    : 'text-slate-400 hover:bg-white/50 hover:text-slate-900 hover:scale-[1.05]'
                )}
              >
                <item.icon className="w-4 h-4" />
              </NavLink>
            );
          })}
          
          {isSuperAdmin && (
            <NavLink
              to="/admins"
              title="Admins"
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                location.pathname.startsWith('/admins')
                  ? 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200 scale-[1.05]'
                  : 'text-slate-400 hover:bg-white/50 hover:text-slate-900 hover:scale-[1.05]'
              )}
            >
              <ShieldAlert className="w-4 h-4" />
            </NavLink>
          )}

          <div className="w-px h-6 bg-slate-200/50 mx-1" />
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-300 hover:scale-[1.05]"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
