import { forwardRef, useMemo } from 'react';
import { Check, Lock } from '@utils/icons';

/**
 * Unified filter-chip primitive for toggleable pill buttons.
 *
 * Replaces the parallel chip implementations:
 * - CategoryChips.jsx (variant="dot")
 * - StatsFilters.jsx (variant="dot")
 * - LeaderboardTabs.jsx (variant="icon")
 *
 * @param {'sm'|'md'} [size='md']
 * @param {string} [color] — tint color when selected (defaults to accent)
 * @param {boolean} [selected=false]
 * @param {number} [count] — optional counter badge
 * @param {boolean} [locked=false]
 * @param {React.ComponentType} [icon] — icon shown when selected (or default for icon variant)
 * @param {'dot'|'icon'} [variant='dot'] - rendering style 
 * @param {boolean} [special=false] - glowing special state (Leaderboard)
 * @param {boolean} [dashed=false] - dashed border state
 */
const SIZE_MAP = {
  sm: { padding: '7px 12px', fontSize: '0.75rem', minHeight: '32px', iconSize: 14, dotSize: 14 },
  md: { padding: '9px 16px', fontSize: '0.82rem', minHeight: '38px', iconSize: 16, dotSize: 16 },
};

export const FilterChip = forwardRef(function FilterChip(
  {
    size = 'md',
    color,
    selected = false,
    count,
    locked = false,
    icon: IconComponent,
    variant = 'dot',
    special = false,
    dashed = false,
    className = '',
    style,
    children,
    ...rest
  },
  ref,
) {
  const s = SIZE_MAP[size];
  const tint = color || 'var(--accent)';
  
  const baseBorderWidth = variant === 'icon' ? '1.5px' : '1px';

  const composed = useMemo(
    () => ({
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: variant === 'dot' ? '6px' : '5px',
      padding: special ? '7px 15px' : s.padding,
      minHeight: s.minHeight,
      fontSize: s.fontSize,
      fontWeight: special ? 800 : (variant === 'icon' ? 600 : 700),
      textTransform: special ? 'uppercase' : 'none',
      letterSpacing: special ? '0.06em' : 'normal',
      fontFamily: 'inherit',
      borderRadius: 'var(--radius-full)',
      
      // Default state
      border: `${baseBorderWidth} ${dashed ? 'dashed' : 'solid'} var(--border-default)`,
      background: 'var(--surface-muted)',
      color: 'var(--text-secondary)',
      
      cursor: locked ? 'default' : 'pointer',
      opacity: locked ? 0.5 : 1,
      transition: `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`,
      whiteSpace: 'nowrap',
      WebkitTapHighlightColor: 'transparent',
      
      // Active State Overrides
      ...(selected && !locked
        ? {
            background: variant === 'icon'
              ? `linear-gradient(135deg, ${tint}2e, ${tint}14)`
              : `color-mix(in srgb, ${tint} 15%, transparent)`,
            color: tint,
            borderColor: variant === 'icon' 
              ? `${tint}66`
              : `color-mix(in srgb, ${tint} 40%, transparent)`,
            boxShadow: special 
              ? `0 0 14px ${tint}33`
              : (variant === 'dot' ? `0 0 12px color-mix(in srgb, ${tint} 20%, transparent)` : 'none'),
          }
        : {}),
      ...style,
    }),
    [s, tint, selected, locked, variant, special, dashed, baseBorderWidth, style],
  );

  const dotStyle = useMemo(() => {
     if (variant !== 'dot') return null;
     const isActive = selected && !locked;
     return {
        width: `${s.dotSize}px`,
        height: `${s.dotSize}px`,
        borderRadius: '50%',
        border: `1.5px solid ${isActive ? tint : 'var(--border-strong)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isActive ? tint : 'transparent',
        color: isActive ? 'var(--surface-default)' : 'transparent',
        boxShadow: isActive ? `0 0 8px color-mix(in srgb, ${tint} 50%, transparent)` : 'none',
        transition: 'all 0.2s ease',
        flexShrink: 0
     };
  }, [variant, s.dotSize, selected, locked, tint]);

  return (
    <button ref={ref} type="button" className={className || undefined} style={composed} {...rest}>
      {variant === 'dot' && (
        <span style={dotStyle}>
          {locked ? <Lock size={s.dotSize - 4} strokeWidth={3.5} color="var(--text-secondary)" /> : (selected && <Check size={s.dotSize - 4} strokeWidth={3.5} />)}
        </span>
      )}
      {variant === 'icon' && (
         <>
           {locked && <Lock size={s.iconSize} />}
           {!locked && IconComponent && <IconComponent size={s.iconSize} />}
         </>
      )}
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
