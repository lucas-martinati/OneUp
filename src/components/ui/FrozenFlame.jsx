import React from 'react';

// Lucide "flame" outline — shared by the fill, the clip and the outline so the
// frosted highlight can never drift out of the flame silhouette.
const FLAME_PATH = 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z';

/**
 * Frozen Flame — a flame rendered with an icy look: a vertical frost→blue
 * gradient fill, a frosted glassy sheen clipped to the flame shape, a crisp icy
 * outline and a soft blue halo. Conveys "your fire is frozen, not extinguished"
 * while staying clean and legible even at 16px.
 *
 * @param {number}  [size=16]           - Icon size in px
 * @param {string}  [color='#38bdf8']   - Base icy color (drives the gradient + glow)
 * @param {Object}  [style]             - Additional inline styles on the wrapper
 * @param {string}  [className]         - Additional CSS class on the wrapper
 */
export function FrozenFlame({ size = 16, color = '#38bdf8', style, className, ...props }) {
  // Unique ids so multiple instances never collide in the SVG namespace.
  const uid = React.useId().replace(/:/g, '');
  const fillId = `ff-fill-${uid}`;
  const sheenId = `ff-sheen-${uid}`;
  const clipId = `ff-clip-${uid}`;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        filter: `drop-shadow(0 0 3px ${color}66)`,
        ...style,
      }}
      {...props}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <defs>
          {/* Frost-white tip melting into the icy base colour. */}
          <linearGradient id={fillId} x1="12" y1="1.5" x2="12" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f0f9ff" />
            <stop offset="42%" stopColor="#a5e3fd" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          {/* Glassy sheen radiating from the upper-centre. */}
          <radialGradient id={sheenId} cx="11" cy="9" r="8" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <clipPath id={clipId}>
            <path d={FLAME_PATH} />
          </clipPath>
        </defs>

        {/* Flame body: icy gradient fill + crisp outline. */}
        <path d={FLAME_PATH} fill={`url(#${fillId})`} stroke={color} strokeWidth="1.4" strokeLinejoin="round" />

        {/* Frosted sheen, safely clipped to the flame silhouette. */}
        <g clipPath={`url(#${clipId})`}>
          <rect x="0" y="0" width="24" height="24" fill={`url(#${sheenId})`} />
        </g>
      </svg>
    </span>
  );
}
