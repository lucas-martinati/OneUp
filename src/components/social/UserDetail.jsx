import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Medal, Crown, ChevronLeft, Award, Flame, Calendar, TrendingUp, Activity, Heart, Zap, Dumbbell, ArrowDownUp, ArrowUp, ChevronsUp, Footprints } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { EXERCISES } from '../../config/exercises';
import { WEIGHT_EXERCISES } from '../../config/weights';
import { registerBackHandler } from '../../utils/backHandler';
import { getLocalDateStr } from '../../utils/dateUtils';

const ICON_MAP = { Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints, Flame, Square: Activity, MoveDown: ArrowDownUp, MoveDiagonal: ArrowUp };

export function UserDetail({ entry, rank, isMe, onClose, cloudSync }) {
    const { t } = useTranslation();
    const rankColors = { 1: '#fbbf24', 2: '#c0c0c0', 3: '#cd7f32' };
    const rankColor = rankColors[rank] || '#818cf8';

    const [details, setDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(true);

    useEffect(() => {
        const unregister = registerBackHandler(() => {
            onClose();
            return true;
        });
        return unregister;
    }, [onClose]);

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

    const renderExerciseRow = (ex, index) => {
        const ExIcon = ICON_MAP[ex.icon] || Dumbbell;
        const reps = entry.exerciseReps?.[ex.id] || 0;
        const allList = [...EXERCISES, ...WEIGHT_EXERCISES];
        const maxReps = Math.max(...allList.map(e => entry.exerciseReps?.[e.id] || 0), 1);
        const barWidth = (reps / maxReps) * 100;
        const exDays = loadingDetails ? null : (stats.exerciseDays?.[ex.id] || 0);
        return (
            <div key={ex.id} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                borderRadius: 'var(--radius-md)', background: `${ex.color}08`
            }}>
                <ExIcon size={16} color={ex.color} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: ex.color }}>{t('exercises.' + ex.id)}</span>
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
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    maxHeight: '90vh', display: 'flex', flexDirection: 'column'
                }}
            >
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
                            {entry.isSupporter && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', background: 'rgba(239,68,68,0.15)', borderRadius: '12px',
                                    padding: '2px 8px', gap: '4px', marginLeft: '4px', border: '1px solid rgba(239,68,68,0.25)'
                                }}>
                                    <Heart size={12} color="#ef4444" fill="#ef4444" />
                                </span>
                            )}
                            {entry.isPro && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', background: 'rgba(139,92,246,0.15)', borderRadius: '12px',
                                    padding: '2px 8px', gap: '4px', marginLeft: '4px', border: '1px solid rgba(139,92,246,0.25)'
                                }}>
                                    <Crown size={12} color="#8b5cf6" fill="#8b5cf6" />
                                </span>
                            )}
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
                        {entry.difficultyMultiplier && entry.difficultyMultiplier !== 1 && (
                            <StatCard icon={<Zap size={16} color="#6366f1" />} label={t('leaderboard.difficulty')} value={`x${entry.difficultyMultiplier}`} color="#6366f1" />
                        )}
                        
                        {entry.isPro && entry.weightsTotalReps > 0 && (
                            <StatCard 
                                icon={<Activity size={16} color="#f43f5e" />} 
                                label={t('common.global')} 
                                value={(entry.totalReps + entry.weightsTotalReps).toLocaleString()} 
                                color="#f43f5e" 
                            />
                        )}

                        <StatCard 
                            icon={<Trophy size={16} color="#fbbf24" />} 
                            label={t('common.global_classic')}
                            value={entry.totalReps.toLocaleString()} 
                            color="#fbbf24" 
                        />
                        
                        {entry.isPro && entry.weightsTotalReps > 0 && (
                            <StatCard 
                                icon={<Dumbbell size={16} color="#8b5cf6" />} 
                                label={t('common.global_weights')} 
                                value={entry.weightsTotalReps.toLocaleString()} 
                                color="#8b5cf6" 
                            />
                        )}

                        <StatCard icon={<Award size={16} color="#a855f7" />} label={t('leaderboard.achievements')} value={entry.achievements || 0} color="#a855f7" />
                        <StatCard icon={<Flame size={16} color="#f97316" />} label={t('leaderboard.bestStreak')} value={loadingDetails ? '…' : (stats.maxStreak || 0)} color="#f97316" />
                        <StatCard icon={<Calendar size={16} color="#22d3ee" />} label={t('leaderboard.activeDays')} value={loadingDetails ? '…' : (stats.totalDays || 0)} color="#22d3ee" />
                        <StatCard icon={<TrendingUp size={16} color="#10b981" />} label={t('leaderboard.currentStreak')} value={loadingDetails ? '…' : (stats.currentStreak || 0)} color="#10b981" />
                        <StatCard icon={<Activity size={16} color="#ec4899" />} label={t('leaderboard.perfectDays')} value={loadingDetails ? '…' : (stats.perfectDays || 0)} color="#ec4899" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, paddingBottom: '16px' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', marginTop: '4px', letterSpacing: '1px' }}>
                            {t('common.global_classic')}
                        </div>
                        {EXERCISES.map((ex, index) => renderExerciseRow(ex, index))}
                        
                        {entry.isPro && (
                            <>
                                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', marginTop: '16px', letterSpacing: '1px' }}>
                                    {t('common.global_weights')}
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

    const ALL_EXERCISES = [...EXERCISES, ...WEIGHT_EXERCISES];
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
        
        // Count overall completion logic
        for (const ex of ALL_EXERCISES) {
            if (day[ex.id]?.isCompleted) {
                anyDone = true;
                exerciseDays[ex.id]++;
            } else if (EXERCISES.find(e => e.id === ex.id)) {
                // Classic perfect day only evaluates standard EXERCISES
                allDone = false;
            }
        }
        if (anyDone) totalDays++;
        if (allDone) perfectDays++;
    }

    const { maxStreak, currentStreak } = calculateGlobalStreak(completions, today);
    const exerciseStreaks = {};
    const exerciseDoneToday = {};

    ALL_EXERCISES.forEach(ex => {
        const streakData = calculateExerciseStreak(completions, ex.id, today);
        exerciseStreaks[ex.id] = streakData.currentStreak;
        exerciseDoneToday[ex.id] = streakData.doneToday;
    });

    return { totalDays, perfectDays, maxStreak, currentStreak, exerciseDays, exerciseStreaks, exerciseDoneToday };
}

function calculateGlobalStreak(completions, today) {
    const ALL_EXERCISES = [...EXERCISES, ...WEIGHT_EXERCISES];
    let dates = Object.keys(completions).filter(d => {
        const day = completions[d];
        return ALL_EXERCISES.some(ex => day?.[ex.id]?.isCompleted);
    }).sort();

    if (dates.length === 0) return { currentStreak: 0, maxStreak: 0 };

    let maxStreak = 1;
    let currentStreak = 1;
    let currentSpan = 1;

    for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            currentSpan++;
            maxStreak = Math.max(maxStreak, currentSpan);
        } else if (diffDays > 1) {
            currentSpan = 1;
        }
    }

    const lastDate = dates[dates.length - 1];
    const diffToToday = Math.round((new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24));

    if (diffToToday > 1) {
        currentStreak = 0;
    } else {
        currentStreak = currentSpan;
    }

    return { currentStreak, maxStreak };
}

function calculateExerciseStreak(completions, exId, today) {
    let dates = Object.keys(completions).filter(d => completions[d]?.[exId]?.isCompleted).sort();
    if (dates.length === 0) return { currentStreak: 0, doneToday: false };

    let currentStreak = 1;
    const lastDate = dates[dates.length - 1];
    const diffToToday = Math.round((new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24));
    
    // Reverse iterate to find streak
    let currentSpan = 1;
    for (let i = dates.length - 1; i > 0; i--) {
        const curr = new Date(dates[i]);
        const prev = new Date(dates[i - 1]);
        const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            currentSpan++;
        } else {
            break;
        }
    }

    const doneToday = diffToToday === 0;

    if (diffToToday > 1) {
        currentStreak = 0;
    } else {
        currentStreak = currentSpan;
    }

    return { currentStreak, doneToday };
}
