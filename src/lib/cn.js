import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names, with later Tailwind utilities winning over earlier ones.
 * `cn("p-2", "p-4")` -> "p-4", so a caller's className can always override a
 * component's defaults.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
