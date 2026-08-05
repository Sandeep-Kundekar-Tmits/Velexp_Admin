/**
 * Grid and container primitives, Tailwind-backed but API-compatible with the
 * reactstrap equivalents they replace, so migrating a screen is an import
 * change rather than a rewrite.
 *
 * Supports what the codebase actually uses: <Row className>, <Col md={6}
 * lg={4} xs sm xl>, and <Container fluid>. Bootstrap's 12-column semantics
 * are preserved.
 */
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

/* Tailwind must see whole class names, so the grid spans are enumerated
   rather than built by interpolation. */
const SPAN = {
  1: "w-1/12", 2: "w-2/12", 3: "w-3/12", 4: "w-4/12", 5: "w-5/12", 6: "w-6/12",
  7: "w-7/12", 8: "w-8/12", 9: "w-9/12", 10: "w-10/12", 11: "w-11/12", 12: "w-full",
};
const SPAN_SM = {
  1: "sm:w-1/12", 2: "sm:w-2/12", 3: "sm:w-3/12", 4: "sm:w-4/12", 5: "sm:w-5/12", 6: "sm:w-6/12",
  7: "sm:w-7/12", 8: "sm:w-8/12", 9: "sm:w-9/12", 10: "sm:w-10/12", 11: "sm:w-11/12", 12: "sm:w-full",
};
const SPAN_MD = {
  1: "md:w-1/12", 2: "md:w-2/12", 3: "md:w-3/12", 4: "md:w-4/12", 5: "md:w-5/12", 6: "md:w-6/12",
  7: "md:w-7/12", 8: "md:w-8/12", 9: "md:w-9/12", 10: "md:w-10/12", 11: "md:w-11/12", 12: "md:w-full",
};
const SPAN_LG = {
  1: "lg:w-1/12", 2: "lg:w-2/12", 3: "lg:w-3/12", 4: "lg:w-4/12", 5: "lg:w-5/12", 6: "lg:w-6/12",
  7: "lg:w-7/12", 8: "lg:w-8/12", 9: "lg:w-9/12", 10: "lg:w-10/12", 11: "lg:w-11/12", 12: "lg:w-full",
};
const SPAN_XL = {
  1: "xl:w-1/12", 2: "xl:w-2/12", 3: "xl:w-3/12", 4: "xl:w-4/12", 5: "xl:w-5/12", 6: "xl:w-6/12",
  7: "xl:w-7/12", 8: "xl:w-8/12", 9: "xl:w-9/12", 10: "xl:w-10/12", 11: "xl:w-11/12", 12: "xl:w-full",
};

const num = (v) => (typeof v === "object" && v !== null ? v.size : v);

export const Row = forwardRef(function Row({ className, children, ...rest }, ref) {
  // -mx-2 + px-2 on Col reproduces Bootstrap's gutter behaviour.
  return (
    <div ref={ref} className={cn("flex flex-wrap -mx-2", className)} {...rest}>
      {children}
    </div>
  );
});

export const Col = forwardRef(function Col(
  { xs, sm, md, lg, xl, className, children, ...rest },
  ref
) {
  const spans = [
    SPAN[num(xs)],
    SPAN_SM[num(sm)],
    SPAN_MD[num(md)],
    SPAN_LG[num(lg)],
    SPAN_XL[num(xl)],
  ].filter(Boolean);

  /*
   * Bootstrap's `col-md-4` is width:100% BELOW md and 4/12 from md up. This
   * emitted only the `md:w-4/12` half, so under that breakpoint the column had
   * no width at all and fell back to shrink-to-content -- which is why a form
   * written as <Col md={4}> x3 squeezed three fields onto one line on a phone
   * instead of stacking them. Nearly every screen writes columns that way.
   *
   * Only when the caller has not named a base size themselves: <Col xs={6}>
   * means half width on a phone and must stay that way.
   */
  const needsBase = spans.length > 0 && num(xs) == null;

  return (
    <div
      ref={ref}
      // No breakpoint props means "fill the row", matching <Col/>.
      // min-w-0: Row is a flex container, and a flex item's default
      // min-width:auto refuses to shrink below its content's own width -- a
      // wide table inside this Col would otherwise push it (and the row)
      // past its assigned share instead of scrolling inside itself.
      className={cn("px-2 min-w-0", spans.length ? [needsBase && "w-full", ...spans] : "flex-1", className)}
      {...rest}
    >
      {children}
    </div>
  );
});

export const Container = forwardRef(function Container(
  { fluid, className, children, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn("w-full px-3 mx-auto", !fluid && "max-w-screen-xl", className)}
      {...rest}
    >
      {children}
    </div>
  );
});
