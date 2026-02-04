import * as React from "react"
import { Check } from "lucide-react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Stepper Component - Bellor Design System
 *
 * Progress stepper for multi-step forms and onboarding
 */
const stepperVariants = cva("flex items-center", {
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col items-start",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
})

const stepVariants = cva(
  "flex items-center justify-center rounded-full font-semibold transition-all duration-300",
  {
    variants: {
      status: {
        completed: "bg-primary text-primary-foreground",
        active: "bg-primary text-primary-foreground ring-4 ring-primary/20",
        pending: "bg-muted text-muted-foreground",
      },
      size: {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
      },
    },
    defaultVariants: {
      status: "pending",
      size: "md",
    },
  }
)

const connectorVariants = cva("transition-all duration-300", {
  variants: {
    orientation: {
      horizontal: "h-0.5 flex-1 mx-2",
      vertical: "w-0.5 h-8 ml-5 my-2",
    },
    status: {
      completed: "bg-primary",
      pending: "bg-muted",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    status: "pending",
  },
})

const Stepper = React.forwardRef(({
  steps,
  currentStep = 0,
  orientation = "horizontal",
  size = "md",
  showLabels = true,
  className,
  onStepClick,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(stepperVariants({ orientation }), className)}
      {...props}
    >
      {steps.map((step, index) => {
        const status = index < currentStep
          ? "completed"
          : index === currentStep
            ? "active"
            : "pending"

        const isClickable = onStepClick && index <= currentStep

        return (
          <React.Fragment key={index}>
            <div
              className={cn(
                "flex items-center",
                orientation === "vertical" && "flex-row",
                orientation === "horizontal" && "flex-col"
              )}
            >
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  stepVariants({ status, size }),
                  isClickable && "cursor-pointer hover:ring-4 hover:ring-primary/30",
                  !isClickable && "cursor-default"
                )}
              >
                {status === "completed" ? (
                  <Check className={cn(
                    size === "sm" && "h-4 w-4",
                    size === "md" && "h-5 w-5",
                    size === "lg" && "h-6 w-6"
                  )} />
                ) : (
                  index + 1
                )}
              </button>
              {showLabels && (
                <div
                  className={cn(
                    "text-center",
                    orientation === "horizontal" && "mt-2",
                    orientation === "vertical" && "ml-3"
                  )}
                >
                  <p
                    className={cn(
                      "text-sm font-medium",
                      status === "active" && "text-foreground",
                      status !== "active" && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  connectorVariants({
                    orientation,
                    status: index < currentStep ? "completed" : "pending",
                  })
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
})
Stepper.displayName = "Stepper"

// Simple dot stepper for mobile
const DotStepper = React.forwardRef(({
  total,
  current = 0,
  size = "md",
  className,
  ...props
}, ref) => {
  const dotSizes = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-3 w-3",
  }

  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "rounded-full transition-all duration-300",
            dotSizes[size],
            index === current
              ? "bg-primary w-6"
              : index < current
                ? "bg-primary"
                : "bg-muted"
          )}
        />
      ))}
    </div>
  )
})
DotStepper.displayName = "DotStepper"

export { Stepper, DotStepper, stepperVariants, stepVariants }
