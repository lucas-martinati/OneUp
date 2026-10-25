import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Trophy, Medal, Award, Activity, Dumbbell, Calendar, Star, getIcon } from '@utils/icons';
import { Avatar } from '@components/ui/Avatar';
import { Button, ModalContainer, WeightBadge } from '@components/ui';
import { StreakFlame } from '@components/ui/StreakFlame';
import { LevelProfileSummary } from '@components/ui/LevelProfileSummary';
import { LevelStreakDetails } from '@components/ui/LevelStreakDetails';
import { EXERCISES, CARDIO_EXERCISES, isCardioExercise, isWeightExercise } from '@config/exercises';
import { WEIGHT_EXERCISES } from '@config/weights';
import { getLocalDateStr } from '@shared/dateUtils';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { cloudSync } from '@services/cloudSync';
import { useComputedStatsFromStore } from '@hooks/useComputedStatsFromStore';
import { UserTierBadges } from './UserTierBadges';
import styles from './UserDetail.module.css';
import { PALETTE } from '@styles/palette';

export function UserDetail({ entry, rank, isMe, onClose }) {
    const { t, i18n } = useTranslation();
    const myStats = useComputedStatsFromStore();
    const rankColor = ({ 1: PALETTE.amber, 2: PALETTE.silver, 3: PALETTE.bronze })[rank] || PALETTE.indigoLight;
    const RankIcon = ({ 1: Trophy, 2: Medal, 3: Award })[rank] || Trophy;
    const todayStr = getLocalDateStr(new Date());
    const [details, setDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoadingDetails(true);
            setDetails(null);
            try {
                const data = await cloudSync.loadUserDetailsWithCache(entry.uid, entry.lastUpdated);
                if (!cancelled) setDetails(data);
            } catch (e) {
                console.error('Failed to load user details', e);
            }
            if (!cancelled) setLoadingDetails(false);
        };
        load();
        return () => { cancelled = true; };
    }, [entry.uid, entry.lastUpdated]);

    const publicStats = details?.derivedStats || {};
    const stats = isMe && myStats ? {
        ...publicStats, ...myStats,
        exerciseLevels: Object.fromEntries((myStats.exerciseStats || []).map(ex => [ex.id, { streak: ex.streak, level: ex.streakLevel, levels: ex.levelStreaks }])),
    } : publicStats;

    const groups = [
        { label: t('common.cardio'), exercises: CARDIO_EXERCISES.filter(ex => entry.exerciseReps?.[ex.id] > 0) },
        { label: t('common.bodyweight'), exercises: EXERCISES },
        { label: t('common.weights'), exercises: WEIGHT_EXERCISES.filter(ex => entry.exerciseReps?.[ex.id] > 0) },
    ];
    // The leaderboard total includes cardio equivalents; use exercise volumes for bodyweight.
    const bodyweightReps = EXERCISES.reduce((sum, ex) => sum + (entry.exerciseReps?.[ex.id] || 0), 0);
    const weightsReps = entry.weightsTotalReps || 0;
    const hasProgressToday = isMe ? myStats?.streakActive : entry.lastActiveDay === todayStr && Object.values(stats.exerciseDoneToday || {}).some(Boolean);
    const todayLevel = hasProgressToday ? Math.max(0, ...(stats.levelStreaks || []).filter(row => row.current > 0).map(row => row.level)) : 0;
    const achievementCount = (isMe ? myStats?.badgeCount : details?.achievements) || 0;
    const metrics = [
        { icon: Calendar, color: PALETTE.cyan, label: t('leaderboard.activeDays'), value: loadingDetails ? '…' : stats.totalDays || 0 },
        { icon: Star, color: PALETTE.amber, label: t('common.achievements'), value: loadingDetails ? '…' : achievementCount },
    ];
    return <ModalContainer open onClose={onClose} ariaLabel={entry.pseudo} position="center" unstyled>
        <section className={styles.panel} style={{ '--profile-accent': rankColor }}>
            <header className={styles.header}>
                <Avatar photoURL={entry.photoURL} name={entry.pseudo} size={76} borderColor={rankColor} />
                <div className={styles.identity}>
                    <h2>{entry.pseudo} {isMe && <small>({t('common.you')})</small>}</h2>
                    <div className={styles.badges}>
                        <span className={styles.rank}><RankIcon size={15} />#{rank}</span>
                        <UserTierBadges entry={entry} />
                    </div>
                </div>
                <div className={styles.close}><Button iconOnly icon={X} variant="ghost" size="sm" onClick={onClose} aria-label={t('common.close')} /></div>
            </header>
            <div className={styles.body}>
                {!loadingDetails && <LevelProfileSummary stats={stats} todayLevel={todayLevel} />}
                <section className={styles.volume}>
                    <div className={styles.volumeHeading}><span>{t('stats.totalReps')}</span><strong>{(bodyweightReps + weightsReps).toLocaleString(i18n.language)}</strong></div>
                    <div className={styles.volumeSplit}>
                        <div><Activity size={16} /><strong>{bodyweightReps.toLocaleString(i18n.language)}</strong><span>{t('common.bodyweight')}</span></div>
                        <div><Dumbbell size={16} /><strong>{weightsReps.toLocaleString(i18n.language)}</strong><span>{t('common.weights')}</span></div>
                    </div>
                </section>
                <div className={styles.metrics}>
                    {metrics.map(metric => {
                        const Icon = metric.icon;
                        return <div className={styles.metric} key={metric.label} style={{ '--metric-color': metric.color }}><Icon size={18} /><strong>{metric.value}</strong><span>{metric.label}</span></div>;
                    })}
                </div>
                {groups.filter(group => group.exercises.length).map(group => <section key={group.label} className={styles.group}>
                    <h3>{group.label}</h3>
                    {group.exercises.map(ex => {
                        const Icon = getIcon(ex.icon);
                        const levels = stats.exerciseLevels?.[ex.id];
                        return <div className={styles.exercise} key={ex.id} style={{ '--exercise-color': ex.color }}>
                            <div className={styles.exerciseTop}>
                                <span className={styles.exerciseIcon}><Icon size={18} /></span>
                                <span className={styles.exerciseName}>{getExerciseLabel(ex, t)}</span>
                                {isWeightExercise(ex.id) && <WeightBadge weight={details?.exerciseWeights?.[ex.id] || ex.defaultWeight} color={ex.color} />}
                                <strong>{(entry.exerciseReps?.[ex.id] || 0).toLocaleString(i18n.language)}</strong>
                            </div>
                            {!loadingDetails && <div className={styles.exerciseStreak}>
                                <StreakFlame streak={levels?.streak ?? stats.exerciseStreaks?.[ex.id]} level={levels?.level}
                                    active={!!stats.exerciseDoneToday?.[ex.id] && entry.lastActiveDay === todayStr} weekly={isCardioExercise(ex.id)} />
                                <LevelStreakDetails levels={levels?.levels} weekly={isCardioExercise(ex.id)} />
                            </div>}
                        </div>;
                    })}
                </section>)}
            </div>
        </section>
    </ModalContainer>;
}
