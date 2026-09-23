/**
 * Responsive breakpoint tokens matching Tailwind defaults.
 * Use Tailwind classes (sm:, md:, lg:, xl:) in markup;
 * these constants are available for JS-based media queries when needed.
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

/** Helper to build a min-width media query string */
export function minWidth(bp: keyof typeof breakpoints): string {
  return `(min-width: ${breakpoints[bp]}px)`;
}
