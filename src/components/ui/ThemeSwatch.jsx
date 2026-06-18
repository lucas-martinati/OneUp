import React, { useState } from 'react';
import { blobRadius } from '../../utils/blobRadius';

/**
 * A reusable theme color swatch: a rounded square ("cube") tile showing the
 * theme background, with an organic water-droplet of the accent color inside.
 * Each theme's droplet has a unique shape, and clicking makes it wobble like
 * jelly.
 *
 * @param {object}   theme       The theme configuration ({ key, color, accent, accent2 }).
 * @param {boolean}  isSelected  Whether this theme is currently active.
 * @param {function} onClick     Triggered on click. Receives the click event.
 * @param {string}   [title]     Tooltip text.
 */
export function ThemeSwatch({ theme, isSelected, onClick, title }) {
  const isDual = Boolean(theme.accent2);
  const dropletShape = blobRadius(theme.key);
  // Bumping the key remounts the droplet so the wobble animation replays on
  // every click, even rapid successive ones.
  const [pulseKey, setPulseKey] = useState(0);

  const handleClick = (e) => {
    setPulseKey((k) => k + 1);
    onClick?.(e);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title ?? theme.key}
      style={{
        width: '42px',
        height: '42px',
        borderRadius: '12px',
        border: isSelected
          ? `2px solid ${theme.accent}`
          : '2px solid rgba(255,255,255,0.1)',
        background: theme.color,
        cursor: 'pointer',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxShadow: isSelected ? `0 0 10px ${theme.accent}55` : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        outline: 'none',
        overflow: 'hidden',
      }}
    >
      <span
        key={pulseKey}
        style={{
          width: '18px',
          height: '18px',
          borderRadius: dropletShape,
          background: isDual
            ? `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.4), transparent 55%), linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`
            : `radial-gradient(circle at 32% 26%, rgba(255,255,255,0.4), transparent 55%), ${theme.accent}`,
          boxShadow: isSelected
            ? `0 0 8px ${theme.accent}99, inset 0 -2px 3px rgba(0,0,0,0.25)`
            : 'inset 0 -2px 3px rgba(0,0,0,0.25)',
          // Jelly wobble: the droplet deforms (squishes/stretches) on click.
          animation: 'dropletSquish 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      />
    </button>
  );
}
