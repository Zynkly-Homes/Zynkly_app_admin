import { cn } from '@/lib/utils';

/**
 * SkeletonLoader — animated placeholder for loading states.
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-200/50',
        className
      )}
      {...props}
    />
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full space-y-2">
      <div className="flex gap-4 px-4 py-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1 bg-slate-200" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="flex gap-4 px-4 py-3 border-t border-slate-100">
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
    <div className="rounded-[2rem] border border-slate-100 bg-white/50 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-10 rounded-2xl" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

export function SkeletonGrid({ count = 8, cardHeight = "h-[280px]", className }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pt-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn("rounded-[2rem] w-full", cardHeight)} />
      ))}
    </div>
  );
}
