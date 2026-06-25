import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-white/60 bg-white/50 backdrop-blur-md px-4 py-2 text-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/80 hover:border-white/80 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 focus-visible:bg-white font-medium disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
