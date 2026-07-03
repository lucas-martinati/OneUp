/**
 * JS twin of the fixed palette in tokens.css (--color-* custom properties).
 *
 * Use these constants where `var()` cannot resolve: SVG presentation
 * attributes (fill/stroke/stopColor), canvas drawing, and alpha-suffix
 * concatenation (`PALETTE.gold + '33'`). Everywhere else, prefer the CSS
 * token (`var(--color-gold)`) so stylesheets stay the single source of truth.
 *
 * These are deliberately theme-INDEPENDENT (badge rarities, podium medals,
 * chart series…). Theme-aware colors (accent, error, success, warning) must
 * come from the theme tokens instead.
 */
export const PALETTE = {
  gold: '#ffd700',
  silver: '#e2e8f0',
  bronze: '#cd9b6a',
  amber: '#fbbf24',
  orange: '#f97316',
  pink: '#ec4899',
  blue: '#3b82f6',
  indigo: '#6366f1',
  indigoLight: '#818cf8',
  cyan: '#06b6d4',
  violet: '#a78bfa',
  emerald: '#34d399',
};
