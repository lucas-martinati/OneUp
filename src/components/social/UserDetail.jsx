import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Medal, ChevronLeft, Award, Flame, Calendar, TrendingUp, Activity, Dumbbell, Zap, Star } from '../../utils/icons';
import { Avatar } from '../ui/Avatar';
import { DifficultyBadge } from '../ui/DifficultyBadge';
import { EXERCISES, CARDIO_EXERCISES } from '../../config/exercises';
import { WEIGHT_EXERCISES } from '../../config/weights';
import { registerBackHandler } from '../../utils/backHandler';
import { getLocalDateStr, calculateStreak, calculateExerciseStreak, calculateMaxStreak } from '../../utils/dateUtils';
import { getTierBadgeConfigs, canAccessFeature, FEATURES } from '../../utils/entitlements';
import { useBackHandler } from '../../hooks/useBackHandler';
import { getIcon } from '../../utils/icons';
import { getExerciseLabel } from '../../utils/exerciseLabel';

export function UserDetail({ entry, rank, isMe, onClose, cloudSync }) {
    const { t } = useTranslation();
    const rankColors = { 1: '#fbbf24', 2: '#c0c0c0', 3: '#cd7f32' };
    const todayStr = getLocalDateStr(new Date());
    const isPerfect = entry.isPerfectToday && entry.lastActiveDay === todayStr;
    const rankColor = rankColors[rank] || '#818cf8';

    const [details, setDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(true);

    useBackHandler(() => {
        onClose();
        return true;
    }, true);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoadingDetails(true);
            try {
                const data = await cloudSync.loadUserDetails(entry.uid);
                if (!cancelled) setDetails(data);
            } catch (e) {
                console.error('Failed to load user details', e);
            }
            if (!cancelled) setLoadingDetails(false);
        };
        load();
        return () => { cancelled = true; };
    }, [entry.uid, cloudSync]);

    const stats = computeStats(details);

    const renderExerciseRow = (ex) => {
        const ExIcon = getIcon(ex.icon);
        const reps = entry.exerciseReps?.[ex.id] || 0;
        const allList = [...EXERCISES, ...WEIGHT_EXERCISES];
        const maxReps = Math.max(...allList.map(e => entry.exerciseReps?.[e.id] || 0), 1);
        const barWidth = (reps / maxReps) * 100;
        const exDays = loadingDetails ? null : (stats.exerciseDays?.[ex.id] || 0);
        const weight = entry.exerciseWeights?.[ex.id] || ex.defaultWeight;
        const isWeightEx = !!WEIGHT_EXERCISES.find(e => e.id === ex.id);
        return (
            <div key={ex.id} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                borderRadius: 'var(--radius-md)', background: `${ex.color}08`
            }}>
                <ExIcon size={16} color={ex.color} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: ex.color }}>{getExerciseLabel(ex, t)}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {!loadingDetails && (stats.exerciseStreaks?.[ex.id] || 0) > 0 && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '2px',
                                    background: stats.exerciseDoneToday?.[ex.id] ? 'rgba(249,115,22,0.12)' : 'rgba(120,120,120,0.08)',
                                    padding: '2px 6px', borderRadius: '8px'
                                }}>
                                    <span style={{ fontSize: '0.6rem', opacity: stats.exerciseDoneToday?.[ex.id] ? 1 : 0.5, filter: stats.exerciseDoneToday?.[ex.id] ? 'none' : 'grayscale(1)' }}>🔥</span>
                                    <span style={{ fontSize: '0.65rem', fontWeight: '700', color: stats.exerciseDoneToday?.[ex.id] ? '#f97316' : '#888' }}>{stats.exerciseStreaks[ex.id]}{t('common.daysAbbr')}</span>
                                </div>
                            )}
                            {exDays !== null && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.7 }}>{exDays}{t('common.daysAbbr')}</span>
                            )}
                            {isWeightEx && (
                                <span style={{ 
                                    fontSize: '0.65rem', fontWeight: '600', color: 'var(--text-secondary)',
                                    background: `${ex.color}12`, padding: '2px 6px', borderRadius: '8px',
                                    border: `1px solid ${ex.color}20`
                                }}>
                                    {weight} {t('weight.kg')}
                                </span>
                            )}
                            {(() => {
                                // Prioritize difficulty recorded in the latest completion
                                let difficulty = 1.0;
                                let foundInHistory = false;
                                if (details?.completions) {
                                    const sortedDates = Object.keys(details.completions).sort().reverse();
                                    for (const date of sortedDates) {
                                        const day = details.completions[date];
                                        if (day[ex.id]?.isCompleted && day[ex.id]?.difficulty !== undefined) {
                                            difficulty = day[ex.id].difficulty;
                                            foundInHistory = true;
                                            break;
                                        }
                                    }
                                }
                                
                                // Fallback to snapshot if no history found
                                if (!foundInHistory) {
                                    difficulty = entry.exerciseDifficulties?.[ex.id] || 1.0;
                                }

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
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 'var(--spacing-md)', zIndex: 120
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="glass-premium slide-up"
                style={{
                    width: '100%', maxWidth: '400px',
                    borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-lg)',
                    boxShadow: isPerfect 
                        ? '0 0 30px rgba(255, 215, 0, 0.25), 0 20px 60px rgba(0,0,0,0.5)' 
                        : '0 20px 60px rgba(0,0,0,0.5)',
                    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                    background: rank === 1 
                        ? 'linear-gradient(135deg, rgba(30, 25, 10, 0.8), rgba(20, 15, 5, 0.5))' 
                        : rank === 2 
                            ? 'linear-gradient(135deg, rgba(25, 25, 25, 0.8), rgba(15, 15, 15, 0.5))'
                            : rank === 3
                                ? 'linear-gradient(135deg, rgba(30, 20, 15, 0.8), rgba(20, 10, 5, 0.5))'
                                : undefined,
                    border: rank <= 3 ? `1px solid ${rankColor}40` : undefined,
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
                                fill="#FFD700" 
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
                    gap: '8px', marginBottom: 'var(--spacing-md)'
                }}>
                    <Avatar photoURL={entry.photoURL} name={entry.pseudo} size={64} borderColor={rankColor} />

                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '1.4rem', fontWeight: '800', color: isMe ? '#fbbf24' : 'var(--text-primary)',
                            display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center'
                        }}>
                            <span style={{ wordBreak: 'break-all' }}>
                                {entry.pseudo} {isMe && <span style={{ fontSize: '1rem', opacity: 0.8 }}>({t('common.you')})</span>}
                            </span>
                            {getTierBadgeConfigs(entry).map(badge => {
                                const BadgeIcon = badge.icon;
                                return (
                                    <span key={badge.key} style={{
                                        display: 'inline-flex', alignItems: 'center', background: badge.bgColor, borderRadius: '12px',
                                        padding: '2px 8px', gap: '4px', marginLeft: '4px', border: `1px solid ${badge.borderColor}`
                                    }}>
                                        <BadgeIcon size={12} color={badge.color} fill={badge.fill} />
                                    </span>
                                );
                            })}
                        </div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '3px 10px', borderRadius: '12px', marginTop: '4px',
                            background: `${rankColor}18`, border: `1px solid ${rankColor}30`
                        }}>
                            {rank <= 3 ? <Medal size={14} color={rankColor} /> : <span style={{ fontSize: '0.75rem', color: rankColor, fontWeight: '700' }}>#</span>}
                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: rankColor }}>{rank}</span>
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
                            icon={<Trophy size={16} color="#fbbf24" />} 
                            label={t('common.bodyweight')}
                            value={entry.totalReps.toLocaleString()} 
                            color="#fbbf24" 
                        />
                        
                        {canAccessFeature(FEATURES.WEIGHTS, entry) && entry.weightsTotalReps > 0 && (
                            <StatCard 
                                icon={<Dumbbell size={16} color="#8b5cf6" />} 
                                label={t('common.weights')} 
                                value={entry.weightsTotalReps.toLocaleString()} 
                                color="#8b5cf6" 
                            />
                        )}

                        <StatCard icon={<Award size={16} color="#a855f7" />} label={t('leaderboard.achievements')} value={entry.achievements || 0} color="#a855f7" />
                        <StatCard icon={<Flame size={16} color="#f97316" />} label={t('common.bestStreak')} value={loadingDetails ? '…' : (stats.maxStreak || 0)} color="#f97316" />
                        <StatCard icon={<Calendar size={16} color="#22d3ee" />} label={t('leaderboard.activeDays')} value={loadingDetails ? '…' : (stats.totalDays || 0)} color="#22d3ee" />
                        <StatCard icon={<TrendingUp size={16} color="#10b981" />} label={t('leaderboard.currentStreak')} value={loadingDetails ? '…' : (stats.currentStreak || 0)} color="#10b981" />
                        <StatCard icon={<Activity size={16} color="#ec4899" />} label={t('common.perfectDays')} value={loadingDetails ? '…' : (stats.perfectDays || 0)} color="#ec4899" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, paddingBottom: '16px' }}>
                        {CARDIO_EXERCISES && CARDIO_EXERCISES.length > 0 && (
                            <>
                                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', marginTop: '4px', letterSpacing: '1px' }}>
                                    Cardio
                                </div>
                                {CARDIO_EXERCISES.map((ex, index) => renderExerciseRow(ex, index))}
                            </>
                        )}

                        <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', marginTop: '16px', letterSpacing: '1px' }}>
                            {t('common.bodyweight')}
                        </div>
                        {EXERCISES.map((ex, index) => renderExerciseRow(ex, index))}
                        
                        {canAccessFeature(FEATURES.WEIGHTS, entry) && (
                            <>
                                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', marginTop: '16px', letterSpacing: '1px' }}>
                                    {t('common.weights')}
                                </div>
                                {WEIGHT_EXERCISES.map((ex, index) => renderExerciseRow(ex, index))}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    return (
        <div style={{ padding: '10px', borderRadius: 'var(--radius-md)', background: `${color}08`, border: `1px solid ${color}15`, textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                {icon}
                <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>{label}</span>
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: '800', color }}>{value}</div>
        </div>
    );
}

function computeStats(details) {
    if (!details?.completions) return { maxStreak: 0, currentStreak: 0, totalDays: 0, perfectDays: 0, exerciseDays: {} };

    const ALL_EXERCISES = [...EXERCISES, ...WEIGHT_EXERCISES, ...CARDIO_EXERCISES];
    const completions = details.completions;
    const today = getLocalDateStr(new Date());

    let totalDays = 0;
    let perfectDays = 0;
    const exerciseDays = {};
    ALL_EXERCISES.forEach(ex => { exerciseDays[ex.id] = 0; });

    for (const date in completions) {
        const day = completions[date];
        if (!day || typeof day !== 'object') continue;

        let anyDone = false;
        let allDone = true;

        for (const ex of ALL_EXERCISES) {
            if (day[ex.id]?.isCompleted) {
                anyDone = true;
                exerciseDays[ex.id]++;
            } else if (EXERCISES.find(e => e.id === ex.id)) {
                allDone = false;
            }
        }
        if (anyDone) totalDays++;
        if (allDone) perfectDays++;
    }

    const currentStreak = calculateStreak(completions, today);
    const maxStreak = calculateMaxStreak(completions);

    const exerciseStreaks = {};
    const exerciseDoneToday = {};
    ALL_EXERCISES.forEach(ex => {
        exerciseStreaks[ex.id] = calculateExerciseStreak(completions, today, ex.id);
        exerciseDoneToday[ex.id] = !!completions[today]?.[ex.id]?.isCompleted;
    });

    return { totalDays, perfectDays, maxStreak, currentStreak, exerciseDays, exerciseStreaks, exerciseDoneToday };
}
