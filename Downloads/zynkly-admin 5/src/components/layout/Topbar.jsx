import { LogOut, Bell, ChevronDown } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { useAdmin } from '@/hooks/useAdmin';
import { ADMIN_ROLE_LABELS } from '@/lib/constants';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

/**
 * Topbar — fixed top header with admin info and logout.
 */
export function Topbar({ pageTitle }) {
  const { admin, isSuperAdmin } = useAdmin();
  const signOut = useAuthStore((s) => s.signOut);

  const initials = admin?.name
    ? admin.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <header className="h-16 border-b border-white/40 bg-white/40 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-20">
      {/* Page title */}
      <h1 className="text-sm font-semibold text-foreground">{pageTitle}</h1>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Role badge */}
        <Badge variant={isSuperAdmin ? 'default' : 'secondary'}>
          {ADMIN_ROLE_LABELS[admin?.role] ?? 'Admin'}
        </Badge>

        {/* Admin dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg hover:bg-muted px-2 py-1.5 transition-colors">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground hidden sm:block">
                {admin?.name ?? admin?.email ?? 'Admin'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="font-medium">{admin?.name ?? 'Admin'}</p>
              <p className="text-xs text-muted-foreground font-normal truncate mt-0.5">
                {admin?.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={signOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
