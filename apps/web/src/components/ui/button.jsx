import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Button Component - Bellor Design System
 *
 * Enhanced button with dating app specific variants:
 * - love: For like/heart actions (rose color with glow)
 * - match: For match celebrations (purple gradient)
 * - premium: For premium features (gold accent)
 */
const buttonVariants = cva(
  // Base styles with improved transitions
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary - Rose/Pink brand color
        default:
          "bg-primary text-primary-foreground shadow-primary-sm hover:bg-primary-600 hover:shadow-primary-md",

        // Destructive - For delete/remove actions
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",

        // Outline - Bordered style
        outline:
          "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",

        // Secondary - Muted background
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",

        // Ghost - No background until hover
        ghost:
          "hover:bg-accent hover:text-accent-foreground",

        // Link - Text only with underline
        link:
          "text-primary underline-offset-4 hover:underline",

        // Love - For like/heart buttons (dating specific)
        love:
          "bg-love text-white shadow-primary-md hover:bg-love-dark hover:shadow-primary-lg hover:animate-like-pop",

        // Match - For match actions (dating specific)
        match:
          "bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg hover:from-primary-600 hover:to-secondary-600",

        // Premium - For premium features
        premium:
          "bg-gradient-to-r from-superlike to-superlike-dark text-white shadow-lg hover:shadow-xl",

        // Success - For confirmation actions
        success:
          "bg-success text-success-foreground shadow-sm hover:bg-success/90",

        // Soft - Light background version
        soft:
          "bg-primary-50 text-primary-600 hover:bg-primary-100",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg font-bold",
        icon: "h-10 w-10 rounded-full",
        "icon-sm": "h-8 w-8 rounded-full",
        "icon-lg": "h-12 w-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {props.children}
        </>
      ) : (
        props.children
      )}
    </Comp>
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
