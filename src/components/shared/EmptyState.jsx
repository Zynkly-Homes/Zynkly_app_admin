import { PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * EmptyState — displayed when a grid/list has no data.
 * 
 * Props:
 *   icon     — lucide icon component (defaults to PackageOpen)
 *   title    — main heading
 *   message  — supporting text
 *   action   — optional React node (e.g. a button)
 *   className — optional extra classes
 */
export function EmptyState({
  // eslint-disable-next-line no-unused-vars
  icon: Icon = PackageOpen,
  title = 'No data found',
  message = 'There is nothing to display here yet.',
  action,
  className,
}) {
  return (
    <div className={cn("text-center py-24 bg-white/40 border border-white/60 rounded-[2rem] shadow-sm animate-stagger-up", className)}>
      <Icon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
      <h3 className="text-lg font-bold text-slate-700">{title}</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{message}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
