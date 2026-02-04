import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Card Component - Bellor Design System
 *
 * Enhanced card with variants for dating app:
 * - default: Standard card with subtle shadow
 * - elevated: Higher elevation with larger shadow
 * - interactive: Hover effects for clickable cards
 * - profile: For user profile cards
 * - glass: Glassmorphism effect
 */
const cardVariants = cva(
  "rounded-2xl border bg-card text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "shadow-card",
        elevated: "shadow-lg hover:shadow-xl",
        interactive: "shadow-card hover:shadow-card-hover hover:-translate-y-1 cursor-pointer",
        profile: "shadow-lg overflow-hidden",
        glass: "bg-card/80 backdrop-blur-lg border-white/20",
        outline: "border-2 border-border shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Card = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(cardVariants({ variant }), className)}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-5", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-5 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Profile Card Image - For dating profile cards
const CardImage = React.forwardRef(({ className, src, alt, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("relative aspect-[3/4] overflow-hidden", className)}
    {...props}
  >
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
    />
  </div>
))
CardImage.displayName = "CardImage"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardImage,
  cardVariants,
}
