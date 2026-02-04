import * as React from "react"
import { X } from "lucide-react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Chip Component - Bellor Design System
 *
 * Interactive chip/tag component for selections and filters
 */
const chipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-muted text-foreground hover:bg-muted/80",
        primary: "bg-primary/10 text-primary hover:bg-primary/20",
        secondary: "bg-secondary/10 text-secondary-foreground hover:bg-secondary/20",
        outline: "border-2 border-border text-foreground hover:border-primary hover:text-primary",
        success: "bg-success/10 text-success hover:bg-success/20",
        love: "bg-love/10 text-love hover:bg-love/20",
        info: "bg-info/10 text-info hover:bg-info/20",
      },
      size: {
        sm: "h-6 px-2 text-xs",
        md: "h-8 px-3 text-sm",
        lg: "h-10 px-4 text-base",
      },
      selected: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        selected: true,
        className: "bg-primary text-primary-foreground hover:bg-primary/90",
      },
      {
        variant: "outline",
        selected: true,
        className: "border-primary bg-primary/10 text-primary",
      },
      {
        variant: "primary",
        selected: true,
        className: "bg-primary text-primary-foreground",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      selected: false,
    },
  }
)

const Chip = React.forwardRef(({
  className,
  variant,
  size,
  selected = false,
  onDelete,
  onClick,
  icon,
  children,
  ...props
}, ref) => {
  const isInteractive = onClick || onDelete

  return (
    <span
      ref={ref}
      role={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        chipVariants({ variant, size, selected }),
        isInteractive && "cursor-pointer",
        className
      )}
      {...props}
    >
      {icon && <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>}
      {children}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 transition-colors"
        >
          <X className={cn(
            size === "sm" && "h-3 w-3",
            size === "md" && "h-3.5 w-3.5",
            size === "lg" && "h-4 w-4"
          )} />
        </button>
      )}
    </span>
  )
})
Chip.displayName = "Chip"

// Chip Group for multi-selection
const ChipGroup = React.forwardRef(({
  options,
  value = [],
  onChange,
  multiple = true,
  variant = "outline",
  size = "md",
  className,
  ...props
}, ref) => {
  const handleToggle = (option) => {
    if (multiple) {
      const isSelected = value.includes(option)
      const newValue = isSelected
        ? value.filter((v) => v !== option)
        : [...value, option]
      onChange?.(newValue)
    } else {
      onChange?.([option])
    }
  }

  return (
    <div
      ref={ref}
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    >
      {options.map((option) => {
        const optionValue = typeof option === "string" ? option : option.value
        const optionLabel = typeof option === "string" ? option : option.label
        const optionIcon = typeof option === "object" ? option.icon : undefined
        const isSelected = value.includes(optionValue)

        return (
          <Chip
            key={optionValue}
            variant={variant}
            size={size}
            selected={isSelected}
            onClick={() => handleToggle(optionValue)}
            icon={optionIcon}
          >
            {optionLabel}
          </Chip>
        )
      })}
    </div>
  )
})
ChipGroup.displayName = "ChipGroup"

export { Chip, ChipGroup, chipVariants }
