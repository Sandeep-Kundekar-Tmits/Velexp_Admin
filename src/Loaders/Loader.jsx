import { useId, useLayoutEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * Barcode scan loader.
 *
 * Deliberately unlike the route map on the auth/dashboard backdrop: that is a
 * continuous loop of vehicles crossing the screen, so reusing it here made the
 * whole app feel like one repeating animation. A scanner sweep is a single
 * directional pass with a clear start and end, and it is just as native to a
 * courier product -- every AWB in the system is a barcode.
 *
 * Replaced a Bootstrap <Spinner> in #556ee6 (the Skote indigo the theme
 * retired) on a white overlay, written entirely in inline styles.
 */

/* A fixed pattern, not random: the bars must be identical between server and
   client render, and identical between two loaders on screen at once. */
const BAR_WIDTHS = [
  3, 1, 2, 1, 4, 1, 2, 2, 1, 3, 1, 1, 2, 4, 1, 2,
  1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 4, 1, 2, 1, 3, 2,
];
const BAR_GAP = 2;
const BAR_TOP = 4;
const BAR_TALL = 40;
const BAR_SHORT = 31;

const BARS = (() => {
  let x = 0;
  return BAR_WIDTHS.map((width, index) => {
    // Every seventh bar runs short, the way guard bars do on a real symbol.
    const bar = { x, width, height: index % 7 === 0 ? BAR_SHORT : BAR_TALL };
    x += width + BAR_GAP;
    return bar;
  });
})();

const CODE_WIDTH = BARS[BARS.length - 1].x + BARS[BARS.length - 1].width;
const CODE_HEIGHT = BAR_TOP + BAR_TALL + BAR_TOP;
const WINDOW_WIDTH = 26;

/**
 * The scanning symbol on its own -- no overlay, no card, no message.
 *
 * This is what the 60-odd screens still on the light theme drop in place of
 * their old <GridLoader />, so it must read on white as well as on #050816.
 * Both bar layers therefore paint in `currentColor`: the default blue clears
 * contrast on either background, and any caller can retint it with a text
 * colour class rather than needing a new prop.
 */
export const LoaderMark = ({ className }) => {
  const reduceMotion = useReducedMotion();
  // Two marks on screen would otherwise share one clipPath id, and the second
  // would clip against the first one's animation.
  const clipId = `velexp-scan-${useId().replace(/:/g, "")}`;

  const sweep = { duration: 1.8, repeat: Infinity, ease: "easeInOut" };
  const travel = [-WINDOW_WIDTH, CODE_WIDTH];

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${CODE_WIDTH} ${CODE_HEIGHT}`}
      className={cn("h-10 w-44 text-[#3B82F6]", className)}
    >
      <defs>
        {/* The lit bars are drawn twice and clipped to a moving window, so the
            symbol genuinely illuminates under the scanner rather than having a
            translucent bar slide over the top of it. */}
        <clipPath id={clipId}>
          <motion.rect
            y="0"
            height={CODE_HEIGHT}
            width={WINDOW_WIDTH}
            initial={{ x: reduceMotion ? CODE_WIDTH / 2 - WINDOW_WIDTH / 2 : travel[0] }}
            animate={reduceMotion ? undefined : { x: travel }}
            transition={reduceMotion ? undefined : sweep}
          />
        </clipPath>
      </defs>

      {/* Unread state. */}
      {BARS.map((bar) => (
        <rect
          key={`dim-${bar.x}`}
          x={bar.x}
          y={BAR_TOP}
          width={bar.width}
          height={bar.height}
          rx="0.5"
          fill="currentColor"
          className="opacity-25"
        />
      ))}

      {/* Read state, revealed only inside the scan window. */}
      <g clipPath={`url(#${clipId})`}>
        {BARS.map((bar) => (
          <rect
            key={`lit-${bar.x}`}
            x={bar.x}
            y={BAR_TOP}
            width={bar.width}
            height={bar.height}
            rx="0.5"
            fill="currentColor"
          />
        ))}
      </g>

      {/* The beam itself. */}
      {!reduceMotion && (
        <motion.rect
          y="0"
          width="1.5"
          height={CODE_HEIGHT}
          fill="currentColor"
          className="opacity-70"
          initial={{ x: travel[0] + WINDOW_WIDTH }}
          animate={{ x: travel.map((value) => value + WINDOW_WIDTH) }}
          transition={sweep}
        />
      )}
    </svg>
  );
};

LoaderMark.propTypes = {
  className: PropTypes.string,
};

/* Never smaller than this, however little room is left below the chrome. */
const MIN_INLINE_HEIGHT = 220;
/* Breathing room at the foot, and cover for the pb-4 the page wrappers carry --
   without it the loader would end flush against the viewport bottom and the
   parent's own padding would push a scrollbar out. */
const BOTTOM_GAP = 16;

const Loader = ({ message = "Loading...", fullscreen = true, compact = false, className }) => {
  const hostRef = useRef(null);
  const [inlineHeight, setInlineHeight] = useState(null);
  /* Viewport rect of the content section, when there is one to centre in. */
  const [sectionRect, setSectionRect] = useState(null);

  /*
   * Anchor to the top of the content section, not centre in whatever is left
   * below the chrome.
   *
   * Filling from this element's own top down to the bottom of the viewport --
   * what this did before -- puts the loader half the chrome height too low,
   * and by a different amount on every screen: a report with a filter bar sat
   * lower than a plain list, which read as the loader jumping around as you
   * navigated.
   *
   * So it takes itself out of flow and covers .page-scroll (the layout's
   * content box) instead. Every screen then shows the loader in exactly the
   * same place -- pinned near the top of that box -- because that box is the
   * same box on all of them.
   *
   * The old measure-to-viewport-bottom path is kept as the fallback for
   * anything rendered outside the layout -- the login screen, a modal that has
   * not opted into `compact` -- where there is no content section to aim at.
   *
   * useLayoutEffect so the position lands before paint; otherwise the loader
   * shows in the flow position for a frame and then jumps.
   */
  useLayoutEffect(() => {
    if (fullscreen || compact || !hostRef.current) return undefined;

    const section = hostRef.current.closest(".page-scroll");

    const measure = () => {
      if (section) {
        const { top, left, width, height } = section.getBoundingClientRect();
        setSectionRect({ top, left, width, height });
        return;
      }
      const { top } = hostRef.current.getBoundingClientRect();
      setInlineHeight(Math.max(MIN_INLINE_HEIGHT, window.innerHeight - top - BOTTOM_GAP));
    };

    measure();
    window.addEventListener("resize", measure);
    /* The rail collapsing animates .main-content's margin for 0.45s, which
       moves the section under a loader that is already up. Re-measuring on
       transitionend is cheaper than watching every frame. */
    document.addEventListener("transitionend", measure);
    return () => {
      window.removeEventListener("resize", measure);
      document.removeEventListener("transitionend", measure);
    };
  }, [fullscreen, compact]);

  return (
    <div
      ref={hostRef}
      role="status"
      aria-live="polite"
      style={
        fullscreen
          ? undefined
          /* Fixed over the content section. Its own place in the flow is given
             up entirely, so nothing above it can shift it off position. */
          : sectionRect
            ? {
              position: "fixed",
              top: sectionRect.top,
              left: sectionRect.left,
              width: sectionRect.width,
              height: sectionRect.height,
            }
            : inlineHeight === null
              ? undefined
              : { height: inlineHeight }
      }
      className={cn(
        /* justify-start + pt-6, not justify-center: a loader dead-centred in
           a tall section reads as floating in empty space, especially once
           the section is mostly whitespace below a short table. Anchoring it
           a fixed distance from the top keeps it in the same spot regardless
           of how much room the section has, the way a page's actual content
           would sit. */
        "flex flex-col items-center justify-center pb-18",
        fullscreen
          /* An overlay has to cover what is behind it, or it reads as a loader
             dropped on top of a live screen rather than as the screen being
             busy. This is the only place the scrim belongs. */
          ? "fixed inset-0 z-9999 bg-canvas/95 backdrop-blur-sm"
          /* Inline it stays transparent: the layout already draws the canvas
             and the route backdrop behind it, and a second background here
             would just hide them.

             compact keeps the same loader but sizes it to its container rather
             than to the viewport -- inside a modal or a fixed panel, filling
             down to the bottom of the window would overflow the box it is in.

             The min-height is the floor for the first paint, before the
             measurement above replaces it, and the whole story under compact.
             Once the section rect is known the element is out of flow and
             sized from it, so neither w-full nor flex-1 has anything to do. */
          : sectionRect
            /* pointer-events-none because this covers the whole content
               section, filter bar included. A screen that keeps its filters
               mounted while it fetches means them to stay usable -- you should
               be able to correct a service centre or a status without waiting
               for the wrong query to come back. The fullscreen variant above
               deliberately does block: there it IS the screen. */
            ? "pointer-events-none z-20"
            /* pb-10, not py-10: the shared pt-6 above already sets the top
               padding, and Tailwind utilities of the same specificity resolve
               by generation order, not by position in this string -- stacking
               pt-6 with a py-10 here would leave which one wins undefined. */
            : cn("w-full", compact ? "min-h-55 pb-10" : "min-h-55 flex-1"),
        className
      )}
    >
      <div className="relative rounded-2xl border border-line bg-surface/70 px-6 py-5 backdrop-blur-xl">
        {/* No color override: LoaderMark's own default (#3B82F6) is the one
            chosen to read on both a white and a dark card -- see its own
            comment. The #7DD3FC this used to pass was picked only for the
            old permanently-dark card and went invisible on a light one. */}
        <LoaderMark className="h-12 w-56" />
      </div>

      {message && (
        <p className="mt-4 text-[14px] font-medium tracking-tight text-ink-muted">
          {message}
        </p>
      )}
    </div>
  );
};

Loader.propTypes = {
  message: PropTypes.string,
  fullscreen: PropTypes.bool,
  /* For modals and fixed-height panels: same loader, sized to its container
     instead of stretching to the bottom of the viewport. */
  compact: PropTypes.bool,
  className: PropTypes.string,
};

export default Loader;
