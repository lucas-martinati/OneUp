import { forwardRef, useMemo } from 'react';

/**
 * Tiny tinted pill for inline metric display (weight, difficulty, etc.).
 *
 * Provides the unified visual foundation for DifficultyBadge and
 * WeightBadge, which remain thin wrappers handling formatting logic.
 *
 * @param {string} color — tint color for background, border, and text
 * @param {'sm'|'md'} [size='md'] — sm uses viewport-relative sizing
 */
const SIZE_MAP = {
  sm: { fontSize: 'clamp(0.52rem, 1.2vh, 0.7rem)', padding: '1px 6px', radius: 'var(--radius-full)' },
  md: { fontSize: '0.65rem', padding: '2px 6px', radius: 'var(--radius-sm)' },
};

export const MetricBadge = forwardRef(function MetricBadge(
  { color, size = 'md', className = '', style, children, ...rest },
  ref,
) {
  const s = SIZE_MAP[size];

  const composed = useMemo(
    () => ({
      fontSize: s.fontSize,
      fontWeight: 700,
      padding: s.padding,
      borderRadius: s.radius,
      background: `${color}1f`,
      border: `1px solid ${color}30`,
      color,
      display: 'inline-flex',
      alignItems: 'center',
      verticalAlign: 'middle',
      whiteSpace: 'nowrap',
      ...style,
    }),
    [s, color, style],
  );

  return (
    <span ref={ref} className={className || undefined} style={composed} {...rest}>
      {children}
    </span>
  );
});
