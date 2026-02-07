"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Dialog Component - Bellor Design System
 *
 * Enhanced dialog with better animations and styling
 */
const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef(({ className, children, showClose = true, ...props }, ref) => {
  // Generate a unique ID for the hidden description
  const descriptionId = React.useId();

  // Check if children already contains a DialogDescription
  const hasDescription = React.Children.toArray(children).some(
    child => React.isValidElement(child) &&
      (child.type === DialogPrimitive.Description ||
       child.type?.displayName === 'DialogDescription' ||
       child.type?.displayName === DialogPrimitive.Description?.displayName)
  );

  // Only use our generated aria-describedby if one wasn't provided and no Description child exists
  const ariaDescribedBy = props['aria-describedby'] !== undefined
    ? props['aria-describedby']
    : (!hasDescription ? descriptionId : undefined);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        aria-describedby={ariaDescribedBy}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-2xl",
          className
        )}
        {...props}
      >
        {children}
        {/* Hidden description for accessibility when none provided */}
        {!hasDescription && !props['aria-describedby'] && (
          <span id={descriptionId} className="sr-only">
            Dialog content
          </span>
        )}
        {showClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

// Full screen dialog for mobile
const DialogContentFullScreen = React.forwardRef(({ className, children, showClose = true, ...props }, ref) => {
  const descriptionId = React.useId();

  const hasDescription = React.Children.toArray(children).some(
    child => React.isValidElement(child) &&
      (child.type === DialogPrimitive.Description ||
       child.type?.displayName === 'DialogDescription' ||
       child.type?.displayName === DialogPrimitive.Description?.displayName)
  );

  const ariaDescribedBy = props['aria-describedby'] !== undefined
    ? props['aria-describedby']
    : (!hasDescription ? descriptionId : undefined);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        aria-describedby={ariaDescribedBy}
        className={cn(
          "fixed inset-0 z-50 bg-background p-6 duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:inset-auto sm:left-[50%] sm:top-[50%] sm:max-h-[90vh] sm:w-full sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:border sm:shadow-xl",
          className
        )}
        {...props}
      >
        {children}
        {!hasDescription && !props['aria-describedby'] && (
          <span id={descriptionId} className="sr-only">
            Dialog content
          </span>
        )}
        {showClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1.5 opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContentFullScreen.displayName = "DialogContentFullScreen"

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogContentFullScreen,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
