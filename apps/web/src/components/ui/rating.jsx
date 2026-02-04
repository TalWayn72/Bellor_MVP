import * as React from "react"
import { Star, Heart } from "lucide-react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Rating Component - Bellor Design System
 *
 * Star/Heart rating component for feedback and reviews
 */
const ratingVariants = cva("flex items-center gap-1", {
  variants: {
    size: {
      sm: "[&_svg]:h-4 [&_svg]:w-4",
      md: "[&_svg]:h-5 [&_svg]:w-5",
      lg: "[&_svg]:h-6 [&_svg]:w-6",
      xl: "[&_svg]:h-8 [&_svg]:w-8",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

const Rating = React.forwardRef(({
  value = 0,
  max = 5,
  size = "md",
  variant = "star",
  readOnly = false,
  onChange,
  className,
  ...props
}, ref) => {
  const [hoverValue, setHoverValue] = React.useState(0)

  const IconComponent = variant === "heart" ? Heart : Star

  const handleClick = (index) => {
    if (!readOnly && onChange) {
      onChange(index + 1)
    }
  }

  const handleMouseEnter = (index) => {
    if (!readOnly) {
      setHoverValue(index + 1)
    }
  }

  const handleMouseLeave = () => {
    setHoverValue(0)
  }

  const displayValue = hoverValue || value

  const getIconColor = (index) => {
    const filled = index < displayValue
    if (variant === "heart") {
      return filled ? "text-love fill-love" : "text-muted-foreground/30"
    }
    return filled ? "text-superlike fill-superlike" : "text-muted-foreground/30"
  }

  return (
    <div
      ref={ref}
      className={cn(ratingVariants({ size }), className)}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {Array.from({ length: max }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => handleClick(index)}
          onMouseEnter={() => handleMouseEnter(index)}
          disabled={readOnly}
          className={cn(
            "transition-all duration-150",
            !readOnly && "hover:scale-110 cursor-pointer",
            readOnly && "cursor-default"
          )}
        >
          <IconComponent
            className={cn(
              "transition-colors duration-150",
              getIconColor(index)
            )}
          />
        </button>
      ))}
    </div>
  )
})
Rating.displayName = "Rating"

// Rating with label
const RatingWithLabel = React.forwardRef(({
  value = 0,
  labels = ["Poor", "Fair", "Good", "Very Good", "Excellent"],
  ...props
}, ref) => {
  const label = value > 0 ? labels[Math.min(value - 1, labels.length - 1)] : ""

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <Rating value={value} {...props} />
      {label && (
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  )
})
RatingWithLabel.displayName = "RatingWithLabel"

export { Rating, RatingWithLabel, ratingVariants }
