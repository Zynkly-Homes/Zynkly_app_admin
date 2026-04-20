import { cn } from '@/lib/utils';

/**
 * SkeletonLoader — animated placeholder for loading states.
 * 
 * Usage:
 *   <Skeleton className="h-4 w-32" />               // single line
 *   <SkeletonTable rows={5} cols={4} />              // table rows
 *   <SkeletonCard />                                 // stat card
 */

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      {...props}
    />
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full space-y-2">
      {/* Header row */}
      <div className="flex gap-4 px-4 py-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex gap-4 px-4 py-3 border-t border-border">
          {Array.from({ length: cols }).map((_, ci) => (
            <Skeleton key={ci} className={cn('h-4 flex-1', ci === 0 && 'max-w-[80px]')} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

export function SkeletonCardGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
