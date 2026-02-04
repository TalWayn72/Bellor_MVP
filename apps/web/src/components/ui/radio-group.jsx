import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Radio Group Component - Bellor Design System
 *
 * Enhanced radio buttons with size and color variants
 */
const radioItemVariants = cva(
  "aspect-square rounded-full border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-border data-[state=checked]:border-primary focus-visible:ring-primary/20",
        success:
          "border-border data-[state=checked]:border-success focus-visible:ring-success/20",
        love:
          "border-border data-[state=checked]:border-love focus-visible:ring-love/20",
      },
      size: {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

const radioIndicatorVariants = cva(
  "rounded-full",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-success",
        love: "bg-love",
      },
      size: {
        sm: "h-2 w-2",
        md: "h-2.5 w-2.5",
        lg: "h-3 w-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

const RadioGroup = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-3", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(radioItemVariants({ variant, size }), className)}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span className={cn(radioIndicatorVariants({ variant, size }))} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

// Radio Card variant for visual selection
const RadioCard = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "relative rounded-xl border-2 border-border p-4 transition-all duration-200 hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 cursor-pointer",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="absolute top-3 right-3">
        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </RadioGroupPrimitive.Indicator>
      {children}
    </RadioGroupPrimitive.Item>
  )
})
RadioCard.displayName = "RadioCard"

export { RadioGroup, RadioGroupItem, RadioCard, radioItemVariants }
