/**
 * Modal / Offcanvas, API-compatible with reactstrap.
 *
 * Replaces three competing mechanisms in the codebase: reactstrap <Modal>,
 * a SimpleModal wrapper driving the raw Bootstrap 5 JS API imperatively, and
 * assorted one-off dialogs.
 *
 * Adds Escape-to-close and scroll locking, which the Bootstrap version relied
 * on its own JS for.
 *
 * Portalled to <body>, which it did not used to be.
 *
 * `position: fixed` is relative to the viewport only while no ancestor
 * establishes a containing block -- and `backdrop-filter` does, along with
 * transform, filter, perspective, contain and will-change. Once Card and the
 * glass panels grew `backdrop-blur`, every dialog rendered inside one was
 * being centred within that panel rather than on the screen. Portalling puts
 * the overlay outside all of them, so `fixed inset-0` means the window again.
 */
import { forwardRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

/* Portals need a live document; guarded so a non-browser render is a no-op
   rather than a crash. */
const portal = (node) =>
  typeof document === "undefined" ? null : createPortal(node, document.body);

const MODAL_SIZES = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl", xl: "max-w-5xl" };

export const Modal = forwardRef(function Modal(
  {
    isOpen,
    toggle,
    size = "md",
    centered,
    scrollable,
    /* Fills the viewport instead of sizing to `size`. Reactstrap's Modal has
       this and call sites already passed it -- without it here the prop fell
       through to the dialog div as an unknown DOM attribute and the modal
       opened at max-w-lg, which is what made the map drill-down a small box
       rather than the full-screen view it was written to be. */
    fullscreen,
    /* Swallowed, not spread: another reactstrap prop that would otherwise land
       on the DOM as an invalid attribute. */
    modalClassName,
    className,
    children,
    ...rest
  },
  ref
) {
  void modalClassName;
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

  return portal(
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
          "w-full overflow-hidden rounded-2xl border border-[rgb(var(--overlay-rgb)/0.1)]",
          "bg-[color-mix(in_srgb,var(--color-surface)_85%,transparent)] backdrop-blur-xl",
          "shadow-[0_30px_80px_-30px_var(--shadow-elevated-strong)]",
          /* max-w-none to beat the size cap, and a flex column so the body
             takes the leftover height -- a full-screen dialog whose body is
             auto-height would leave the map floating at the top of an empty
             sheet. The 2rem allows for the wrapper's p-4. */
          fullscreen
            ? "flex h-[calc(100vh-2rem)] max-w-none flex-col"
            : MODAL_SIZES[size] || MODAL_SIZES.md,
          scrollable && !fullscreen && "scroll-slim max-h-[85vh] overflow-y-auto",
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
        "flex shrink-0 items-center justify-between border-b border-[rgb(var(--overlay-rgb)/0.1)] px-5 py-3.5",
        className
      )}
      {...rest}
    >
      <h5 className="text-[15px] font-semibold tracking-tight text-ink">{children}</h5>
      {toggle && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Close"
          /* A 28px round target, matching the drawers. It was a bare &times;
             glyph with about 10px of clickable area. */
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[rgb(var(--overlay-rgb)/0.1)] bg-[rgb(var(--overlay-rgb)/0.05)] text-lg leading-none text-ink-muted transition-colors hover:border-[rgb(var(--overlay-rgb)/0.2)] hover:bg-[rgb(var(--overlay-rgb)/0.1)] hover:text-ink"
        >
          &times;
        </button>
      )}
    </div>
  );
});

export const ModalBody = forwardRef(function ModalBody({ className, children, ...rest }, ref) {
  return (
    /* min-h-0 flex-1: harmless in a normal dialog, where the body is the only
       growable child anyway, and what lets it fill the leftover height in a
       fullscreen one instead of collapsing to its content. */
    <div ref={ref} className={cn("min-h-0 flex-1 px-5 py-4", className)} {...rest}>
      {children}
    </div>
  );
});

export const ModalFooter = forwardRef(function ModalFooter({ className, children, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn("flex shrink-0 items-center justify-end gap-2 border-t border-[rgb(var(--overlay-rgb)/0.1)] px-5 py-3.5", className)}
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
  return portal(
    <div className="fixed inset-0 z-[1045]">
      {/* Blurred, not just dimmed: the panel is glass, and glass over a sharp
          screenshot of the page reads as a rendering artefact. */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onMouseDown={toggle} />
      <div
        ref={ref}
        /* flex column so OffcanvasBody scrolls on its own and the header stays
           put -- the body used to scroll the whole panel, header included. */
        className={cn(
          "absolute flex flex-col overflow-hidden rounded-2xl border border-[rgb(var(--overlay-rgb)/0.1)]",
          "bg-[color-mix(in_srgb,var(--color-surface)_85%,transparent)] backdrop-blur-xl",
          "shadow-[0_30px_80px_-30px_var(--shadow-elevated-strong)]",
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
        "flex shrink-0 items-center justify-between border-b border-[rgb(var(--overlay-rgb)/0.1)] px-5 py-3.5",
        className
      )}
      {...rest}
    >
      <h5 className="text-[15px] font-semibold tracking-tight text-ink">{children}</h5>
      {toggle && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Close"
          /* A 28px round target instead of a bare &times; glyph, which was
             about 10px of clickable area. */
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[rgb(var(--overlay-rgb)/0.1)] bg-[rgb(var(--overlay-rgb)/0.05)] text-lg leading-none text-ink-muted transition-colors hover:border-[rgb(var(--overlay-rgb)/0.2)] hover:bg-[rgb(var(--overlay-rgb)/0.1)] hover:text-ink"
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
