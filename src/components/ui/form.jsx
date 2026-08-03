/**
 * Form primitives, API-compatible with the reactstrap components they replace.
 *
 * Covers what the codebase uses: Button (color/size/outline/block/disabled),
 * Input (type/invalid/bsSize, including select and textarea), Label (for),
 * FormGroup, FormFeedback, FormText, Form.
 */
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

/* Brand indigo #414593 carries white text at 8.4:1. The accent cyan is
   deliberately absent here -- at 2.9:1 it must never sit under white text. */
const BUTTON_COLORS = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 focus-visible:outline-brand-500",
  secondary: "bg-slate-600 text-white hover:bg-slate-700",
  success: "bg-success-500 text-white hover:brightness-95",
  danger: "bg-danger-500 text-white hover:brightness-95",
  warning: "bg-warning-500 text-ink hover:brightness-95",
  info: "bg-accent-500 text-ink hover:brightness-95",
  light: "bg-slate-100 text-ink hover:bg-slate-200",
  dark: "bg-slate-800 text-white hover:bg-slate-900",
  link: "bg-transparent text-brand-500 underline hover:text-brand-600",
};

const BUTTON_OUTLINE = {
  primary: "border border-brand-500 text-brand-500 hover:bg-brand-50",
  secondary: "border border-slate-400 text-slate-700 hover:bg-slate-50",
  success: "border border-success-500 text-success-500 hover:bg-green-50",
  danger: "border border-danger-500 text-danger-500 hover:bg-orange-50",
  warning: "border border-warning-500 text-warning-500 hover:bg-amber-50",
  info: "border border-accent-500 text-accent-500 hover:bg-sky-50",
  light: "border border-slate-200 text-slate-700 hover:bg-slate-50",
  dark: "border border-slate-800 text-slate-800 hover:bg-slate-100",
};

const BUTTON_SIZES = {
  sm: "h-7 px-2 text-xs",
  md: "h-9 px-3 text-[13px]",
  lg: "h-11 px-5 text-sm",
};

export const Button = forwardRef(function Button(
  { color = "secondary", size = "md", outline, block, className, type = "button", children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded font-medium transition-colors",
        "disabled:opacity-60 disabled:pointer-events-none",
        BUTTON_SIZES[size] || BUTTON_SIZES.md,
        outline ? BUTTON_OUTLINE[color] || BUTTON_OUTLINE.secondary : BUTTON_COLORS[color] || BUTTON_COLORS.secondary,
        block && "w-full",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

const INPUT_BASE =
  "w-full rounded border bg-white text-ink placeholder:text-slate-400 " +
  "transition-colors disabled:bg-slate-50 disabled:text-slate-500 " +
  "focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500";

const INPUT_SIZES = { sm: "h-7 px-2 text-xs", md: "h-9 px-2.5", lg: "h-11 px-3 text-sm" };

export const Input = forwardRef(function Input(
  { type = "text", invalid, bsSize, className, children, ...rest },
  ref
) {
  const shared = cn(
    INPUT_BASE,
    INPUT_SIZES[bsSize] || INPUT_SIZES.md,
    invalid ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/30" : "border-line",
    className
  );

  if (type === "select") {
    return (
      <select ref={ref} className={shared} {...rest}>
        {children}
      </select>
    );
  }

  if (type === "textarea") {
    // Height is content-driven, so drop the fixed input height.
    return <textarea ref={ref} className={cn(shared, "h-auto py-2 min-h-[72px]")} {...rest} />;
  }

  if (type === "checkbox" || type === "radio") {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "size-4 accent-brand-500 rounded border-line",
          invalid && "outline outline-danger-500",
          className
        )}
        {...rest}
      />
    );
  }

  return <input ref={ref} type={type} className={shared} {...rest} />;
});

export const Label = forwardRef(function Label({ for: htmlFor, className, children, ...rest }, ref) {
  return (
    // reactstrap accepts `for`; JSX needs htmlFor, so both are honoured.
    <label ref={ref} htmlFor={htmlFor} className={cn("mb-1 block font-medium text-ink", className)} {...rest}>
      {children}
    </label>
  );
});

export const FormGroup = forwardRef(function FormGroup(
  { check, className, children, ...rest },
  ref
) {
  return (
    <div ref={ref} className={cn(check ? "flex items-center gap-2" : "mb-3", className)} {...rest}>
      {children}
    </div>
  );
});

export const FormFeedback = forwardRef(function FormFeedback({ className, children, ...rest }, ref) {
  return (
    <div ref={ref} className={cn("mt-1 text-xs text-danger-500", className)} {...rest}>
      {children}
    </div>
  );
});

export const FormText = forwardRef(function FormText({ className, children, ...rest }, ref) {
  return (
    <div ref={ref} className={cn("mt-1 text-xs text-ink-muted", className)} {...rest}>
      {children}
    </div>
  );
});

export const Form = forwardRef(function Form({ className, children, ...rest }, ref) {
  return (
    <form ref={ref} className={className} {...rest}>
      {children}
    </form>
  );
});
