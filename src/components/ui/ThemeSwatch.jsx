import React from 'react';

/**
 * A standard, reusable theme color swatch bubble/button.
 * Renders the theme's background color and its single/dual accent bubble dot.
 *
 * @param {object}   theme       The theme configuration object ({ key, color, accent, accent2 }).
 * @param {boolean}  isSelected  Whether this theme is currently active.
 * @param {function} onClick     Triggered when the swatch is clicked.
 * @param {string}   [title]     Tooltip text.
 */
export function ThemeSwatch({ theme, isSelected, onClick, title }) {
  const isDual = Boolean(theme.accent2);

  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? theme.key}
      style={{
        width: '42px', height: '42px', borderRadius: '12px',
        border: isSelected ? `2px solid ${theme.accent}` : '2px solid rgba(255,255,255,0.1)',
        background: theme.color,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0,
        outline: 'none',
      }}
    >
      <div style={{
        width: '16px', height: '16px', borderRadius: '50%',
        background: isDual
          ? `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`
          : theme.accent,
        boxShadow: isSelected ? `0 0 8px ${theme.accent}66` : 'none'
      }} />
    </button>
  );
}
