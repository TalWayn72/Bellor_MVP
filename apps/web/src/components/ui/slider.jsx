import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Slider Component - Bellor Design System
 *
 * Enhanced range slider with size and color variants
 */
const sliderVariants = cva(
  "relative flex w-full touch-none select-none items-center",
  {
    variants: {
      size: {
        sm: "[&_[data-track]]:h-1 [&_[data-thumb]]:h-3 [&_[data-thumb]]:w-3",
        md: "[&_[data-track]]:h-2 [&_[data-thumb]]:h-4 [&_[data-thumb]]:w-4",
        lg: "[&_[data-track]]:h-3 [&_[data-thumb]]:h-5 [&_[data-thumb]]:w-5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const trackVariants = cva(
  "relative w-full grow overflow-hidden rounded-full",
  {
    variants: {
      variant: {
        default: "bg-primary/20",
        success: "bg-success/20",
        love: "bg-love/20",
        muted: "bg-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const rangeVariants = cva("absolute h-full", {
  variants: {
    variant: {
      default: "bg-primary",
      success: "bg-success",
      love: "bg-love",
      gradient: "bg-gradient-to-r from-primary to-secondary",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const thumbVariants = cva(
  "block rounded-full border-2 bg-background shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110",
  {
    variants: {
      variant: {
        default: "border-primary focus-visible:ring-primary/20",
        success: "border-success focus-visible:ring-success/20",
        love: "border-love focus-visible:ring-love/20",
        gradient: "border-primary focus-visible:ring-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Slider = React.forwardRef(({
  className,
  variant = "default",
  size = "md",
  showValue = false,
  formatValue = (v) => v,
  ...props
}, ref) => {
  const value = props.value || props.defaultValue || [0]

  return (
    <div className="relative w-full">
      <SliderPrimitive.Root
        ref={ref}
        className={cn(sliderVariants({ size }), className)}
        {...props}
      >
        <SliderPrimitive.Track
          data-track
          className={cn(trackVariants({ variant }))}
        >
          <SliderPrimitive.Range className={cn(rangeVariants({ variant }))} />
        </SliderPrimitive.Track>
        {(Array.isArray(value) ? value : [value]).map((_, i) => (
          <SliderPrimitive.Thumb
            key={i}
            data-thumb
            className={cn(thumbVariants({ variant }))}
          />
        ))}
      </SliderPrimitive.Root>
      {showValue && (
        <div className="flex justify-between mt-2">
          {(Array.isArray(value) ? value : [value]).map((v, i) => (
            <span key={i} className="text-xs font-medium text-muted-foreground">
              {formatValue(v)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

// Range slider with labels
const RangeSlider = React.forwardRef(({
  min = 0,
  max = 100,
  minLabel,
  maxLabel,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      <Slider ref={ref} min={min} max={max} {...props} />
      <div className="flex justify-between mt-2">
        <span className="text-xs text-muted-foreground">
          {minLabel || min}
        </span>
        <span className="text-xs text-muted-foreground">
          {maxLabel || max}
        </span>
      </div>
    </div>
  )
})
RangeSlider.displayName = "RangeSlider"

export { Slider, RangeSlider, sliderVariants }
