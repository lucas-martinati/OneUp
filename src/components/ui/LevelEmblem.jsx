import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { LEVEL_COUNT } from '@shared/exerciseLevels.js';
import styles from './LevelEmblem.module.css';

const point = angle => {
    const radians = angle * Math.PI / 180;
    return `${20 + 17.5 * Math.cos(radians)} ${20 + 17.5 * Math.sin(radians)}`;
};
const segments = Array.from({ length: LEVEL_COUNT }, (_, i) => {
    const start = -90 + i * 36 + 5;
    return `M ${point(start)} A 17.5 17.5 0 0 1 ${point(start + 26)}`;
});

// Merge active (0..rank-1) and inactive (rank..9) arc subpaths into at most two
// <path> nodes instead of 10 separate DOM nodes per medal (~70% fewer SVG nodes
// across the 31-cell Calendar grid and stats lists, pixel-identical output).
const ACTIVE_PATHS = Array.from({ length: LEVEL_COUNT + 1 }, (_, rank) =>
    segments.slice(0, rank).join(' ')
);
const INACTIVE_PATHS = Array.from({ length: LEVEL_COUNT + 1 }, (_, rank) =>
    segments.slice(rank).join(' ')
);

const TEXT_STYLE = {
    fontFamily: 'sans-serif',
    fontSize: '17px',
    fontWeight: 900,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.8px',
};

function renderMedalSvg(rank, color, size, className, label) {
    const activeD = ACTIVE_PATHS[rank];
    const inactiveD = INACTIVE_PATHS[rank];
    return (
        <span className={`${styles.emblem} ${className}`} title={label}
            style={{ '--level-color': color, width: size, height: size }}>
            <svg viewBox="0 0 40 40" role="img" aria-label={label}>
                <path d="M20 7 31 13.5V25L20 33 9 25V13.5Z" fill={color} fillOpacity="0.14" stroke={color} strokeOpacity="0.45" strokeWidth="0.8" />
                {activeD && <path d={activeD} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />}
                {inactiveD && <path d={inactiveD} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" opacity={0.15} />}
                <text x="20" y="21" textAnchor="middle" dominantBaseline="middle" fill={color} style={TEXT_STYLE}>{rank}</text>
            </svg>
        </span>
    );
}

function TranslatedMedal({ rank, color, size, className }) {
    const { t } = useTranslation();
    return renderMedalSvg(rank, color, size, className, t('levels.short', { level: rank }));
}

/** Compact rank medal: the number stays readable without relying on colour. */
export const LevelEmblem = memo(function LevelEmblem({ level, size = 24, className = '', showZero = false, label }) {
    if (!Number.isInteger(level) || (level < 0 || (level === 0 && !showZero))) return null;
    const rank = Math.min(LEVEL_COUNT, level);
    let color = rank === 0 ? '#94a3b8' : '#67e8f9';
    if (rank >= 7) color = '#c4b5fd';
    if (rank === LEVEL_COUNT) color = '#fbbf24';
    if (label !== undefined) {
        return renderMedalSvg(rank, color, size, className, label);
    }
    return <TranslatedMedal rank={rank} color={color} size={size} className={className} />;
});
