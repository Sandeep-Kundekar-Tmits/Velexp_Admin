import { useId } from "react";
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

const Loader = ({ message = "Loading...", fullscreen = true, className }) => (
  <div
    role="status"
    aria-live="polite"
    className={cn(
      "z-9999 flex flex-col items-center justify-center bg-[#050816]/95 px-6 backdrop-blur-sm",
      /* min-h-full alone collapses to content height whenever the parent's
         height is auto -- a percentage min-height needs a definite parent --
         which left the loader stacked at the top of the page rather than
         centred. The vh floor guarantees something to centre within. */
      fullscreen ? "fixed inset-0" : "h-full min-h-[60vh] w-full py-10",
      className
    )}
  >
    <div className="relative rounded-2xl border border-white/8 bg-[rgba(17,24,39,0.70)] px-6 py-5 backdrop-blur-xl">
      <LoaderMark className="h-12 w-56 text-[#7DD3FC]" />
    </div>

    {message && (
      <p className="mt-4 text-[14px] font-medium tracking-tight text-slate-300">
        {message}
      </p>
    )}
  </div>
);

Loader.propTypes = {
  message: PropTypes.string,
  fullscreen: PropTypes.bool,
  className: PropTypes.string,
};

export default Loader;
