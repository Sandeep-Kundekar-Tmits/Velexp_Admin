/**
 * Velexp ambient backdrop: dark field, delivery-route map and cursor spotlight.
 *
 * Extracted from the login page so the same treatment can back other screens.
 * Everything is self-contained -- drop it in as the first child of a
 * `relative` container and it fills that container.
 *
 * It is purely decorative: `aria-hidden` and `pointer-events-none` throughout,
 * so it never intercepts clicks or reaches assistive tech.
 *
 * Every colour here is `rgb(var(--ambient-*))`, not a literal hex -- see
 * app.css's --ambient-accent/--ambient-gradient-1/--ambient-gradient-2 (next
 * to --overlay-rgb). The defaults there reproduce this component's
 * original hardcoded cyan/blue/violet exactly, so the default dark theme
 * and light theme are unaffected; a theme with its own accent character
 * (Olive Grove's orange, say) overrides just those three tokens instead
 * of fighting this component's own colours.
 */
import PropTypes from "prop-types";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
} from "framer-motion";
import { useEffect } from "react";
import { Bike, Plane, Ship, Truck } from "lucide-react";
import { cn } from "@/lib/cn";

/* Delivery routes, drawn in a 1440x900 space and scaled with `slice` so they
   crop rather than distort. Every leg is a horizontal/vertical run joined to a
   45-degree diagonal by a fixed 40-unit quarter-turn -- the metro-map rule.
   A and B mirror about y=450, C and D about x=720, so the network reads as
   planned infrastructure rather than as freehand curves.

   `staticAt` is where each vehicle parks when the OS asks for reduced motion:
   the theme still reads, nothing moves. */
const ROUTES = [
  {
    id: "velexp-route-a",
    d: "M-60 200 H 300 Q 340 200 368 228 L 452 312 Q 480 340 520 340 H 920 Q 960 340 988 312 L 1072 228 Q 1100 200 1140 200 H 1500",
    Icon: Truck,
    duration: 24,
    delay: 0,
    staticAt: "300 200",
  },
  {
    id: "velexp-route-b",
    d: "M-60 700 H 300 Q 340 700 368 672 L 452 588 Q 480 560 520 560 H 920 Q 960 560 988 588 L 1072 672 Q 1100 700 1140 700 H 1500",
    Icon: Plane,
    duration: 28,
    delay: 6,
    staticAt: "300 700",
  },
  {
    id: "velexp-route-c",
    d: "M240 -60 V 260 Q 240 300 268 328 L 352 412 Q 380 440 380 480 V 960",
    Icon: Bike,
    duration: 26,
    delay: 12,
    staticAt: "380 600",
  },
  {
    id: "velexp-route-d",
    d: "M1200 -60 V 260 Q 1200 300 1172 328 L 1088 412 Q 1060 440 1060 480 V 960",
    Icon: Ship,
    duration: 30,
    delay: 18,
    staticAt: "1060 600",
  },
];

/* Hubs sit exactly on the junction corners, in mirrored pairs. */
const WAYPOINTS = [
  { cx: 300, cy: 200, delay: 0 },
  { cx: 1140, cy: 200, delay: 1.6 },
  { cx: 300, cy: 700, delay: 0.8 },
  { cx: 1140, cy: 700, delay: 2.4 },
  { cx: 240, cy: 260, delay: 0.4 },
  { cx: 1200, cy: 260, delay: 2.0 },
  { cx: 380, cy: 480, delay: 1.2 },
  { cx: 1060, cy: 480, delay: 2.8 },
];

/* Inline SVG rather than an image file: it stays sharp at any resolution,
   costs no network request, and the routes have to be real <path> geometry
   anyway for the vehicles to travel along them. */
const RouteMap = ({ reduceMotion }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    className="absolute inset-0 h-full w-full"
  >
    <defs>
      {ROUTES.map((route) => (
        <path key={route.id} id={route.id} d={route.d} fill="none" />
      ))}
    </defs>

    {/* Laid twice: a dim continuous line for the road, a brighter dashed line
        on top whose offset scrolls to suggest traffic along it. */}
    {ROUTES.map((route) => (
      <g key={`line-${route.id}`}>
        <path d={route.d} fill="none" stroke="rgb(var(--ambient-accent))" strokeWidth="1.25" className="opacity-[0.08]" />
        <motion.path
          d={route.d}
          fill="none"
          stroke="rgb(var(--ambient-accent))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="8 18"
          className="opacity-[0.22]"
          animate={reduceMotion ? undefined : { strokeDashoffset: [0, -260] }}
          transition={reduceMotion ? undefined : { duration: 14, repeat: Infinity, ease: "linear" }}
        />
      </g>
    ))}

    {WAYPOINTS.map((point) => (
      <g key={`hub-${point.cx}-${point.cy}`}>
        <circle cx={point.cx} cy={point.cy} r="3" fill="rgb(var(--ambient-accent))" className="opacity-40" />
        {/* Animating the `r` attribute rather than scale: a scaled circle would
            need a per-waypoint transform-origin, and Tailwind cannot generate
            class names from runtime values. This needs no origin at all. */}
        <motion.circle
          cx={point.cx}
          cy={point.cy}
          fill="none"
          stroke="rgb(var(--ambient-accent))"
          strokeWidth="1"
          initial={{ r: 3, opacity: 0.5 }}
          animate={reduceMotion ? undefined : { r: [3, 14], opacity: [0.5, 0] }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 3.2, repeat: Infinity, ease: "easeOut", delay: point.delay }
          }
        />
      </g>
    ))}

    {ROUTES.map(({ id, Icon, duration, delay, staticAt }) => (
      <g key={`vehicle-${id}`} className="text-[rgb(var(--ambient-accent))]">
        {/* animateMotion, not Framer Motion: following arbitrary <path>
            geometry needs CSS motion-path, which Safari still does not apply
            reliably to SVG children. SMIL does it natively and everywhere. */}
        {reduceMotion ? null : (
          <animateMotion dur={`${duration}s`} begin={`${delay}s`} repeatCount="indefinite" rotate="auto">
            <mpath href={`#${id}`} />
          </animateMotion>
        )}
        <g transform={reduceMotion ? `translate(${staticAt})` : undefined}>
          <circle r="22" fill="rgb(var(--ambient-accent))" className="opacity-[0.10]" />
          <circle r="22" fill="none" stroke="rgb(var(--ambient-accent))" strokeWidth="1" className="opacity-25" />
          <Icon x={-14} y={-14} width={28} height={28} strokeWidth={1.7} className="opacity-90" />
        </g>
      </g>
    ))}
  </svg>
);

RouteMap.propTypes = {
  reduceMotion: PropTypes.bool,
};

const AmbientBackground = ({ className, showSpotlight = true, clearCentre = true }) => {
  const reduceMotion = useReducedMotion();

  /* Cursor spotlight. Motion values rather than useState on purpose:
     pointermove fires ~120x/sec and any setState here would re-render every
     consumer of this component on every frame. Motion values write straight to
     the DOM node and never touch React's render cycle. Seeded at viewport
     centre so the glow does not fly in from a corner on the first move. */
  const pointerX = useMotionValue(typeof window === "undefined" ? 0 : window.innerWidth / 2);
  const pointerY = useMotionValue(typeof window === "undefined" ? 0 : window.innerHeight / 2);
  const glowX = useSpring(pointerX, { stiffness: 110, damping: 22, mass: 0.45 });
  const glowY = useSpring(pointerY, { stiffness: 110, damping: 22, mass: 0.45 });
  const spotlightX = useMotionTemplate`${glowX}px`;
  const spotlightY = useMotionTemplate`${glowY}px`;

  useEffect(() => {
    // A finger is not a cursor: skip touch entirely, and honour the OS
    // reduced-motion setting by leaving the glow parked at centre.
    if (reduceMotion || !showSpotlight) return undefined;

    const onPointerMove = (event) => {
      if (event.pointerType === "touch") return;
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [pointerX, pointerY, reduceMotion, showSpotlight]);

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgb(var(--ambient-gradient-1)/0.20),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_85%_110%,rgb(var(--ambient-gradient-2)/0.18),transparent_60%)]" />
      {/* Faint grid is the "map paper" the routes are drawn on -- see
          .ambient-grid-lines in app.css for why this isn't a Tailwind
          arbitrary value (it needs to reference --overlay-rgb). */}
      <div className="absolute inset-0 ambient-grid-lines bg-size-[72px_72px] mask-[radial-gradient(ellipse_70%_60%_at_50%_45%,black,transparent_70%)]" />
      {/* clearCentre punches a hole so routes never run behind centred content
          such as the login card. Screens that fill the viewport turn it off. */}
      <div
        className={cn(
          "absolute inset-0",
          clearCentre &&
            "mask-[radial-gradient(ellipse_75%_70%_at_50%_50%,transparent_18%,black_55%)]"
        )}
      >
        <RouteMap reduceMotion={reduceMotion} />
      </div>
      {showSpotlight && (
        /* `style` carries only the two coordinates as CSS custom properties --
           the gradient itself stays a Tailwind class, since a per-frame value
           cannot be expressed as a static utility. */
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(240px_circle_at_var(--spot-x)_var(--spot-y),rgb(var(--ambient-accent)/0.14),transparent_65%)]"
          style={{ "--spot-x": spotlightX, "--spot-y": spotlightY }}
        />
      )}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--ambient-accent)/0.3)] to-transparent" />
    </div>
  );
};

AmbientBackground.propTypes = {
  className: PropTypes.string,
  showSpotlight: PropTypes.bool,
  clearCentre: PropTypes.bool,
};

export default AmbientBackground;
