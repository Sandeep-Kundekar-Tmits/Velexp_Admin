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
        // Blurred, not just dimmed: the dialog is glass, and glass over a sharp
        // screenshot of the page reads as a rendering artefact.
        "fixed inset-0 z-[1050] flex justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm",
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
        /* Same glass as the sidebar rail, the grid panel and the drawers, so a
           dialog reads as part of the same surface family. */
        className={cn(
          "w-full overflow-hidden rounded-2xl border border-white/10",
          "bg-[rgba(17,24,39,0.85)] backdrop-blur-xl",
          "shadow-[0_30px_80px_-30px_rgba(2,6,23,0.95)]",
          MODAL_SIZES[size] || MODAL_SIZES.md,
          scrollable && "scroll-slim max-h-[85vh] overflow-y-auto",
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
      className={cn(
        "flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-3.5",
        className
      )}
      {...rest}
    >
      <h5 className="text-[15px] font-semibold tracking-tight text-white">{children}</h5>
      {toggle && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Close"
          /* A 28px round target, matching the drawers. It was a bare &times;
             glyph with about 10px of clickable area. */
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg leading-none text-ink-muted transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          &times;
        </button>
      )}
    </div>
  );
});

export const ModalBody = forwardRef(function ModalBody({ className, children, ...rest }, ref) {
  return (
    <div ref={ref} className={cn("px-5 py-4", className)} {...rest}>
      {children}
    </div>
  );
});

export const ModalFooter = forwardRef(function ModalFooter({ className, children, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex shrink-0 items-center justify-end gap-2 border-t border-white/10 px-5 py-3.5", className)}
      {...rest}
    >
      {children}
    </div>
  );
});

/* ---------------- Offcanvas ---------------- */

/* Inset by the same gutter the sidebar rail uses, so a panel floats on the
   canvas rather than being welded to the window edge. max-* rather than a fixed
   size: callers pass their own width (500px on the POD panels) and it must
   still fit a small window. */
const OFFCANVAS_POS = {
  start: "left-[--sidebar-gap] top-[--sidebar-gap] bottom-[--sidebar-gap] w-80 max-w-[calc(100vw-2*var(--sidebar-gap))]",
  end: "right-[--sidebar-gap] top-[--sidebar-gap] bottom-[--sidebar-gap] w-80 max-w-[calc(100vw-2*var(--sidebar-gap))]",
  top: "left-[--sidebar-gap] right-[--sidebar-gap] top-[--sidebar-gap] h-64",
  bottom: "left-[--sidebar-gap] right-[--sidebar-gap] bottom-[--sidebar-gap] h-64",
};

export const Offcanvas = forwardRef(function Offcanvas(
  { isOpen, toggle, direction = "start", className, children, ...rest },
  ref
) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1045]">
      {/* Blurred, not just dimmed: the panel is glass, and glass over a sharp
          screenshot of the page reads as a rendering artefact. */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onMouseDown={toggle} />
      <div
        ref={ref}
        /* flex column so OffcanvasBody scrolls on its own and the header stays
           put -- the body used to scroll the whole panel, header included. */
        className={cn(
          "absolute flex flex-col overflow-hidden rounded-2xl border border-white/10",
          "bg-[rgba(17,24,39,0.85)] backdrop-blur-xl",
          "shadow-[0_30px_80px_-30px_rgba(2,6,23,0.95)]",
          OFFCANVAS_POS[direction],
          className
        )}
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
      className={cn(
        "flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-3.5",
        className
      )}
      {...rest}
    >
      <h5 className="text-[15px] font-semibold tracking-tight text-white">{children}</h5>
      {toggle && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Close"
          /* A 28px round target instead of a bare &times; glyph, which was
             about 10px of clickable area. */
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg leading-none text-ink-muted transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          &times;
        </button>
      )}
    </div>
  );
});

export const OffcanvasBody = forwardRef(function OffcanvasBody({ className, children, ...rest }, ref) {
  return (
    /* min-h-0 with flex-1: without it the body would take its content height
       and push past the panel instead of scrolling inside it. */
    <div ref={ref} className={cn("scroll-slim min-h-0 flex-1 overflow-y-auto px-5 py-4", className)} {...rest}>
      {children}
    </div>
  );
});
