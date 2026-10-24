import { useTranslation } from 'react-i18next';
import { getLevelForCount, getLevelThreshold, LEVEL_COUNT } from '@shared/exerciseLevels.js';

/** Compact inset progression for exercise tiles; the counter itself uses LevelRing. */
export function LevelProgress({ count, goal, color = 'var(--accent-primary)' }) {
    const { t } = useTranslation();
    return (
        <div role="progressbar" aria-label={t('levels.progress')} aria-valuemin={0} aria-valuemax={LEVEL_COUNT}
            aria-valuenow={getLevelForCount(count, goal)} style={{ display: 'flex', gap: '2px', width: '100%', height: '100%' }}>
            {Array.from({ length: LEVEL_COUNT }, (_, i) => {
                const previous = i === 0 ? 0 : getLevelThreshold(goal, i);
                const target = getLevelThreshold(goal, i + 1);
                const fill = count >= target ? 100 : Math.max(0, (count - previous) / Math.max(1, target - previous) * 100);
                return <span key={i} style={{ flex: 1, background: 'var(--border-default)', overflow: 'hidden' }}>
                    <span style={{ display: 'block', width: `${fill}%`, height: '100%', borderRadius: 'inherit', background: color, transition: 'width 0.3s ease' }} />
                </span>;
            })}
        </div>
    );
}
