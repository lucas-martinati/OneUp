import React from 'react';
import { Flame } from 'lucide-react';

/**
 * Frozen Flame — The real Lucide Flame icon with an icy/frozen appearance.
 * Used when the streak is preserved by a Streak Freeze (frozen but safe).
 *
 * Renders the actual Lucide Flame component (so proportions are perfect) with a
 * semi-transparent icy fill, and overlays small ice-crystal "+" accents to
 * convey "your fire is frozen, not extinguished".
 *
 * @param {number}  [size=16]           - Icon size in px
 * @param {string}  [color='#38bdf8']   - Primary color (icy blue)
 * @param {Object}  [style]             - Additional inline styles
 * @param {string}  [className]         - Additional CSS class
 */
export function FrozenFlame({ size = 16, color = '#38bdf8', style, className, ...props }) {
  return (
    <span
      className={className}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}
      {...props}
    >
      {/* The real Lucide Flame — icy blue stroke with translucent fill */}
      <Flame size={size} color={color} fill={`${color}30`} strokeWidth={2} />

      {/* Ice crystal accents overlaid on the flame */}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <g stroke="#e0f2fe" strokeWidth="1.4" strokeLinecap="round" opacity="0.9">
          {/* Top-right crystal */}
          <line x1="15" y1="5.5" x2="15" y2="3.5" />
          <line x1="14" y1="4.5" x2="16" y2="4.5" />
          {/* Left crystal */}
          <line x1="6.5" y1="12.5" x2="6.5" y2="11" />
          <line x1="5.7" y1="11.8" x2="7.3" y2="11.8" />
        </g>
      </svg>
    </span>
  );
}
