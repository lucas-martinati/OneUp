import { haptics } from '@utils/hapticsManager';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { useTweenedNumber } from '@hooks/useTweenedNumber';
import { getLevelForCount, getLevelThreshold, LEVEL_COUNT } from '@shared/exerciseLevels.js';
import styles from './LevelRing.module.css';

const point = angle => {
    const radians = angle * Math.PI / 180;
    return `${110 + 99 * Math.cos(radians)} ${110 + 99 * Math.sin(radians)}`;
};
const arc = (start, end) => `M ${point(start)} A 99 99 0 0 1 ${point(end)}`;

/** Real separated arcs: both ends stay rounded, including a partially filled level. */
export function LevelRing({ count, goal, color = 'var(--accent-primary)', celebrate = false, style }) {
    const { t } = useTranslation();
    const level = getLevelForCount(count, goal);
    const animatedCount = useTweenedNumber(Math.min(count, goal));
    const previous = useRef({ level, goal });
    const [burst, setBurst] = useState(null);
    useEffect(() => {
        const gained = previous.current.goal === goal && level > previous.current.level;
        previous.current = { level: previous.current.goal === goal ? Math.max(previous.current.level, level) : level, goal };
        const frame = requestAnimationFrame(() => {
            setBurst(celebrate && gained ? { level } : null);
        });
        const timer = setTimeout(() => setBurst(null), 1100);
        return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
    }, [level, goal, celebrate]);
    return (
        <svg viewBox="0 0 220 220" role="progressbar" aria-label={t('levels.progress')}
            aria-valuemin={0} aria-valuemax={LEVEL_COUNT} aria-valuenow={level}
            aria-valuetext={t('levels.reached', { level })}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none', ...style }}>
            {Array.from({ length: LEVEL_COUNT }, (_, i) => {
                const start = -90 + i * 36 + 4;
                const previous = i === 0 ? 0 : getLevelThreshold(goal, i);
                const target = getLevelThreshold(goal, i + 1);
                const fill = animatedCount >= target ? 1 : Math.max(0, (animatedCount - previous) / Math.max(1, target - previous));
                return <g key={i} fill="none" strokeWidth="8" strokeLinecap="round">
                    <path d={arc(start, start + 28)} stroke="var(--border-default)" />
                    {fill > 0 && <path d={arc(start, start + 28 * fill)} stroke={color} />}
                </g>;
            })}
            {burst && <g key={burst.level} aria-hidden="true" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
                <circle cx="110" cy="110" r="100" className={styles.burst} onAnimationStart={() => haptics.light()} />
                <g className={styles.sparks}>
                    {Array.from({ length: 10 }, (_, i) => <path key={i} d="M110 7V1" transform={`rotate(${i * 36} 110 110)`} />)}
                </g>
            </g>}
        </svg>
    );
}
