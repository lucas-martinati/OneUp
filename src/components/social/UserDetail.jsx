import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Medal, ChevronLeft, Award, Flame, Calendar, TrendingUp, Activity, Dumbbell, Star } from '@utils/icons';
import { Avatar } from '@components/ui/Avatar';
import { Z_INDEX } from '@utils/zIndex';
import { DifficultyBadge } from '@components/ui/DifficultyBadge';
import { StreakFlame } from '@components/ui/StreakFlame';
import { WeightBadge } from '@components/ui/WeightBadge';
import { EXERCISES, CARDIO_EXERCISES } from '@config/exercises';
import { WEIGHT_EXERCISES } from '@config/weights';
import { getLocalDateStr } from '@utils/dateUtils';
import { getTierBadgeConfigs, canAccessFeature, FEATURES } from '@utils/entitlements';
import { useBackHandler } from '@hooks/useBackHandler';
import { getIcon } from '@utils/icons';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { cloudSync } from '@services/cloudSync';
import { useComputedStatsFromStore } from '@hooks/useComputedStatsFromStore';
import { PALETTE } from '@styles/palette';

export function UserDetail({ entry, rank, isMe, onClose }) {
    const { t } = useTranslation();
    // For the current user, trust the locally-computed badge count so the value
    // matches the Stats page exactly (the server count can be stale/approximate).
    const myStats = useComputedStatsFromStore();
    // Medal colors shared with LeaderboardPodium via the fixed palette
    // (kept as hex strings because they get alpha-suffixed below).
    const rankColors = { 1: PALETTE.amber, 2: PALETTE.silver, 3: PALETTE.bronze };
    const todayStr = getLocalDateStr(new Date());
    const isPerfect = entry.isPerfectToday && entry.lastActiveDay === todayStr;
    const rankColor = rankColors[rank] || PALETTE.indigoLight;

    const [details, setDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(true);
    // Which tier badge (supporter / pro) has its explanation bubble open.
    const [openBadge, setOpenBadge] = useState(null);

    const badgeInfo = {
        supporter: { title: t('tierBadge.supporterTitle'), desc: t('tierBadge.supporterDesc') },
        pro: { title: t('tierBadge.proTitle'), desc: t('tierBadge.proDesc') },
    };

    useBackHandler(() => {
        onClose();
        return true;
    }, true);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoadingDetails(true);
            try {
                const data = await cloudSync.loadUserDetailsWithCache(entry.uid);
                if (!cancelled) setDetails(data);
            } catch (e) {
                console.error('Failed to load user details', e);
            }
            if (!cancelled) setLoadingDetails(false);
        };
        load();
        return () => { cancelled = true; };
    }, [entry.uid]);

    // Server-computed derived stats from the user's public profile.
    const stats = details?.derivedStats || {};

    const renderExerciseRow = (ex) => {
        const ExIcon = getIcon(ex.icon);
        const reps = entry.exerciseReps?.[ex.id] || 0;
        const allList = [...EXERCISES, ...WEIGHT_EXERCISES];
        const maxReps = Math.max(...allList.map(e => entry.exerciseReps?.[e.id] || 0), 1);
        const barWidth = (reps / maxReps) * 100;
        const exDays = loadingDetails ? null : (stats.exerciseDays?.[ex.id] || 0);
        const weight = details?.exerciseWeights?.[ex.id] || ex.defaultWeight;
        const isWeightEx = !!WEIGHT_EXERCISES.find(e => e.id === ex.id);
        return (
            <div key={ex.id} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                borderRadius: 'var(--radius-md)', background: `${ex.color}16`,
                border: `1px solid ${ex.color}22`
            }}>
                <ExIcon size={16} color={ex.color} style={{ flexShrink: 0 }} />
                <div className="flex-1-min0">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: ex.color }}>{getExerciseLabel(ex, t)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {!loadingDetails && (
                                <StreakFlame
                                    streak={stats.exerciseStreaks?.[ex.id] || 0}
                                    active={!!stats.exerciseDoneToday?.[ex.id]}
                                />
                            )}
                            {exDays !== null && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.7 }}>{exDays}{t('common.daysAbbr')}</span>
                            )}
                            {isWeightEx && <WeightBadge weight={weight} color={ex.color} />}
                            {(() => {
                                // Difficulty snapshot from the user's public profile.
                                const difficulty = details?.exerciseDifficulties?.[ex.id] || 1.0;

                                if (difficulty === 1.0) return null;
                                return <DifficultyBadge difficulty={difficulty} style={{ marginLeft: 0, marginRight: '4px' }} />;
                            })()}
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>{reps.toLocaleString()}</span>
                        </div>
                    </div>
                    <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: '2px', width: `${barWidth}%`, background: `linear-gradient(90deg, ${ex.color}, ${ex.color}88)`, transition: 'width 0.4s ease' }} />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            onClick={onClose}
            className="fade-in"
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.82)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 'var(--spacing-md)', zIndex: Z_INDEX.MODAL + 10
            }}
        >
            <div
                onClick={(e) => { e.stopPropagation(); setOpenBadge(null); }}
                className="glass-premium slide-up"
                style={{
                    width: '100%', maxWidth: '400px',
                    borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-lg)',
                    boxShadow: isPerfect 
                        ? '0 0 30px rgba(255, 215, 0, 0.25), 0 20px 60px rgba(0,0,0,0.5)' 
                        : '0 20px 60px rgba(0,0,0,0.5)',
                    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                    background: rank <= 3
                        ? `linear-gradient(160deg, ${rankColor}24, transparent 58%), var(--surface-section)`
                        : 'var(--surface-section)',
                    border: rank <= 3 ? `1px solid ${rankColor}40` : '1px solid var(--border-default)',
                    position: 'relative', overflow: 'hidden'
                }}
            >
                {isPerfect && (
                    <>
                        {[
                            { top: '5%', left: '10%', size: 14, delay: '0s' },
                            { top: '15%', right: '15%', size: 10, delay: '1s' },
                            { bottom: '20%', left: '15%', size: 12, delay: '2s' },
                            { bottom: '10%', right: '10%', size: 9, delay: '3s' },
                            { top: '40%', left: '5%', size: 11, delay: '1.5s' },
                            { top: '50%', right: '5%', size: 8, delay: '2.5s' },
                            { top: '10%', left: '50%', size: 13, delay: '0.5s' },
                            { bottom: '30%', right: '40%', size: 7, delay: '3.5s' },
                        ].map((s, idx) => (
                            <Star 
                                key={idx}
                                className="sparkle-icon" 
                                size={s.size} 
                                fill={PALETTE.gold} 
                                style={{ 
                                    top: s.top, left: s.left, right: s.right, bottom: s.bottom, 
                                    animationDelay: s.delay 
                                }} 
                            />
                        ))}
                    </>
                )}
                <button
                    onClick={onClose}
                    className="hover-lift"
                    style={{
                        background: 'rgba(255,255,255,0.08)', border: 'none',
                        borderRadius: '50%', width: 'var(--touch-min)', height: 'var(--touch-min)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '12px',
                        flexShrink: 0
                    }}
                >
                    <ChevronLeft size={18} />
                </button>

                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '10px', marginBottom: 'var(--spacing-md)'
                }}>
                    <div style={{
                        position: 'relative', borderRadius: '50%',
                        boxShadow: isPerfect ? '0 0 28px -2px rgba(255,215,0,0.6)' : `0 0 24px -6px ${rankColor}`
                    }}>
                        {isPerfect && (
                            <>
                                <Star className="sparkle-icon" size={13} fill={PALETTE.gold} style={{ top: '-4px', left: '-2px', animationDelay: '0s' }} />
                                <Star className="sparkle-icon" size={10} fill={PALETTE.gold} style={{ bottom: '2px', right: '-4px', animationDelay: '1.6s' }} />
                                <Star className="sparkle-icon" size={11} fill={PALETTE.gold} style={{ top: '46%', right: '-8px', animationDelay: '2.9s' }} />
                            </>
                        )}
                        <Avatar photoURL={entry.photoURL} name={entry.pseudo} size={76} borderColor={isPerfect ? PALETTE.gold : rankColor} />
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-primary)',
                            display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center'
                        }}>
                            <span style={{ wordBreak: 'break-all' }}>
                                {entry.pseudo} {isMe && <span style={{ fontSize: '1rem', opacity: 0.8 }}>({t('common.you')})</span>}
                            </span>
                            {getTierBadgeConfigs(entry).map(badge => {
                                const BadgeIcon = badge.icon;
                                const info = badgeInfo[badge.key];
                                const isOpen = openBadge === badge.key;
                                return (
                                    <span key={badge.key} style={{ position: 'relative', display: 'inline-flex' }}>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setOpenBadge(isOpen ? null : badge.key); }}
                                            aria-label={info?.title}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', background: badge.bgColor, borderRadius: '12px',
                                                padding: '2px 8px', gap: '4px', marginLeft: '4px', border: `1px solid ${badge.borderColor}`,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <BadgeIcon size={12} color={badge.color} fill={badge.fill} />
                                        </button>
                                        {isOpen && info && (
                                            <div role="tooltip" style={{
                                                position: 'absolute', top: 'calc(100% + 9px)', left: '50%', transform: 'translateX(-50%)',
                                                animation: 'tooltipPop 0.18s var(--ease-panel-in)',
                                                width: 'max-content', maxWidth: '200px',
                                                background: 'var(--tooltip-bg)', border: `1px solid ${badge.borderColor}`,
                                                borderRadius: 'var(--radius-md)', padding: '8px 11px',
                                                boxShadow: 'var(--shadow-lg)', zIndex: 5, textAlign: 'center',
                                                WebkitTextFillColor: 'initial'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: '700', color: badge.color }}>
                                                    <BadgeIcon size={13} color={badge.color} fill={badge.fill} />
                                                    {info.title}
                                                </div>
                                                <div style={{ fontSize: '0.68rem', fontWeight: '500', lineHeight: 1.35, color: 'var(--text-secondary)', marginTop: '3px' }}>
                                                    {info.desc}
                                                </div>
                                                <span aria-hidden style={{
                                                    position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                                                    borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                                                    borderBottom: `6px solid ${badge.borderColor}`
                                                }} />
                                            </div>
                                        )}
                                    </span>
                                );
                            })}
                        </div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '4px 12px', borderRadius: 'var(--radius-full)', marginTop: '6px',
                            background: `${rankColor}1f`, border: `1px solid ${rankColor}3d`,
                            boxShadow: rank <= 3 ? `0 0 14px -4px ${rankColor}` : 'none'
                        }}>
                            {rank <= 3 ? <Medal size={14} color={rankColor} /> : <span style={{ fontSize: '0.78rem', color: rankColor, fontWeight: '800' }}>#</span>}
                            <span style={{ fontSize: '0.82rem', fontWeight: '800', color: rankColor }}>{rank}</span>
                        </div>
                    </div>
                </div>

                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingRight: '4px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: 'var(--spacing-md)', flexShrink: 0 }}>

                        
                        {canAccessFeature(FEATURES.WEIGHTS, entry) && entry.weightsTotalReps > 0 && (
                            <StatCard 
                                icon={<Activity size={16} color="#f43f5e" />} 
                                label={t('common.global')} 
                                value={(entry.totalReps + entry.weightsTotalReps).toLocaleString()} 
                                color="#f43f5e" 
                            />
                        )}

                        <StatCard 
                            icon={<Trophy size={16} color={PALETTE.amber} />} 
                            label={t('common.bodyweight')}
                            value={entry.totalReps.toLocaleString()} 
                            color={PALETTE.amber} 
                        />
                        
                        {canAccessFeature(FEATURES.WEIGHTS, entry) && entry.weightsTotalReps > 0 && (
                            <StatCard 
                                icon={<Dumbbell size={16} color="#8b5cf6" />} 
                                label={t('common.weights')} 
                                value={entry.weightsTotalReps.toLocaleString()} 
                                color="#8b5cf6" 
                            />
                        )}

                        <StatCard icon={<Award size={16} color="#a855f7" />} label={t('leaderboard.achievements')} value={(isMe && myStats?.badgeCount != null ? myStats.badgeCount : details?.achievements) || 0} color="#a855f7" />
                        <StatCard icon={<Flame size={16} color={PALETTE.orange} />} label={t('common.bestStreak')} value={loadingDetails ? '…' : (stats.maxStreak || 0)} color={PALETTE.orange} />
                        <StatCard icon={<Calendar size={16} color="#22d3ee" />} label={t('leaderboard.activeDays')} value={loadingDetails ? '…' : (stats.totalDays || 0)} color="#22d3ee" />
                        <StatCard icon={<TrendingUp size={16} color="#10b981" />} label={t('leaderboard.currentStreak')} value={loadingDetails ? '…' : (stats.currentStreak || 0)} color="#10b981" />
                        <StatCard icon={<Activity size={16} color={PALETTE.pink} />} label={t('common.perfectDays')} value={loadingDetails ? '…' : (stats.perfectDays || 0)} color={PALETTE.pink} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, paddingBottom: '16px' }}>
                        {CARDIO_EXERCISES && CARDIO_EXERCISES.length > 0 && (
                            <>
                                <div style={{ ...sectionLabelStyle, marginTop: '4px' }}>
                                    {t('common.cardio')}
                                </div>
                                {CARDIO_EXERCISES.map(renderExerciseRow)}
                            </>
                        )}

                        <div style={sectionLabelStyle}>
                            {t('common.bodyweight')}
                        </div>
                        {EXERCISES.map(renderExerciseRow)}
                        
                        {canAccessFeature(FEATURES.WEIGHTS, entry) && (
                            <>
                                <div style={sectionLabelStyle}>
                                    {t('common.weights')}
                                </div>
                                {WEIGHT_EXERCISES.map(renderExerciseRow)}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const sectionLabelStyle = {
    fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)',
    textTransform: 'uppercase', marginBottom: '4px', marginTop: '16px', letterSpacing: '1px'
};

function StatCard({ icon, label, value, color }) {
    return (
        <div style={{
            padding: '13px 10px', borderRadius: 'var(--radius-lg)',
            background: `linear-gradient(160deg, ${color}2e, ${color}12)`,
            border: `1px solid ${color}38`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px'
        }}>
            <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: `${color}1f`, border: `1px solid ${color}33`,
                display: 'grid', placeItems: 'center'
            }}>
                {icon}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
            <div style={{ fontSize: '0.56rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', textAlign: 'center' }}>{label}</div>
        </div>
    );
}
