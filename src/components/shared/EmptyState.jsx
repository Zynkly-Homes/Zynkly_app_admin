import { PackageOpen } from 'lucide-react';

/**
 * EmptyState — displayed when a table/list has no data.
 * 
 * Props:
 *   icon     — lucide icon component (defaults to PackageOpen)
 *   title    — main heading
 *   message  — supporting text
 *   action   — optional React node (e.g. a button)
 */
export function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No data found',
  message = 'There is nothing to display here yet.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
