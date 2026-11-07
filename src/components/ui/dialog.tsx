"use client";

// shadcn/ui Dialog (new-york), restyled to the site tokens.
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CloseIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn("fixed inset-0 z-50 bg-[rgba(10,12,15,0.82)] data-[state=open]:animate-in-fade", className)}
      {...props}
    />
  );
}

export function DialogContent({
  className,
  children,
  closeLabel = "Close",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { closeLabel?: string }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      {/* The scroll container sits outside Content so the whole panel scrolls. */}
      <div className="fixed inset-0 z-50 overflow-y-auto sm:px-4 sm:py-6">
        <DialogPrimitive.Content
          data-slot="dialog-content"
          className={cn("relative mx-auto w-full max-w-[860px] outline-none", className)}
          {...props}
        >
          {children}
          <DialogPrimitive.Close
            aria-label={closeLabel}
            className="absolute top-3.5 right-3.5 flex size-11 items-center justify-center rounded-full bg-control text-text transition-colors hover:bg-chip"
          >
            <CloseIcon />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </div>
    </DialogPortal>
  );
}
