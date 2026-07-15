import { MapPin, AlertCircle } from 'lucide-react';

/**
 * ScopeBanner — shown to regular (non-super) admins to indicate which
 * pincodes they are scoped to. Renders nothing for super admins.
 *
 * Props:
 *   pincodes    {string[]} — the admin's assigned_pincodes array
 *   hasNoPincodes {boolean} — true when admin has role=admin but no pincodes
 */
export function ScopeBanner({ pincodes = [], hasNoPincodes = false }) {
  if (hasNoPincodes) {
    return (
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
        <div>
          <p className="font-medium">No pincodes assigned</p>
          <p className="text-xs text-amber-700 mt-0.5">
            You have no assigned service pincodes yet. Ask a super admin to assign pincodes to your
            account so you can view data.
          </p>
        </div>
      </div>
    );
  }

  if (pincodes.length === 0) return null;

  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-sm">
      <MapPin className="w-4 h-4 text-primary shrink-0" />
      <span className="text-muted-foreground">
        Showing data for:{' '}
        {pincodes.map((pc, i) => (
          <span key={pc}>
            <span className="font-semibold text-foreground font-mono">{pc}</span>
            {i < pincodes.length - 1 && <span className="text-muted-foreground">, </span>}
          </span>
        ))}
      </span>
    </div>
  );
}
