import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Badge Component - Bellor Design System
 *
 * Enhanced badge with dating app specific variants:
 * - online/offline: User status
 * - verified: Profile verification
 * - premium: Premium membership
 * - match: Match indicator
 * - new: New content indicator
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Standard variants
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm",
        outline:
          "border-border text-foreground bg-transparent",

        // Success/Error variants
        success:
          "border-transparent bg-success text-success-foreground",
        warning:
          "border-transparent bg-warning text-warning-foreground",
        info:
          "border-transparent bg-info text-info-foreground",

        // Dating app specific variants
        online:
          "border-transparent bg-success text-success-foreground",
        offline:
          "border-transparent bg-muted text-muted-foreground",
        away:
          "border-transparent bg-warning text-warning-foreground",
        verified:
          "border-transparent bg-info text-info-foreground",
        premium:
          "border-transparent bg-gradient-to-r from-superlike to-superlike-dark text-white",
        match:
          "border-transparent bg-gradient-to-r from-primary to-secondary-500 text-white",
        new:
          "border-transparent bg-love text-white animate-pulse",
        superlike:
          "border-transparent bg-superlike text-white",

        // Soft variants (lighter background)
        "primary-soft":
          "border-transparent bg-primary/10 text-primary",
        "secondary-soft":
          "border-transparent bg-secondary-500/10 text-secondary-600",
        "success-soft":
          "border-transparent bg-success/10 text-success",
        "warning-soft":
          "border-transparent bg-warning/10 text-warning-600",
        "destructive-soft":
          "border-transparent bg-destructive/10 text-destructive",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({ className, variant, size, ...props }) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

// Badge with icon
function BadgeWithIcon({ className, variant, size, icon, children, ...props }) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), "gap-1", className)}
      {...props}
    >
      {icon}
      {children}
    </span>
  )
}

// Badge with dot indicator
function BadgeWithDot({ className, variant, size, dotColor, children, ...props }) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), "gap-1.5", className)}
      {...props}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          dotColor || "bg-current"
        )}
      />
      {children}
    </span>
  )
}

export { Badge, BadgeWithIcon, BadgeWithDot, badgeVariants }
