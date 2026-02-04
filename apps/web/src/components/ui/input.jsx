import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Input Component - Bellor Design System
 *
 * Enhanced input with better focus states and variants
 */
const inputVariants = cva(
  "flex w-full rounded-xl border bg-background px-4 py-3 text-base text-foreground transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-input focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        filled:
          "border-transparent bg-muted focus-visible:bg-background focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        outline:
          "border-2 border-border focus-visible:border-primary",
        ghost:
          "border-transparent hover:bg-muted focus-visible:bg-muted",
      },
      inputSize: {
        default: "h-11",
        sm: "h-9 px-3 py-2 text-sm rounded-lg",
        lg: "h-14 px-5 py-4 text-lg rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

const Input = React.forwardRef(({
  className,
  type,
  variant,
  inputSize,
  error,
  ...props
}, ref) => {
  return (
    <input
      type={type}
      className={cn(
        inputVariants({ variant, inputSize }),
        error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

// Input with icon wrapper
const InputWithIcon = React.forwardRef(({
  className,
  icon,
  iconPosition = "left",
  ...props
}, ref) => {
  return (
    <div className="relative">
      {icon && iconPosition === "left" && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      )}
      <Input
        ref={ref}
        className={cn(
          iconPosition === "left" && "pl-10",
          iconPosition === "right" && "pr-10",
          className
        )}
        {...props}
      />
      {icon && iconPosition === "right" && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      )}
    </div>
  )
})
InputWithIcon.displayName = "InputWithIcon"

export { Input, InputWithIcon, inputVariants }