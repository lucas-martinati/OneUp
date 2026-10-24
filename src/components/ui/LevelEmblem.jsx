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

/** Compact rank medal: the number stays readable without relying on colour. */
export function LevelEmblem({ level, size = 24, className = '', showZero = false }) {
    const { t } = useTranslation();
    if (!Number.isInteger(level) || (level < 0 || (level === 0 && !showZero))) return null;
    const rank = Math.min(LEVEL_COUNT, level);
    let color = rank === 0 ? '#94a3b8' : '#67e8f9';
    if (rank >= 7) color = '#c4b5fd';
    if (rank === LEVEL_COUNT) color = '#fbbf24';
    const label = t('levels.short', { level: rank });
    return (
        <span className={`${styles.emblem} ${className}`} title={label}
            style={{ '--level-color': color, width: size, height: size }}>
            <svg viewBox="0 0 40 40" role="img" aria-label={label}>
                <path d="M20 7 31 13.5V25L20 33 9 25V13.5Z" fill={color} fillOpacity="0.14" stroke={color} strokeOpacity="0.45" strokeWidth="0.8" />
                {segments.map((d, i) => <path key={i} d={d} fill="none" stroke={color}
                    strokeWidth="2.4" strokeLinecap="round" opacity={i < rank ? 1 : 0.15} />)}
                <text x="20" y="21" textAnchor="middle" dominantBaseline="middle" fill={color}
                    style={{ fontFamily: 'sans-serif', fontSize: '17px', fontWeight: 900, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.8px' }}>{rank}</text>
            </svg>
        </span>
    );
}
