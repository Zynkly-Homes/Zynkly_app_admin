import { cn } from "@/lib/utils"

/**
 * Badge component — inline status/label chip.
 * Variants: default, secondary, destructive, outline
 */
function Badge({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive/15 text-destructive hover:bg-destructive/20",
    outline: "text-foreground border border-border",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    info: "bg-sky-100 text-sky-700",
    muted: "bg-muted text-muted-foreground",
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
