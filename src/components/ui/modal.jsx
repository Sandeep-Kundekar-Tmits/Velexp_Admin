/**
 * Modal / Offcanvas, API-compatible with reactstrap.
 *
 * Replaces three competing mechanisms in the codebase: reactstrap <Modal>,
 * a SimpleModal wrapper driving the raw Bootstrap 5 JS API imperatively, and
 * assorted one-off dialogs.
 *
 * Rendered in place rather than through a portal, matching reactstrap's
 * default behaviour closely enough for the existing call sites, while adding
 * Escape-to-close and scroll locking, which the Bootstrap version relied on
 * its own JS for.
 */
import { forwardRef, useEffect } from "react";
import { cn } from "@/lib/cn";

const MODAL_SIZES = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl", xl: "max-w-5xl" };

export const Modal = forwardRef(function Modal(
  { isOpen, toggle, size = "md", centered, scrollable, className, children, ...rest },
  ref
) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && toggle) toggle();
    };
    document.addEventListener("keydown", onKey);
    // Bootstrap's JS used to handle this; without it the page behind scrolls.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [isOpen, toggle]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[1050] flex justify-center overflow-y-auto bg-black/50 p-4",
        centered ? "items-center" : "items-start pt-16"
      )}
      onMouseDown={(e) => {
        // Backdrop click closes; mousedown so a drag ending outside doesn't.
        if (e.target === e.currentTarget && toggle) toggle();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn(
          "w-full rounded-lg bg-surface shadow-xl",
          MODAL_SIZES[size] || MODAL_SIZES.md,
          scrollable && "max-h-[85vh] overflow-y-auto",
          className
        )}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
});

export const ModalHeader = forwardRef(function ModalHeader(
  { toggle, className, children, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-between border-b border-line px-4 py-3", className)}
      {...rest}
    >
      <h5 className="font-semibold text-ink">{children}</h5>
      {toggle && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Close"
          className="text-xl leading-none text-ink-muted hover:text-ink"
        >
          &times;
        </button>
      )}
    </div>
  );
});

export const ModalBody = forwardRef(function ModalBody({ className, children, ...rest }, ref) {
  return (
    <div ref={ref} className={cn("px-4 py-3", className)} {...rest}>
      {children}
    </div>
  );
});

export const ModalFooter = forwardRef(function ModalFooter({ className, children, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-end gap-2 border-t border-line px-4 py-3", className)}
      {...rest}
    >
      {children}
    </div>
  );
});

/* ---------------- Offcanvas ---------------- */

const OFFCANVAS_POS = {
  start: "left-0 top-0 h-full w-80 border-r",
  end: "right-0 top-0 h-full w-80 border-l",
  top: "left-0 top-0 w-full h-64 border-b",
  bottom: "left-0 bottom-0 w-full h-64 border-t",
};

export const Offcanvas = forwardRef(function Offcanvas(
  { isOpen, toggle, direction = "start", className, children, ...rest },
  ref
) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1045]">
      <div className="absolute inset-0 bg-black/50" onMouseDown={toggle} />
      <div
        ref={ref}
        className={cn("absolute bg-surface border-line shadow-xl", OFFCANVAS_POS[direction], className)}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
});

export const OffcanvasHeader = forwardRef(function OffcanvasHeader(
  { toggle, className, children, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-between border-b border-line px-4 py-3", className)}
      {...rest}
    >
      <h5 className="font-semibold text-ink">{children}</h5>
      {toggle && (
        <button type="button" onClick={toggle} aria-label="Close" className="text-xl leading-none text-ink-muted hover:text-ink">
          &times;
        </button>
      )}
    </div>
  );
});

export const OffcanvasBody = forwardRef(function OffcanvasBody({ className, children, ...rest }, ref) {
  return (
    <div ref={ref} className={cn("overflow-y-auto px-4 py-3", className)} {...rest}>
      {children}
    </div>
  );
});
