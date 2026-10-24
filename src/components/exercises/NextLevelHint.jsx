import { useTranslation } from 'react-i18next';
import { getLevelForCount, getLevelThreshold, LEVEL_COUNT } from '@shared/exerciseLevels.js';
import { LevelEmblem } from '@components/ui/LevelEmblem';
import { formatTime } from '@utils/formatters';
import styles from './NextLevelHint.module.css';

export function NextLevelHint({ count, goal, isTimer }) {
    const { t } = useTranslation();
    const level = getLevelForCount(count, goal);
    if (level >= LEVEL_COUNT) return <div className={styles.hint}><LevelEmblem level={level} />{t('levels.complete')}</div>;
    const target = getLevelThreshold(goal, level + 1);
    // Several rounded thresholds can coincide at the beginning of a challenge.
    const nextLevel = getLevelForCount(target, goal);
    const remaining = Math.max(0, target - count);
    return <div className={styles.hint}>
        <LevelEmblem level={nextLevel} />
        <span>{isTimer
            ? t('levels.nextTime', { time: formatTime(remaining), level: nextLevel })
            : t('levels.nextReps', { count: remaining, level: nextLevel })}</span>
    </div>;
}
