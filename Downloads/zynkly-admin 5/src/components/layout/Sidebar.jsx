import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Users, UserCheck,
  Star, TrendingUp, Headphones, Sparkles, MapPin,
  Shield, Clock, FileText, Settings, ChevronLeft, ChevronRight,
  Droplets, Power,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/hooks/useAdmin';
import { NAV_ITEMS } from '@/lib/constants';

// Icon map
const ICON_MAP = {
  LayoutDashboard, CalendarDays, Users, UserCheck,
  Star, TrendingUp, Headphones, Sparkles, MapPin,
  Shield, Clock, FileText, Settings, Power,
};

/**
 * Sidebar navigation for the admin dashboard.
 * Respects super_admin role for gated menu items.
 * Supports collapse/expand.
 */
export function Sidebar({ collapsed, onToggle }) {
  const { isSuperAdmin } = useAdmin();
  const location = useLocation();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.superAdminOnly || isSuperAdmin
  );

  // Split into main and super-admin sections
  const mainItems = visibleItems.filter((i) => !i.superAdminOnly);
  const adminItems = visibleItems.filter((i) => i.superAdminOnly);

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-white/70 backdrop-blur-3xl border border-white/80 rounded-[2rem] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)] shadow-inner ring-1 ring-white/50 sidebar-transition overflow-hidden z-20',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-white/30 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-foreground truncate">Zynkly</p>
              <p className="text-[10px] text-muted-foreground truncate">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {/* Main section */}
        {mainItems.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive = location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group',
                isActive
                  ? 'bg-primary/15 text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] border border-primary/10 scale-[1.02]'
                  : 'text-muted-foreground hover:bg-white/50 hover:text-foreground hover:scale-[1.01]'
              )}
              title={collapsed ? item.label : undefined}
            >
              {Icon && <Icon className="w-4 h-4 shrink-0" />}
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}

        {/* Super Admin section */}
        {adminItems.length > 0 && (
          <>
            <div className={cn('pt-4 pb-1', collapsed ? 'px-0' : 'px-2')}>
              {!collapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Super Admin
                </p>
              )}
              {collapsed && <div className="h-px bg-border" />}
            </div>
            {adminItems.map((item) => {
              const Icon = ICON_MAP[item.icon];
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    isActive
                      ? 'bg-primary/15 text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] border border-primary/10 scale-[1.02]'
                      : 'text-muted-foreground hover:bg-white/50 hover:text-foreground hover:scale-[1.01]'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {Icon && <Icon className="w-4 h-4 shrink-0" />}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-white/30">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-muted-foreground hover:bg-white/50 hover:text-foreground hover:scale-[1.01] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] text-sm"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
