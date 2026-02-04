"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Avatar Component - Bellor Design System
 *
 * Enhanced avatar with size variants and status indicators
 * for dating app profiles
 */
const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        xs: "h-6 w-6",
        sm: "h-8 w-8",
        default: "h-10 w-10",
        md: "h-12 w-12",
        lg: "h-16 w-16",
        xl: "h-20 w-20",
        "2xl": "h-24 w-24",
        "3xl": "h-32 w-32",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const Avatar = React.forwardRef(({ className, size, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ size }), className)}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-semibold",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Online status indicator for dating profiles
const statusVariants = cva(
  "absolute rounded-full border-2 border-background",
  {
    variants: {
      status: {
        online: "bg-success",
        offline: "bg-muted-foreground",
        away: "bg-warning",
      },
      size: {
        xs: "h-1.5 w-1.5 bottom-0 right-0",
        sm: "h-2 w-2 bottom-0 right-0",
        default: "h-2.5 w-2.5 bottom-0 right-0",
        md: "h-3 w-3 bottom-0 right-0",
        lg: "h-3.5 w-3.5 bottom-0.5 right-0.5",
        xl: "h-4 w-4 bottom-1 right-1",
        "2xl": "h-5 w-5 bottom-1 right-1",
        "3xl": "h-6 w-6 bottom-1.5 right-1.5",
      },
    },
    defaultVariants: {
      status: "offline",
      size: "default",
    },
  }
)

const AvatarStatus = React.forwardRef(({ className, status, size, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(statusVariants({ status, size }), className)}
    {...props}
  />
))
AvatarStatus.displayName = "AvatarStatus"

// Verified badge for dating profiles
const AvatarBadge = React.forwardRef(({ className, verified, premium, size, ...props }, ref) => {
  if (!verified && !premium) return null

  const badgeSizes = {
    xs: "h-3 w-3 -bottom-0.5 -right-0.5",
    sm: "h-4 w-4 -bottom-0.5 -right-0.5",
    default: "h-5 w-5 -bottom-1 -right-1",
    md: "h-5 w-5 -bottom-1 -right-1",
    lg: "h-6 w-6 -bottom-1 -right-1",
    xl: "h-7 w-7 -bottom-1.5 -right-1.5",
    "2xl": "h-8 w-8 -bottom-2 -right-2",
    "3xl": "h-10 w-10 -bottom-2 -right-2",
  }

  return (
    <span
      ref={ref}
      className={cn(
        "absolute flex items-center justify-center rounded-full",
        premium ? "bg-gradient-to-r from-superlike to-superlike-dark" : "bg-info",
        badgeSizes[size || "default"],
        className
      )}
      {...props}
    >
      <svg
        className="h-3/5 w-3/5 text-white"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  )
})
AvatarBadge.displayName = "AvatarBadge"

// Composite Avatar with status and badge
const AvatarWithStatus = React.forwardRef(({
  src,
  alt,
  fallback,
  size,
  status,
  verified,
  premium,
  className,
  ...props
}, ref) => (
  <div className={cn("relative inline-block", className)} ref={ref} {...props}>
    <Avatar size={size}>
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
    {status && <AvatarStatus status={status} size={size} />}
    <AvatarBadge verified={verified} premium={premium} size={size} />
  </div>
))
AvatarWithStatus.displayName = "AvatarWithStatus"

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarStatus,
  AvatarBadge,
  AvatarWithStatus,
  avatarVariants,
}
