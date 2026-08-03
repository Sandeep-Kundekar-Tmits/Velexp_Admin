/**
 * Cards, badges, alerts, tables, spinners — API-compatible with the reactstrap
 * components they replace.
 */
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

/* ---------------- Card ---------------- */

export const Card = forwardRef(function Card({ className, children, ...rest }, ref) {
  return (
    <div ref={ref} className={cn("rounded border border-line bg-surface", className)} {...rest}>
      {children}
    </div>
  );
});

export const CardBody = forwardRef(function CardBody({ className, children, ...rest }, ref) {
  return (
    <div ref={ref} className={cn("p-3", className)} {...rest}>
      {children}
    </div>
  );
});

export const CardHeader = forwardRef(function CardHeader({ className, children, ...rest }, ref) {
  return (
    <div ref={ref} className={cn("border-b border-line px-3 py-2 font-medium", className)} {...rest}>
      {children}
    </div>
  );
});

export const CardFooter = forwardRef(function CardFooter({ className, children, ...rest }, ref) {
  return (
    <div ref={ref} className={cn("border-t border-line px-3 py-2", className)} {...rest}>
      {children}
    </div>
  );
});

export const CardTitle = forwardRef(function CardTitle(
  { tag: Tag = "h5", className, children, ...rest },
  ref
) {
  return (
    <Tag ref={ref} className={cn("mb-1 font-semibold text-ink", className)} {...rest}>
      {children}
    </Tag>
  );
});

export const CardText = forwardRef(function CardText({ className, children, ...rest }, ref) {
  return (
    <p ref={ref} className={cn("text-ink-muted", className)} {...rest}>
      {children}
    </p>
  );
});

/* ---------------- Badge ---------------- */

const BADGE_COLORS = {
  primary: "bg-brand-500 text-white",
  secondary: "bg-slate-500 text-white",
  success: "bg-success-500 text-white",
  danger: "bg-danger-500 text-white",
  warning: "bg-warning-500 text-ink",
  info: "bg-accent-500 text-ink",
  light: "bg-slate-100 text-ink",
  dark: "bg-slate-800 text-white",
};

export const Badge = forwardRef(function Badge(
  { color = "secondary", pill, className, children, ...rest },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium leading-tight",
        pill ? "rounded-full px-2" : "rounded",
        BADGE_COLORS[color] || BADGE_COLORS.secondary,
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
});

/* ---------------- Alert ---------------- */

const ALERT_COLORS = {
  primary: "bg-brand-50 text-brand-700 border-brand-100",
  secondary: "bg-slate-50 text-slate-700 border-slate-200",
  success: "bg-green-50 text-green-800 border-green-200",
  danger: "bg-orange-50 text-orange-900 border-orange-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  info: "bg-sky-50 text-sky-900 border-sky-200",
};

export const Alert = forwardRef(function Alert(
  { color = "primary", isOpen = true, toggle, className, children, ...rest },
  ref
) {
  if (!isOpen) return null;
  return (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "mb-3 flex items-start justify-between gap-3 rounded border px-3 py-2",
        ALERT_COLORS[color] || ALERT_COLORS.primary,
        className
      )}
      {...rest}
    >
      <div>{children}</div>
      {toggle && (
        <button type="button" onClick={toggle} aria-label="Close" className="opacity-60 hover:opacity-100">
          &times;
        </button>
      )}
    </div>
  );
});

/* ---------------- Table ---------------- */

export const Table = forwardRef(function Table(
  { bordered, striped, hover, responsive, size, className, children, ...rest },
  ref
) {
  const table = (
    <table
      ref={ref}
      className={cn(
        "w-full border-collapse text-left align-middle",
        // 34px rows, matching the Dense Ops density target
        "[&_td]:h-[34px] [&_th]:h-[34px] [&_td]:px-2 [&_th]:px-2",
        "[&_th]:bg-slate-50 [&_th]:font-semibold [&_th]:text-ink",
        size === "sm" && "[&_td]:h-7 [&_th]:h-7 text-xs",
        bordered && "[&_td]:border [&_th]:border [&_td]:border-line [&_th]:border-line",
        !bordered && "[&_tbody_tr]:border-b [&_tbody_tr]:border-line",
        striped && "[&_tbody_tr:nth-child(odd)]:bg-slate-50/60",
        hover && "[&_tbody_tr:hover]:bg-brand-50/50",
        className
      )}
      {...rest}
    >
      {children}
    </table>
  );

  return responsive ? <div className="w-full overflow-x-auto">{table}</div> : table;
});

/* ---------------- Spinner ---------------- */

const SPINNER_SIZES = { sm: "size-4 border-2", md: "size-6 border-2", lg: "size-8 border-[3px]" };

export const Spinner = forwardRef(function Spinner(
  { size = "md", color = "primary", className, ...rest },
  ref
) {
  return (
    <span
      ref={ref}
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-current border-r-transparent align-[-0.125em]",
        SPINNER_SIZES[size] || SPINNER_SIZES.md,
        color === "primary" ? "text-brand-500" : "text-current",
        className
      )}
      {...rest}
    />
  );
});
