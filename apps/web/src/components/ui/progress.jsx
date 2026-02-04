"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Progress Component - Bellor Design System
 *
 * Enhanced progress bar with size and color variants
 */
const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-muted",
  {
    variants: {
      size: {
        sm: "h-1.5",
        md: "h-2.5",
        lg: "h-4",
        xl: "h-6",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const progressIndicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-success",
        warning: "bg-warning",
        error: "bg-destructive",
        love: "bg-love",
        info: "bg-info",
        gradient: "bg-gradient-to-r from-primary to-secondary",
        rainbow: "bg-gradient-to-r from-love via-superlike to-success",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Progress = React.forwardRef(({ className, value, variant, size, showValue, ...props }, ref) => (
  <div className="relative">
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(progressVariants({ size }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(progressIndicatorVariants({ variant }))}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
    {showValue && (
      <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full ml-2 text-xs font-medium text-muted-foreground">
        {value || 0}%
      </span>
    )}
  </div>
))
Progress.displayName = ProgressPrimitive.Root.displayName

// Circular progress variant
const CircularProgress = React.forwardRef(({ value = 0, size = 48, strokeWidth = 4, variant = "default", className, children }, ref) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  const colorMap = {
    default: "stroke-primary",
    success: "stroke-success",
    warning: "stroke-warning",
    error: "stroke-destructive",
    love: "stroke-love",
    info: "stroke-info",
  }

  return (
    <div ref={ref} className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-300 ease-out", colorMap[variant])}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
})
CircularProgress.displayName = "CircularProgress"

export { Progress, CircularProgress, progressVariants, progressIndicatorVariants }
