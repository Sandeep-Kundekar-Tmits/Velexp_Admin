/**
 * Nav / tabs / list groups / pagination / collapse — API-compatible with the
 * reactstrap components they replace.
 */
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

/* ---------------- Nav & tabs ---------------- */

export const Nav = forwardRef(function Nav(
  { tabs, pills, vertical, fill, justified, className, children, ...rest },
  ref
) {
  return (
    <ul
      ref={ref}
      className={cn(
        "flex list-none gap-1 p-0",
        vertical ? "flex-col" : "flex-row",
        tabs && "border-b border-line",
        (fill || justified) && "[&>li]:flex-1",
        className
      )}
      data-variant={pills ? "pills" : tabs ? "tabs" : undefined}
      {...rest}
    >
      {children}
    </ul>
  );
});

export const NavItem = forwardRef(function NavItem({ className, children, ...rest }, ref) {
  return (
    <li ref={ref} className={cn("mb-[-1px]", className)} {...rest}>
      {children}
    </li>
  );
});

export const NavLink = forwardRef(function NavLink(
  { active, disabled, className, children, ...rest },
  ref
) {
  return (
    <a
      ref={ref}
      role="tab"
      aria-selected={!!active}
      className={cn(
        "block cursor-pointer rounded-t px-3 py-2 font-medium transition-colors",
        active
          ? "border-b-2 border-brand-500 text-brand-500"
          : "border-b-2 border-transparent text-ink-muted hover:text-ink",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      {...rest}
    >
      {children}
    </a>
  );
});

export const TabContent = forwardRef(function TabContent(
  { activeTab, className, children, ...rest },
  ref
) {
  return (
    <div ref={ref} className={cn("pt-3", className)} {...rest}>
      {/* Only the pane whose tabId matches is rendered, matching reactstrap. */}
      {Array.isArray(children)
        ? children.filter((child) => child && child.props?.tabId === activeTab)
        : children}
    </div>
  );
});

export const TabPane = forwardRef(function TabPane({ tabId, className, children, ...rest }, ref) {
  void tabId;
  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  );
});

/* ---------------- List group ---------------- */

export const ListGroup = forwardRef(function ListGroup({ flush, className, children, ...rest }, ref) {
  return (
    <ul
      ref={ref}
      className={cn("list-none p-0", !flush && "rounded border border-line overflow-hidden", className)}
      {...rest}
    >
      {children}
    </ul>
  );
});

export const ListGroupItem = forwardRef(function ListGroupItem(
  { active, action, className, children, ...rest },
  ref
) {
  return (
    <li
      ref={ref}
      className={cn(
        "border-b border-line px-3 py-2 last:border-b-0",
        active && "bg-brand-50 text-brand-700",
        action && "cursor-pointer hover:bg-slate-50",
        className
      )}
      {...rest}
    >
      {children}
    </li>
  );
});

/* ---------------- Pagination ---------------- */

export const Pagination = forwardRef(function Pagination({ className, children, ...rest }, ref) {
  return (
    <ul ref={ref} className={cn("flex list-none items-center gap-1 p-0", className)} {...rest}>
      {children}
    </ul>
  );
});

export const PaginationItem = forwardRef(function PaginationItem(
  { active, disabled, className, children, ...rest },
  ref
) {
  return (
    <li
      ref={ref}
      // The literal "active" class is what styles the child link (see the
      // `.pagination li.active > a` rule). Without it the current page looked
      // identical to every other page number.
      className={cn(
        active && "active font-semibold",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      {...rest}
    >
      {children}
    </li>
  );
});

export const PaginationLink = forwardRef(function PaginationLink(
  { first, last, previous, next, className, children, ...rest },
  ref
) {
  const label = first ? "«" : previous ? "‹" : next ? "›" : last ? "»" : children;
  return (
    <a
      ref={ref}
      className={cn(
        "inline-flex h-7 min-w-7 cursor-pointer items-center justify-center rounded border border-line px-2",
        "hover:bg-slate-50 aria-[current=true]:bg-brand-500 aria-[current=true]:text-white",
        className
      )}
      {...rest}
    >
      {label}
    </a>
  );
});

/* ---------------- Collapse ---------------- */

export const Collapse = forwardRef(function Collapse({ isOpen, className, children, ...rest }, ref) {
  return (
    <div
      ref={ref}
      className={cn("overflow-hidden transition-all", isOpen ? "block" : "hidden", className)}
      {...rest}
    >
      {children}
    </div>
  );
});
