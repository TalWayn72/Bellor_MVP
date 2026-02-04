import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Checkbox Component - Bellor Design System
 *
 * Enhanced checkbox with size and color variants
 */
const checkboxVariants = cva(
  "peer shrink-0 rounded-md border-2 shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:ring-primary/20",
        success:
          "border-border data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-white focus-visible:ring-success/20",
        love:
          "border-border data-[state=checked]:border-love data-[state=checked]:bg-love data-[state=checked]:text-white focus-visible:ring-love/20",
        outline:
          "border-primary data-[state=checked]:bg-transparent data-[state=checked]:text-primary focus-visible:ring-primary/20",
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

const checkIconVariants = cva("", {
  variants: {
    size: {
      sm: "h-3 w-3",
      md: "h-3.5 w-3.5",
      lg: "h-4 w-4",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

const Checkbox = React.forwardRef(({ className, variant, size, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(checkboxVariants({ variant, size }), className)}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className={cn(checkIconVariants({ size }))} strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox, checkboxVariants }
