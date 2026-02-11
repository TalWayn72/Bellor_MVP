import * as React from "react"
import { cva } from "class-variance-authority"
import { X, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Toast Component - Bellor Design System
 *
 * Enhanced toast notifications with semantic variants
 */
const ToastProvider = React.forwardRef(({ position = "bottom-right", children, ...props }, ref) => {
  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "fixed z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-[420px]",
        positionClasses[position]
      )}
      {...props}
    >
      {children}
    </div>
  )
})
ToastProvider.displayName = "ToastProvider"

const ToastViewport = React.forwardRef(({ ...props }, ref) => (
  <div
    ref={ref}
    className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:flex-col md:max-w-[420px]"
    {...props}
  />
))
ToastViewport.displayName = "ToastViewport"

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center gap-4 overflow-hidden rounded-xl border p-4 pr-10 shadow-lg transition-all animate-slide-up",
  {
    variants: {
      variant: {
        default: "border-border bg-background text-foreground",
        success: "border-success/20 bg-success/10 text-success-foreground",
        warning: "border-warning/20 bg-warning/10 text-warning-foreground",
        error: "border-destructive/20 bg-destructive/10 text-destructive-foreground",
        info: "border-info/20 bg-info/10 text-info-foreground",
        destructive: "border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const iconMap = {
  default: null,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  destructive: XCircle,
}

const iconColorMap = {
  default: "",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
  info: "text-info",
  destructive: "text-white",
}

const Toast = React.forwardRef(({ className, variant = "default", showIcon = true, open, onOpenChange, children, ...props }, ref) => {
  const IconComponent = iconMap[variant]

  return (
    <div
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      {showIcon && IconComponent && (
        <div className="flex-shrink-0">
          <IconComponent className={cn("h-5 w-5", iconColorMap[variant])} />
        </div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  )
})
Toast.displayName = "Toast"

const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = "ToastAction"

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "absolute right-3 top-3 rounded-lg p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground hover:bg-muted focus:opacity-100 focus:outline-none group-hover:opacity-100",
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
))
ToastClose.displayName = "ToastClose"

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  toastVariants,
}
