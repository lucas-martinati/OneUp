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

    return (
        <span style={{
            fontSize: '0.65rem',
            fontWeight: '700',
            color: '#ef4444',
            background: 'rgba(239, 68, 68, 0.15)',
            padding: '2px 6px',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
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
