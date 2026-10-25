import { useTranslation } from 'react-i18next';
import { Flame, Trophy, ChevronDown } from '@utils/icons';
import { LevelEmblem } from './LevelEmblem';
import styles from './LevelStreakDetails.module.css';

/** Adjacent levels with identical streaks share a card instead of ten repeated rows. */
export function LevelStreakDetails({ levels = [], expanded = false, weekly = false }) {
    const { t } = useTranslation();
    if (!levels.length) return null;
    const earned = levels.filter(row => row.current > 0 || row.max > 0);
    const currentLevel = Math.max(0, ...levels.filter(row => row.current > 0).map(row => row.level));
    const previewLevels = [...new Set([earned[0]?.level || 0, currentLevel, earned.at(-1)?.level || 0])].filter(level => level > 0);
    const groups = [];
    for (const row of levels) {
        const previous = groups.at(-1);
        if (previous && previous.current === row.current && previous.max === row.max) previous.end = row.level;
        else groups.push({ ...row, end: row.level });
    }
    const unit = t(weekly ? 'common.weeksAbbr' : 'common.daysAbbr');
    const content = <div className={styles.grid}>
            {groups.map(row => <div key={row.level} className={`${styles.card} ${row.current > 0 ? styles.active : ''}`}>
                <span className={styles.level} aria-label={t('levels.short', { level: row.level === row.end ? row.level : `${row.level}–${row.end}` })}>
                    <LevelEmblem level={row.level} size={30} />
                    {row.end !== row.level && <><span aria-hidden="true">—</span><LevelEmblem level={row.end} size={30} /></>}
                </span>
                <div className={styles.current}><Flame size={16} /><strong>{row.current}</strong><span>{unit}</span></div>
                <span className={styles.caption}>{t('levels.current')}</span>
                <div className={styles.record}><Trophy size={12} />{t('levels.record')} · {row.max} {unit}</div>
            </div>)}
        </div>;
    if (expanded) return content;
    return <details className={styles.details}>
        <summary className={styles.summary}>
            <span className={styles.stack} aria-hidden="true">{(previewLevels.length ? previewLevels : [0]).map(level => <LevelEmblem key={level} level={level} size={28} showZero />)}</span>
            <span className={styles.summaryLabel}>{t('levels.streaks')}</span><ChevronDown size={16} className={styles.chevron} />
        </summary>
        {content}
    </details>;
}
