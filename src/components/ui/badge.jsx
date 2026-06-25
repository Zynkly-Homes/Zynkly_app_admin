import { cn } from "@/lib/utils"

/**
 * Badge component — inline status/label chip.
 * Variants: default, secondary, destructive, outline
 */
function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-teal-500 text-white hover:bg-teal-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] shadow-sm",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 shadow-sm border border-slate-200/50",
    destructive: "bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200 shadow-sm",
    outline: "text-slate-700 border border-slate-200 bg-white/50 backdrop-blur-md shadow-sm",
    success: "bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm",
    warning: "bg-amber-100 text-amber-800 border border-amber-200 shadow-sm",
    info: "bg-sky-100 text-sky-800 border border-sky-200 shadow-sm",
    muted: "bg-slate-50 text-slate-500 border border-slate-200 shadow-sm",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant] ?? variants.default,
        className
      )}
      {...props}
    />
  )
}

export { Badge }
