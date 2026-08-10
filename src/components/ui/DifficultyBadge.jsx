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
    const bgColor = `hsla(${hue}, 85%, 55%, 0.12)`;
    const borderColor = `hsla(${hue}, 85%, 55%, 0.2)`;

    return (
        <span style={{ 
            fontSize: 'clamp(0.52rem, 1.2vh, 0.7rem)', 
            padding: '1px 6px', 
            borderRadius: 'var(--radius-full)',
            background: bgColor,
            border: `1px solid ${borderColor}`,
            color: color,
            display: 'inline-flex',
            alignItems: 'center',
            verticalAlign: 'middle',
            whiteSpace: 'nowrap',
            fontWeight: 700,
            marginLeft: '4px',
            ...style 
        }}>
            x{difficulty.toFixed(1)}
        </span>
    );
};
