import { forwardRef, useMemo } from 'react';
import { Check, Lock } from '@utils/icons';

/**
 * Unified filter-chip primitive for toggleable pill buttons.
 *
 * Replaces the three parallel chip implementations:
 * - CategoryChips.jsx `.chip` (8px 14px, 0.72rem)
 * - StatsFilters.jsx `.toggle` (10px 16px, 0.85rem)
 * - LeaderboardTabs.jsx inline chips (7px 12px, 0.75rem)
 *
 * @param {'sm'|'md'} [size='md']
 * @param {string} [color] — tint color when selected (defaults to accent)
 * @param {boolean} [selected=false]
 * @param {number} [count] — optional counter badge
 * @param {boolean} [locked=false]
 * @param {React.ComponentType} [icon] — icon shown when selected (default: Check)
 */
const SIZE_MAP = {
  sm: { padding: '7px 12px', fontSize: '0.75rem', minHeight: '32px', iconSize: 10 },
  md: { padding: '9px 16px', fontSize: '0.82rem', minHeight: '38px', iconSize: 12 },
};

export const FilterChip = forwardRef(function FilterChip(
  {
    size = 'md',
    color,
    selected = false,
    count,
    locked = false,
    icon: SelectedIcon = Check,
    className = '',
    style,
    children,
    ...rest
  },
  ref,
) {
  const s = SIZE_MAP[size];
  const tint = color || 'var(--accent)';

  const composed = useMemo(
    () => ({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      padding: s.padding,
      minHeight: s.minHeight,
      fontSize: s.fontSize,
      fontWeight: 700,
      fontFamily: 'inherit',
      borderRadius: 'var(--radius-full)',
      border: '1px solid transparent',
      background: 'var(--surface-muted)',
      color: 'var(--text-secondary)',
      cursor: locked ? 'default' : 'pointer',
      opacity: locked ? 0.5 : 1,
      transition: `all var(--motion-fast) ease`,
      whiteSpace: 'nowrap',
      WebkitTapHighlightColor: 'transparent',
      ...(selected && !locked
        ? {
            background: `color-mix(in srgb, ${tint} 14%, transparent)`,
            color: tint,
            borderColor: `color-mix(in srgb, ${tint} 25%, transparent)`,
          }
        : {}),
      ...style,
    }),
    [s, tint, selected, locked, style],
  );

  return (
    <button ref={ref} type="button" className={className || undefined} style={composed} {...rest}>
      {locked && <Lock size={s.iconSize} />}
      {!locked && selected && <SelectedIcon size={s.iconSize} />}
      {children}
      {count != null && (
        <span
          style={{
            height: '20px',
            minWidth: '20px',
            padding: '0 6px',
            borderRadius: 'var(--radius-full)',
            fontSize: 'var(--text-xs)',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: selected
              ? `color-mix(in srgb, ${tint} 20%, transparent)`
              : 'var(--surface-dim)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
});
