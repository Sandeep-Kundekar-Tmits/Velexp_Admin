/**
 * Shared ApexCharts theme for the Daily Revenue dashboard.
 *
 * Every chart used to carry its own copy of the Skote palette (#556ee6,
 * #34c38f, #f1b44c ...) plus hardcoded axis label greys -- #74788d for ticks
 * and #495057 for categories. Those are dark greys chosen for a white card, so
 * on the dark panels the labels were all but invisible: legible in theory,
 * unreadable in practice at 11px against #111827.
 *
 * Apex also defaults `theme.mode` to light, which is what painted the tooltips
 * white and the legend text near-black -- neither of which any per-series
 * colour setting reaches.
 *
 * One module so the six charts cannot drift apart again, and so a palette
 * change lands everywhere at once.
 */

/* Series colours, in the order a chart consumes them. Blue and green first --
   Gross and Net appear as that pair on four of the six charts. */
export const CHART_PALETTE = [
  "#3B82F6", // blue    — gross
  "#22C55E", // green   — net
  "#F59D0E", // amber
  "#EF4444", // red
  "#38BDF8", // cyan
  "#8B5CF6", // violet
  "#14B8A6", // teal
  "#F472B6", // pink
];

/* Lighter ends for the bar/area gradients, so a fill reads as one colour
   graduating rather than two colours meeting. */
export const CHART_GRADIENT_TO = ["#60A5FA", "#4ADE80"];

export const CHART_INK = "#E2E8F0";
export const CHART_INK_MUTED = "#94A3B8";
/* Grid lines at 8% white: present enough to read a value against, faint enough
   not to compete with the series. The old #f1f1f5 was a near-white lattice. */
export const CHART_GRID = "rgba(255,255,255,0.08)";

/** Axis tick style, shared by x and y. */
export const axisLabelStyle = (size = "11px") => ({
  fontSize: size,
  colors: CHART_INK_MUTED,
});

/**
 * Options every chart merges in first, so anything it sets afterwards wins.
 *
 * `chart.foreColor` is the one that matters most: Apex derives the legend, the
 * axis titles and the no-data message from it, and none of those are reachable
 * through the per-axis `style.colors` the charts were already setting.
 */
/* Sub-objects a chart is likely to redefine. A plain `{...base, ...own}` would
   replace these wholesale -- a chart that sets `tooltip: { shared: true }`
   would silently drop the base's `theme: "dark"` and render a white tooltip on
   a dark panel, which is exactly what was happening. */
const MERGE_KEYS = ["chart", "grid", "legend", "tooltip", "dataLabels", "states", "xaxis", "yaxis"];

/**
 * Chart options with the shared theme underneath.
 *
 * One level of merge is enough: the keys above are flat option bags, and going
 * deeper would start overriding things a chart set deliberately (a formatter,
 * an axis category list).
 */
export const withChartTheme = (options = {}) => {
  const base = chartBase();
  const out = { ...base, ...options };
  for (const key of MERGE_KEYS) {
    if (options[key] && base[key]) out[key] = { ...base[key], ...options[key] };
  }
  return out;
};

export const chartBase = () => ({
  chart: {
    foreColor: CHART_INK_MUTED,
    fontFamily: "inherit",
    toolbar: { show: false },
    background: "transparent",
  },
  theme: { mode: "dark" },
  colors: CHART_PALETTE,
  grid: {
    borderColor: CHART_GRID,
    strokeDashArray: 4,
    padding: { left: 4, right: 4 },
  },
  /* Top-right on every chart. They were each choosing their own position, so
     the six panels put their keys in four different places. */
  legend: {
    position: "top",
    horizontalAlign: "right",
    fontSize: "12px",
    labels: { colors: CHART_INK },
    markers: { radius: 4 },
    itemMargin: { horizontal: 8, vertical: 4 },
  },
  tooltip: {
    theme: "dark",
    style: { fontSize: "12px" },
  },
  dataLabels: { style: { fontSize: "11px" } },
  states: {
    hover: { filter: { type: "lighten", value: 0.08 } },
    active: { filter: { type: "none" } },
  },
});

/**
 * Category-axis label width, in px.
 *
 * ApexCharts already truncates with an ellipsis once `trim` is on, but only at
 * `maxWidth` -- and a flat 220px is most of a 360px phone, so customer and
 * region names ran the full width of the screen before they were cut. Half
 * that on a narrow viewport leaves the bars something to occupy.
 *
 * Read at render rather than stored in state: these are ApexCharts options,
 * rebuilt on every render anyway, so a resize repaints them with no listener.
 */
export const categoryLabelWidth = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 639.98px)").matches ? 110 : 220;
