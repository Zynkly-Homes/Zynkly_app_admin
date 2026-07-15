import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-gradient-to-tr from-teal-500 to-cyan-400 text-white hover:shadow-[0_4px_14px_0_rgba(20,184,166,0.39)] shadow-sm border-none shadow-inner ring-1 ring-white/20",
    destructive: "bg-rose-500 text-white hover:bg-rose-600 hover:shadow-md shadow-sm border border-rose-500/20",
    outline: "border border-slate-200 bg-white/50 backdrop-blur-md hover:bg-white text-slate-700 shadow-sm",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border-none shadow-sm",
    ghost: "hover:bg-slate-100/50 hover:text-slate-900 text-slate-600",
    link: "text-teal-600 underline-offset-4 hover:underline",
  }
  const sizes = {
    default: "h-11 px-6 py-2",
    sm: "h-9 rounded-lg px-4 text-xs",
    lg: "h-12 rounded-xl px-8 text-base",
    icon: "h-9 w-9",
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
