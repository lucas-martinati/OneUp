import { useTranslation } from 'react-i18next';
import { Card, SectionTitle } from '@components/ui';
import { LevelEmblem } from '@components/ui/LevelEmblem';
import { LevelProgress } from '@components/ui/LevelProgress';
import { Flame, Activity } from '@utils/icons';
import styles from './LevelSettings.module.css';

/** Explain automatic levels; historical difficulty preferences remain stored for compatibility. */
export function LevelSettings() {
    const { t } = useTranslation();
    const steps = [{ level: 1, label: t('levels.step1') }, { level: 5, label: t('levels.step5') }, { level: 10, label: t('levels.step10') }];
    return <Card className={styles.card}>
        <SectionTitle>{t('levels.progress')}</SectionTitle>
        <div className={styles.journey}>
            {steps.map(({ level, label }) => <div key={level} className={styles.step}>
                <LevelEmblem level={level} size={48} />
                <strong>{label}</strong>
            </div>)}
        </div>
        <div className={styles.example}>
            <div className={styles.exampleHead}><LevelEmblem level={3} /><span>{t('levels.example')}</span><strong>30 / 100</strong></div>
            <div className={styles.track}><LevelProgress count={30} goal={100} color="#a78bfa" /></div>
            <span className={styles.caption}>{t('levels.nextReps', { count: 10, level: 4 })}</span>
        </div>
        <div className={styles.rules}>
            <div><Flame size={20} /><p>{t('levels.globalRule')}</p></div>
            <div><Activity size={20} /><p>{t('levels.cardioRule')}</p></div>
        </div>
    </Card>;
}
