import { useTranslation } from 'react-i18next';
import { Flame, Trophy } from '@utils/icons';
import { LevelEmblem } from './LevelEmblem';
import { LevelStreakDetails } from './LevelStreakDetails';
import { getStreakRecordLevel } from '@shared/exerciseLevels.js';
import styles from './LevelProfileSummary.module.css';

/** Daily progress and the sustained streak are separate achievements. */
export function LevelProfileSummary({ stats, todayLevel = 0 }) {
    const { t } = useTranslation();
    const streak = stats.displayStreak || stats.currentStreak || 0;
    return <section className={styles.panel}>
        <div className={styles.heading}>
            <h3 className={styles.title}>{t('levels.profileTitle')}</h3>
            <span className={styles.today}><span>{t('calendar.today')}</span><LevelEmblem level={todayLevel} size={38} showZero /></span>
        </div>
        <div className={styles.metrics}>
            <div className={styles.metric}>
                <span className={styles.label}><Flame size={15} />{t('levels.current')}</span>
                <div className={styles.value}><strong>{streak}<small>{t('common.daysAbbr')}</small></strong><LevelEmblem level={stats.streakLevel || 0} size={38} showZero /></div>
            </div>
            <div className={styles.metric}>
                <span className={styles.label}><Trophy size={15} />{t('levels.record')}</span>
                <div className={styles.value}><strong>{stats.maxStreak || 0}<small>{t('common.daysAbbr')}</small></strong><LevelEmblem level={getStreakRecordLevel(stats.levelStreaks, stats.maxStreak)} size={38} showZero /></div>
            </div>
        </div>
        {stats.levelStreaks?.length ? <LevelStreakDetails levels={stats.levelStreaks} /> : <p className={styles.hint}>{t('levels.profilePending')}</p>}
    </section>;
}
