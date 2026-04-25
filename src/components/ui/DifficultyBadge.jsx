import React from 'react';

/**
 * Reusable difficulty badge (red module) to indicate multipliers > 1.0.
 * Parity with Leaderboard UserDetail style.
 * 
 * @param {Object} props
 * @param {number} props.difficulty - The difficulty multiplier (e.g., 1.2)
 * @param {Object} props.style - Optional additional styles
 * @returns {JSX.Element|null}
 */
export const DifficultyBadge = ({ difficulty, style = {} }) => {
    if (!difficulty || difficulty === 1.0) return null;

    // Calculate hue from 0 (red) to 55 (orange-yellow/slightly green) based on difficulty 0.1 to 1.0
    const clampedDiff = Math.max(0.1, Math.min(1.0, difficulty));
    const hue = Math.round(((clampedDiff - 0.1) / 0.9) * 55);
    const color = `hsl(${hue}, 85%, 55%)`;
    const bgColor = `hsla(${hue}, 85%, 55%, 0.15)`;
    const borderColor = `hsla(${hue}, 85%, 55%, 0.25)`;

    return (
        <span style={{
            fontSize: '0.65rem',
            fontWeight: '700',
            color: color,
            background: bgColor,
            padding: '2px 6px',
            borderRadius: '8px',
            border: `1px solid ${borderColor}`,
            marginLeft: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            verticalAlign: 'middle',
            ...style
        }}>
            x{difficulty.toFixed(1)}
        </span>
    );
};
