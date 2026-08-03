/**
 * Dropdown, popover, tooltip, progress, breadcrumb — the long tail of
 * reactstrap components, each used in only a handful of files.
 *
 * API-compatible with reactstrap, including its controlled Dropdown contract
 * (isOpen + toggle passed to the parent, consumed via context by the toggle
 * and menu children).
 */
import { createContext, forwardRef, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/* ---------------- Dropdown ---------------- */

const DropdownContext = createContext({ isOpen: false, toggle: () => {} });

export const Dropdown = forwardRef(function Dropdown(
  { isOpen, toggle, direction, className, children, ...rest },
  ref
) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) toggle?.();
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isOpen, toggle]);

  return (
    <DropdownContext.Provider value={{ isOpen, toggle, direction }}>
      <div
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn("relative inline-block", className)}
        {...rest}
      >
        {children}
      </div>
    </DropdownContext.Provider>
  );
});

export const DropdownToggle = forwardRef(function DropdownToggle(
  { tag: Tag = "button", caret, className, children, ...rest },
  ref
) {
  const { toggle } = useContext(DropdownContext);
  return (
    <Tag
      ref={ref}
      type={Tag === "button" ? "button" : undefined}
      onClick={toggle}
      className={cn("inline-flex cursor-pointer items-center gap-1", className)}
      {...rest}
    >
      {children}
      {caret && <span aria-hidden="true">▾</span>}
    </Tag>
  );
});

export const DropdownMenu = forwardRef(function DropdownMenu(
  { end, right, className, children, ...rest },
  ref
) {
  const { isOpen, direction } = useContext(DropdownContext);
  if (!isOpen) return null;
  return (
    <div
      ref={ref}
      role="menu"
      className={cn(
        "absolute z-[1060] mt-1 min-w-[10rem] rounded border border-line bg-surface py-1 shadow-lg",
        end || right ? "right-0" : "left-0",
        direction === "up" && "bottom-full mb-1 mt-0",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export const DropdownItem = forwardRef(function DropdownItem(
  { divider, header, tag: Tag = "button", className, children, ...rest },
  ref
) {
  if (divider) return <div className="my-1 border-t border-line" />;
  if (header) {
    return <div className={cn("px-3 py-1 text-xs font-semibold text-ink-muted", className)}>{children}</div>;
  }
  return (
    <Tag
      ref={ref}
      type={Tag === "button" ? "button" : undefined}
      className={cn("block w-full cursor-pointer px-3 py-1.5 text-left hover:bg-slate-50", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
});

/* ---------------- Popover / Tooltip ---------------- */

/** Uncontrolled popover anchored to the element with id={target}. */
export const UncontrolledPopover = forwardRef(function UncontrolledPopover(
  { target, placement = "bottom", trigger = "click", className, children, ...rest },
  ref
) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const el = document.getElementById(target);
    if (!el) return undefined;
    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    const toggle = () => setIsOpen((v) => !v);

    if (trigger === "hover") {
      el.addEventListener("mouseenter", open);
      el.addEventListener("mouseleave", close);
      return () => {
        el.removeEventListener("mouseenter", open);
        el.removeEventListener("mouseleave", close);
      };
    }
    el.addEventListener("click", toggle);
    return () => el.removeEventListener("click", toggle);
  }, [target, trigger]);

  if (!isOpen) return null;
  return (
    <div
      ref={ref}
      role="tooltip"
      className={cn(
        "absolute z-[1070] rounded border border-line bg-surface shadow-lg",
        placement === "top" && "bottom-full mb-1",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export const PopoverBody = forwardRef(function PopoverBody({ className, children, ...rest }, ref) {
  return (
    <div ref={ref} className={cn("px-3 py-2", className)} {...rest}>
      {children}
    </div>
  );
});

export const Tooltip = forwardRef(function Tooltip(
  { isOpen, target, placement = "top", className, children, ...rest },
  ref
) {
  void target;
  if (!isOpen) return null;
  return (
    <div
      ref={ref}
      role="tooltip"
      className={cn(
        "absolute z-[1070] rounded bg-slate-800 px-2 py-1 text-xs text-white",
        placement === "top" && "bottom-full mb-1",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

/* ---------------- Progress ---------------- */

export const Progress = forwardRef(function Progress(
  { value = 0, max = 100, color = "primary", striped, animated, className, children, ...rest },
  ref
) {
  const pct = Math.min(100, Math.max(0, (Number(value) / Number(max)) * 100));
  const bar = {
    primary: "bg-brand-500",
    success: "bg-success-500",
    danger: "bg-danger-500",
    warning: "bg-warning-500",
    info: "bg-accent-500",
  }[color] || "bg-brand-500";

  return (
    <div ref={ref} className={cn("h-2 w-full overflow-hidden rounded bg-slate-100", className)} {...rest}>
      <div
        className={cn("h-full transition-[width]", bar, (striped || animated) && "animate-pulse")}
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemax={max}
      >
        {children}
      </div>
    </div>
  );
});

/* ---------------- Breadcrumb ---------------- */

export const Breadcrumb = forwardRef(function Breadcrumb({ className, children, ...rest }, ref) {
  return (
    <nav ref={ref} aria-label="breadcrumb" {...rest}>
      <ol className={cn("flex list-none items-center gap-1 p-0 text-ink-muted", className)}>{children}</ol>
    </nav>
  );
});

export const BreadcrumbItem = forwardRef(function BreadcrumbItem(
  { active, className, children, ...rest },
  ref
) {
  return (
    <li
      ref={ref}
      className={cn(
        "after:mx-1 after:text-slate-300 after:content-['/'] last:after:content-['']",
        active && "text-ink",
        className
      )}
      {...rest}
    >
      {children}
    </li>
  );
});
