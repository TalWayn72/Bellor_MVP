import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

declare const Dialog: typeof DialogPrimitive.Root;
declare const DialogTrigger: typeof DialogPrimitive.Trigger;
declare const DialogPortal: typeof DialogPrimitive.Portal;
declare const DialogClose: typeof DialogPrimitive.Close;

declare const DialogOverlay: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> &
    React.RefAttributes<HTMLDivElement>
>;

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  showClose?: boolean;
}

declare const DialogContent: React.ForwardRefExoticComponent<
  DialogContentProps & React.RefAttributes<HTMLDivElement>
>;

declare const DialogContentFullScreen: React.ForwardRefExoticComponent<
  DialogContentProps & React.RefAttributes<HTMLDivElement>
>;

declare const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>;
declare const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>;

declare const DialogTitle: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> &
    React.RefAttributes<HTMLHeadingElement>
>;

declare const DialogDescription: React.ForwardRefExoticComponent<
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> &
    React.RefAttributes<HTMLParagraphElement>
>;

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
};
