import React, { useState, useEffect, useCallback, useRef, Suspense, lazy, useMemo } from 'react';
import { X, TrendingUp, Award, Flame, Target, Trophy, Activity, Hash, Crown, Star, Filter, Lock, Share2, Clock, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { computeAllStats } from '../../hooks/useComputedStats';
import { canAccessFeature, FEATURES } from '../../utils/entitlements';
import { BADGE_DEFINITIONS } from '../../config/badgeDefinitions';
import ICON_MAP from '../../utils/iconMap';
import { Z_INDEX } from '../../utils/zIndex';
import { registerBackHandler } from '../../utils/backHandler';
import { useShareCard } from '../../features/share/hooks/useShareCard';
import { getSessionHistory, removeSession } from '../../features/share/services/sessionHistoryService';

// Lazy load Recharts components
const RadarChartPanel = lazy(() => import('./RadarChartPanel'));
const ConsistencyPieChart = lazy(() => import('./ConsistencyPieChart'));
const DailyRepsChart = lazy(() => import('./DailyRepsChart'));
const ShareModal = lazy(() => import('../../features/share/components/ShareModal').then(m => ({ default: m.ShareModal })));
const SessionDetailModal = lazy(() => import('../../features/share/components/SessionDetailModal').then(m => ({ default: m.SessionDetailModal })));

export function Stats({ completions, exercisesList, initialCategory, isPro, onClose, onOpenAchievements, highlightedBadgeId, settings, getDayNumber, computedStats: globalStats, onOpenStore }) {
    const { t, i18n } = useTranslation();
    const [chartsReady, setChartsReady] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [selectedSession, setSelectedSession] = useState(null);
    const [activeCategories, setActiveCategories] = useState(() => {
        if (initialCategory === 'global') return ['standard', 'weights', 'custom'];
        return [initialCategory || 'standard'];
    });
    const [showFilters, setShowFilters] = useState(false);
    const isClosingRef = useRef(false);

    const handleClose = useCallback(() => {
        if (isClosingRef.current) return;
        isClosingRef.current = true;
        onClose();
    }, [onClose]);

    // Back button handling
    useEffect(() => {
        history.pushState({ statsOpen: true }, '');
        const handlePopState = () => handleClose();
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [handleClose]);

    // Android hardware back button
    useEffect(() => {
        const unregister = registerBackHandler(() => {
            handleClose();
            return true;
        });
        return unregister;
    }, [handleClose]);

    // Wait for the modal transition to finish before attempting to load huge charting libraries
    useEffect(() => {
        const timer = setTimeout(() => {
            setChartsReady(true);
        }, 500); // Wait for transition
        return () => clearTimeout(timer);
    }, []);

    const exercises = React.useMemo(() => {
        let list = [];
        if (activeCategories.includes('standard')) list.push(...(exercisesList.standard || []));
        if (activeCategories.includes('weights')) list.push(...(exercisesList.weights || []));
        if (activeCategories.includes('custom')) list.push(...(exercisesList.custom || []));
        return list;
    }, [activeCategories, exercisesList]);

    const computedStats = React.useMemo(() => {
        if (canAccessFeature(FEATURES.MERGED_STATS, { isPro }) && activeCategories.length === 3) return globalStats;
        return computeAllStats(completions, settings, getDayNumber, exercises);
    }, [activeCategories, completions, settings, getDayNumber, exercises, globalStats, isPro]);

    // All values come from computedStats
    const {
        totalDays, maxStreak, displayStreak, streakActive, successRate,
        perfectDays, totalExerciseCompletions, globalTotalReps,
        exerciseStats, radarData, champion,
        monthlyActivityByExercise, monthlyActivityTotal,
        pieData, trackedCount, badgeCount,
        bestDayDate, bestDayReps, bestDayExReps,
        firstActiveDate, dailyRepsData
    } = computedStats;

    const activeData = pieData.filter(d => d.value > 0).map(d => ({
        ...d,
        name: t('stats.pieLabels.' + d.id)
    }));
    const translatedRadarData = radarData.map(d => {
        const ex = exercises?.find(e => e.id === d.exId);
        return {
            ...d,
            subject: ex?.label || t('exercises.' + d.exId)
        };
    });
    const maxMonthly = Math.max(...monthlyActivityTotal, 1);
    const monthNames = t('stats.monthAbbreviations', { returnObjects: true });
    const today = new Date();

    const [sessionHistory, setSessionHistory] = useState(() => getSessionHistory());

    const handleDeleteSession = useCallback((sessionId) => {
        const updated = removeSession(sessionId);
        setSessionHistory(updated);
    }, []);

    const shareHook = useShareCard({
        sessionData: { date: new Date().toISOString(), exercises: [], duration: 0, name: t('stats.title') },
        stats: computedStats,
        sessionHistory,
        mode: 'global',
    });

    const ChampionIcon = champion && ICON_MAP[champion.icon] ? ICON_MAP[champion.icon] : Dumbbell;

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
    };

    return (
        <div className="fade-in modal-overlay" style={{ zIndex: Z_INDEX.MODAL }}>
            <div className="modal-content" style={{
                maxWidth: '640px', width: '100%', margin: '0 auto',
                padding: 'var(--spacing-md)',
                paddingTop: 'calc(var(--spacing-md) + env(safe-area-inset-top))',
                paddingBottom: 'calc(var(--spacing-lg) + env(safe-area-inset-bottom))'
            }}>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 'var(--spacing-md)'
            }}>
                <h2 className="rainbow-gradient" style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '800' }}>
                    {t('stats.title')}
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={onOpenAchievements} className="hover-lift" style={{
                        background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.1))',
                        border: '1px solid rgba(251,191,36,0.3)', borderRadius: '12px',
                        padding: '8px 12px', display: 'flex', alignItems: 'center',
                        gap: '8px', color: '#fbbf24', cursor: 'pointer',
                        minHeight: 'var(--touch-min)'
                    }}>
                        <Award size={18} />
                        <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                           {globalStats.badgeCount}/{BADGE_DEFINITIONS.length}
                        </span>
                    </button>
                    <button onClick={onClose} className="hover-lift glass" style={{
                        background: 'var(--surface-hover)', border: 'none', borderRadius: '50%',
                        width: 'var(--touch-min)', height: 'var(--touch-min)',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer'
                    }}>
                        <X size={22} />
                    </button>
                </div>
            </div>

            {/* ── Filters ────────────────────────────────────────────── */}
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="hover-lift"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'var(--surface-muted)', border: '1px solid var(--border-subtle)',
                        padding: '10px 16px', borderRadius: 'var(--radius-lg)',
                        color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: '700',
                        cursor: 'pointer'
                    }}
                >
                    <Filter size={16} />
                    {t('stats.filters')} ({activeCategories.length})
                </button>
                {showFilters && (
                    <div className="fade-in" style={{
                        marginTop: '8px', padding: '12px', background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-lg)',
                        display: 'flex', flexWrap: 'wrap', gap: '8px'
                    }}>
                        {[
                            { id: 'standard', label: t('common.global_classic'), locked: false },
                            { id: 'weights', label: t('common.global_weights'), locked: !canAccessFeature(FEATURES.WEIGHTS, { isPro }) },
                            { id: 'custom', label: t('common.global_custom'), locked: !canAccessFeature(FEATURES.CUSTOM_EXERCISES, { isPro }) }
                        ].map(cat => (
                            <label key={cat.id} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: activeCategories.includes(cat.id) ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'rgba(255,255,255,0.05)',
                                color: activeCategories.includes(cat.id) ? '#ffffff' : (cat.locked ? 'var(--text-disabled)' : 'var(--text-secondary)'),
                                border: activeCategories.includes(cat.id) ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                                padding: '8px 16px', borderRadius: 'var(--radius-full)',
                                fontSize: '0.8rem', fontWeight: '600', cursor: cat.locked ? 'pointer' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: cat.locked ? 0.6 : 1
                            }}>
                                {cat.locked ? (
                                    <div onClick={(e) => { e.preventDefault(); onOpenStore(); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Lock size={12} color="#fca5a5" />
                                        {cat.label}
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="checkbox"
                                            style={{ display: 'none' }}
                                            checked={activeCategories.includes(cat.id)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                setActiveCategories(prev => {
                                                    if (checked) return [...prev, cat.id];
                                                    if (prev.length === 1) return prev;
                                                    return prev.filter(id => id !== cat.id);
                                                });
                                            }}
                                        />
                                        {cat.label}
                                    </>
                                )}
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Hero: Global Total Reps ─────────────────────────────── */}
            <div className="glass-premium scale-in" style={{
                padding: 'var(--spacing-lg) var(--spacing-md)',
                borderRadius: 'var(--radius-xl)', textAlign: 'center',
                marginBottom: 'var(--spacing-md)',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.12), rgba(236,72,153,0.1))'
            }}>
                <div style={{
                    fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px',
                    color: 'var(--text-secondary)', marginBottom: '4px'
                }}>
                    {t('stats.totalReps')}
                </div>
                <div style={{
                    fontSize: 'clamp(2.5rem, 10vw, 4.5rem)', fontWeight: '900', lineHeight: 1.1,
                    background: 'linear-gradient(135deg, #818cf8, #a78bfa, #f472b6)',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                    {globalTotalReps.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {t('stats.overExercises', { count: exercises?.length || 0, days: totalDays, plural: totalDays !== 1 ? 's' : '' })}
                </div>
            </div>

            {/* ── 4 main stat cards (2×2) ─────────────────────────────── */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px', marginBottom: '10px'
            }}>
                <div className="glass-premium scale-in" style={statCardStyle(
                    streakActive ? 'rgba(239,68,68,0.15)' : 'rgba(120,120,120,0.1)',
                    streakActive ? 'rgba(249,115,22,0.15)' : 'rgba(90,90,90,0.1)'
                )}>
                    <Flame size={24} color={streakActive ? '#f97316' : '#888'}
                        style={{ marginBottom: '6px', opacity: streakActive ? 1 : 0.6 }} />
                    <div style={{
                        fontSize: '1.8rem', fontWeight: '800', lineHeight: 1,
                        color: streakActive ? '#f97316' : '#888'
                    }}>{displayStreak}</div>
                    <div style={statLabelStyle}>{t('stats.currentStreak')}</div>
                </div>
                <div className="glass-premium scale-in" style={{
                    ...statCardStyle('rgba(251,191,36,0.15)', 'rgba(245,158,11,0.15)'),
                    animationDelay: '0.1s'
                }}>
                    <Award size={24} color="#fbbf24" style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fbbf24', lineHeight: 1 }}>{maxStreak}</div>
                    <div style={statLabelStyle}>{t('stats.bestStreak')}</div>
                </div>
                <div className="glass-premium scale-in" style={{
                    ...statCardStyle('rgba(16,185,129,0.15)', 'rgba(5,150,105,0.15)'),
                    animationDelay: '0.2s'
                }}>
                    <Target size={24} color="#10b981" style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981', lineHeight: 1 }}>{totalDays}</div>
                    <div style={statLabelStyle}>{t('stats.completedDays')}</div>
                </div>
                <div className="glass-premium scale-in" style={{
                    ...statCardStyle('rgba(139,92,246,0.15)', 'rgba(109,40,217,0.15)'),
                    animationDelay: '0.3s'
                }}>
                    <TrendingUp size={24} color="#8b5cf6" style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#8b5cf6', lineHeight: 1 }}>{successRate}%</div>
                    <div style={statLabelStyle}>{t('stats.ofYear')}</div>
                </div>
            </div>

            {/* ── 2 secondary stat cards (same style as above) ─────────── */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px', marginBottom: 'var(--spacing-md)'
            }}>
                <div className="glass-premium scale-in" style={{
                    ...statCardStyle('rgba(6,182,212,0.15)', 'rgba(6,182,212,0.08)'),
                    animationDelay: '0.35s'
                }}>
                    <Hash size={24} color="#22d3ee" style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#22d3ee', lineHeight: 1 }}>
                        {totalExerciseCompletions}
                    </div>
                    <div style={statLabelStyle}>{t('stats.exercisesDone')}</div>
                </div>
                <div className="glass-premium scale-in" style={{
                    ...statCardStyle('rgba(236,72,153,0.15)', 'rgba(236,72,153,0.08)'),
                    animationDelay: '0.4s'
                }}>
                    <Star size={24} color="#ec4899" style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ec4899', lineHeight: 1 }}>
                        {perfectDays}
                    </div>
                    <div style={statLabelStyle}>{t('stats.perfectDays')}</div>
                </div>
            </div>

            {/* ── Champion + Best Day highlights ─────────────────────── */}
            {(champion?.totalReps > 0 || bestDayDate) && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: champion?.totalReps > 0 && bestDayDate ? '1fr 1fr' : '1fr',
                    gap: '10px', marginBottom: 'var(--spacing-md)'
                }}>
                    {champion && champion.totalReps > 0 && (
                        <div className="glass-premium scale-in" style={{
                            padding: '14px 12px', borderRadius: 'var(--radius-lg)',
                            background: `linear-gradient(135deg, ${champion.color}18, ${champion.color}08)`,
                            border: `1px solid ${champion.color}30`,
                            textAlign: 'center', animationDelay: '0.5s'
                        }}>
                            <Crown size={20} color="#fbbf24" style={{ marginBottom: '4px' }} />
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '6px', marginBottom: '2px'
                            }}>
                                {ChampionIcon && <ChampionIcon size={16} color={champion.color} />}
                                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: champion.color }}>
                                    {exercises?.find(e => e.id === champion.id)?.label || t('exercises.' + champion.id)}
                                </span>
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                {champion.totalReps.toLocaleString()} {t('common.reps')}
                            </div>
                            <div style={statLabelSmallStyle}>{t('stats.champion')}</div>
                        </div>
                    )}
                    {bestDayDate && (
                        <div className="glass-premium scale-in" style={{
                            padding: '14px 12px', borderRadius: 'var(--radius-lg)',
                            background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06))',
                            border: '1px solid rgba(251,191,36,0.2)',
                            textAlign: 'center', animationDelay: '0.55s'
                        }}>
                            <Trophy size={20} color="#fbbf24" style={{ marginBottom: '4px' }} />
                            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fbbf24', marginBottom: '2px' }}>
                                {formatDate(bestDayDate)}
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                {bestDayReps.toLocaleString()} {t('common.reps')}
                            </div>
                            <div style={{
                                display: 'flex', flexWrap: 'wrap', gap: '4px 8px',
                                justifyContent: 'center', marginTop: '6px'
                            }}>
                                {Object.entries(bestDayExReps).map(([exId, reps]) => {
                                    const ex = exercises?.find(e => e.id === exId);
                                    if (!ex) return null;
                                    return (
                                        <div key={exId} style={{
                                            display: 'flex', alignItems: 'center', gap: '3px',
                                            fontSize: '0.6rem', color: 'var(--text-secondary)',
                                            background: 'rgba(255,255,255,0.05)', padding: '2px 6px',
                                            borderRadius: '4px'
                                        }}>
                                            <div style={{
                                                width: '6px', height: '6px', borderRadius: '2px',
                                                background: ex.color
                                            }} />
                                            <span style={{ fontWeight: '600', color: ex.color }}>{reps}</span>
                                            <span>{ex.label || t('exercises.' + ex.id)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {exercises && exercises.length > 0 && (
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '8px',
                    marginTop: '12px', justifyContent: 'center'
                }}>
                    {exercises.map(ex => (
                        <div key={ex.id} style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            fontSize: '0.6rem', color: 'var(--text-secondary)'
                        }}>
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '2px',
                                background: ex.color
                            }} />
                            <span>{ex.label || t('exercises.' + ex.id)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Monthly Activity Bar Chart ──────────────────────────── */}
            <div className="glass-premium" style={{
                padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                marginBottom: 'var(--spacing-md)',
                background: 'var(--surface-section)'
            }}>
                <h3 style={sectionTitleStyle}>{t('stats.monthlyActivity')}</h3>
                <div style={{
                    display: 'flex', alignItems: 'flex-end', gap: '4px',
                    height: '100px', padding: '0 4px'
                }}>
                    {monthlyActivityTotal.map((count, i) => {
                        const height = count > 0 ? Math.max(8, (count / maxMonthly) * 100) : 0;
                        const isCurrentMonth = i === today.getMonth();

                        const exCounts = exercises.map((ex, exIdx) => ({
                            ex,
                            count: monthlyActivityByExercise[exIdx]?.[i] || 0
                        }));
                        const totalExCount = exCounts.reduce((sum, e) => sum + e.count, 0);

                        return (
                            <div key={i} style={{
                                flex: 1, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: '2px',
                                height: '100%', justifyContent: 'flex-end'
                            }}>
                                {totalExCount > 0 && (
                                    <span style={{
                                        fontSize: '0.5rem', color: 'var(--text-secondary)',
                                        fontWeight: '600', lineHeight: 1.1
                                    }}>{totalExCount}</span>
                                )}
                                <div style={{
                                    width: '100%', borderRadius: '4px 4px 2px 2px',
                                    height: count > 0 ? `${height}%` : '3px',
                                    background: 'var(--surface-muted)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    transition: 'height 0.5s ease'
                                }}>
                                    {exCounts.map(({ ex, count: exCount }, exIdx) => {
                                        if (exCount === 0) return null;
                                        const segmentHeight = (exCount / Math.max(totalExCount, 1)) * 100;
                                        const nextEx = exCounts[exIdx + 1];
                                        const segment = (
                                            <div key={exIdx} style={{
                                                width: '100%',
                                                height: `${segmentHeight}%`,
                                                background: ex.color,
                                                opacity: isCurrentMonth ? 1 : 0.6,
                                                transition: 'height 0.3s ease',
                                                position: 'relative'
                                            }}>
                                                {nextEx && nextEx.count > 0 && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: 0,
                                                        left: 0,
                                                        right: 0,
                                                        height: '15%',
                                                        background: `linear-gradient(to bottom, ${ex.color}88, transparent)`,
                                                        pointerEvents: 'none'
                                                    }} />
                                                )}
                                            </div>
                                        );
                                        return segment;
                                    })}
                                </div>
                                <span style={{
                                    fontSize: '0.55rem',
                                    color: isCurrentMonth ? '#818cf8' : 'var(--text-secondary)',
                                    fontWeight: isCurrentMonth ? '700' : '500'
                                }}>{monthNames[i]}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Equilibre Musculaire + Time-of-day pie + Daily Reps (Lazy Loaded) ────────────────────────── */}
            {chartsReady ? (
                <Suspense fallback={
                    <div className="glass-premium" style={{
                        padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        height: '200px', marginBottom: 'var(--spacing-md)'
                    }}>
                        <div style={{ color: 'var(--text-secondary)' }}>{t('stats.loadingCharts')}</div>
                    </div>
                }>
                    <DailyRepsChart
                        dailyRepsData={dailyRepsData}
                        title={t('stats.dailyReps')}
                        t={t}
                    />
                    <RadarChartPanel 
                        radarData={translatedRadarData} 
                        globalTotalReps={globalTotalReps}
                        title={t('stats.muscleBalance')}
                    />
                    <ConsistencyPieChart 
                        activeData={activeData}
                        trackedCount={trackedCount}
                        title={t('stats.consistency')}
                        subTitle={t('stats.basedOnManual', { count: trackedCount, plural: trackedCount !== 1 ? 's' : '' })}
                        emptyTitle={t('stats.notEnoughData')}
                        emptySub={t('stats.completeForHabits')}
                    />
                </Suspense>
            ) : null}

            {/* ── Per-exercise breakdown ───────────────────────────────── */}
            {exerciseStats.length > 0 && (
                <div className="glass-premium" style={{
                    padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                    marginBottom: 'var(--spacing-md)',
                    background: 'var(--surface-section)'
                }}>
                    <h3 style={sectionTitleStyle}>{t('stats.byExercise')}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {exerciseStats.map(ex => {
                            const ExIcon = ICON_MAP[ex.icon] || Dumbbell;
                            return (
                                <div key={ex.id} style={{
                                    padding: '10px 12px', borderRadius: 'var(--radius-md)',
                                    background: `${ex.color}10`,
                                    border: `1px solid ${ex.color}25`
                                }}>
                                    {/* Top row: icon, label, badges */}
                                    <div style={{
                                        display: 'flex', alignItems: 'center',
                                        gap: '10px', marginBottom: '6px'
                                    }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: `${ex.color}20`, display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                        }}>
                                            <ExIcon size={16} color={ex.color} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}>
                                                <span style={{
                                                    fontSize: '0.85rem', fontWeight: '700',
                                                    color: ex.color
                                                    }}>{t('exercises.' + ex.id)}</span>
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px'
                                                }}>
                                                    {ex.maxStreak > 0 && (
                                                        <span style={{
                                                            fontSize: '0.6rem', color: '#fbbf24',
                                                            background: 'rgba(251,191,36,0.1)',
                                                            padding: '2px 6px', borderRadius: '8px',
                                                            fontWeight: '600'
                                                        }}>
                                                            {t('stats.maxDays', { count: ex.maxStreak })}
                                                        </span>
                                                    )}
                                                    {ex.streak > 0 && (
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', gap: '3px',
                                                            background: ex.streakActive
                                                                ? 'rgba(249,115,22,0.1)'
                                                                : 'rgba(120,120,120,0.08)',
                                                            padding: '2px 8px', borderRadius: '10px'
                                                        }}>
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                opacity: ex.streakActive ? 1 : 0.5,
                                                                filter: ex.streakActive ? 'none' : 'grayscale(1)'
                                                            }}>🔥</span>
                                                            <span style={{
                                                                fontSize: '0.75rem', fontWeight: '700',
                                                                color: ex.streakActive ? '#f97316' : '#888'
                                                            }}>{ex.streak}{t('common.daysAbbr')}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Sub-stats row */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center',
                                                gap: '8px', marginTop: '2px'
                                            }}>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                    {ex.totalReps.toLocaleString()} {t('common.reps')}
                                                </span>
                                                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', opacity: 0.5 }}>·</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                    {ex.daysCompleted}{t('common.daysAbbr')}
                                                </span>
                                                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', opacity: 0.5 }}>·</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                    {ex.completionRate}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Mini progress bar */}
                                    <div style={{
                                        height: '3px', borderRadius: '2px',
                                        background: 'var(--progress-track-thin)', overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            height: '100%', borderRadius: '2px',
                                            width: `${ex.completionRate}%`,
                                            background: `linear-gradient(90deg, ${ex.color}, ${ex.color}88)`,
                                            transition: 'width 0.6s ease'
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Share & Session History ──────────────────────────────── */}
            <div style={{
                display: 'flex', flexDirection: 'column', gap: '10px',
                marginBottom: 'var(--spacing-md)',
            }}>
                {/* Share button */}
                <button
                    onClick={() => setShowShare(true)}
                    className="hover-lift"
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        padding: '14px', borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(139,92,246,0.1))',
                        border: '1px solid rgba(129,140,248,0.2)',
                        color: '#818cf8', fontSize: '0.9rem', fontWeight: 700,
                        cursor: 'pointer', width: '100%',
                    }}
                >
                    <Share2 size={18} />
                    {t('share.shareCard', 'Partager mes statistiques')}
                </button>

                {/* Session history */}
                {sessionHistory.length > 0 && (
                    <div className="glass-premium" style={{
                        padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                        background: 'var(--surface-section)',
                    }}>
                        <h3 style={{
                            ...sectionTitleStyle,
                            display: 'flex', alignItems: 'center', gap: '6px',
                        }}>
                            <Clock size={14} />
                            {t('share.recentSessions', 'S\u00e9ances r\u00e9centes')}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {sessionHistory.slice(0, 10).map((session, i) => {
                                const exercises = session.exercises || [];
                                const hasName = session.name && session.name.trim().length > 0;
                                const dateObj = new Date(session.date);
                                const dateLabel = dateObj.toLocaleDateString(i18n.language, {
                                    day: 'numeric', month: 'short',
                                });
                                return (
                                    <button
                                        key={session.id || i}
                                        onClick={() => setSelectedSession(session)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            padding: '10px 12px', borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            cursor: 'pointer', width: '100%', textAlign: 'left',
                                            transition: 'all 0.15s ease',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                            e.currentTarget.style.borderColor = 'rgba(129,140,248,0.2)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                        }}
                                    >
                                        <span style={{
                                            fontSize: '0.7rem', color: 'var(--text-secondary)',
                                            width: '40px', flexShrink: 0, fontWeight: 500,
                                        }}>
                                            {dateLabel}
                                        </span>
                                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                            {hasName && (
                                                <span style={{
                                                    fontSize: '0.8rem', fontWeight: 600,
                                                    color: 'var(--text-primary)',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                }}>
                                                    {session.name}
                                                </span>
                                            )}
                                            {exercises.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', alignItems: 'center' }}>
                                                    {exercises.map((ex, j) => {
                                                        const ExIcon = ICON_MAP[ex.icon] || Dumbbell;
                                                        return <ExIcon key={ex.id || j} size={13} color={ex.color || '#818cf8'} />;
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <ChevronRight size={14} color="var(--text-secondary)" style={{ opacity: 0.4, flexShrink: 0 }} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Motivational footer ─────────────────────────────────── */}
            <div className="glass slide-up" style={{
                marginTop: '4px', padding: 'var(--spacing-sm) var(--spacing-md)',
                borderRadius: 'var(--radius-lg)', textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(6,182,212,0.1))'
            }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    💪 <strong style={{ color: '#0ea5e9' }}>{t('stats.quote')}</strong>
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', opacity: 0.7 }}>
                    {t('stats.quoteSub')}
                </p>
            </div>

            {/* ── Share Modal (lazy) ───────────────────────────────────── */}
            <Suspense fallback={null}>
                {showShare && (
                    <ShareModal
                        shareHook={shareHook}
                        onClose={() => setShowShare(false)}
                        isPro={isPro}
                    />
                )}
            </Suspense>

            {/* ── Session Detail Modal (lazy) ──────────────────────────── */}
            <Suspense fallback={null}>
                {selectedSession && (
                    <SessionDetailModal
                        session={selectedSession}
                        onClose={() => setSelectedSession(null)}
                        onDelete={handleDeleteSession}
                        stats={computedStats}
                    />
                )}
            </Suspense>
            </div>
        </div>
    );
}

/* ── Style helpers ────────────────────────────────────────────────────── */

const statCardStyle = (bg1, bg2) => ({
    padding: '14px 12px', borderRadius: 'var(--radius-lg)',
    background: `linear-gradient(135deg, ${bg1}, ${bg2})`, textAlign: 'center'
});

const statLabelStyle = {
    fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px'
};

const statLabelSmallStyle = {
    fontSize: 'clamp(0.5rem, 1.2vw, 0.6rem)', color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: '2px'
};

const sectionTitleStyle = {
    marginBottom: 'var(--spacing-sm)', fontSize: '0.85rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '1px',
    color: 'var(--text-secondary)'
};
