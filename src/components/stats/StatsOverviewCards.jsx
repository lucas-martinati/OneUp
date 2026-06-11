import { useTranslation } from 'react-i18next';
import { TrendingUp, Award, Flame, Target, Hash, Star } from '../../utils/icons';
import { statCardStyle, statLabelStyle } from './statsStyles';

/** Hero total + the six main stat cards of the Stats panel. */
export function StatsOverviewCards({
    onlyCardio, cardioKm, cardioSessionsCount,
    globalTotalReps, exercisesCount, totalDays,
    displayStreak, streakActive, maxStreak, successRate,
    totalExerciseCompletions, perfectDays
}) {
    const { t } = useTranslation();

    return (
        <>
            {/* ── Hero: Global Total Reps ─────────────────────────────── */}
            <div className="glass-premium scale-in" style={{
                padding: 'var(--spacing-lg) var(--spacing-md)',
                borderRadius: 'var(--radius-xl)', textAlign: 'center',
                marginBottom: 'var(--spacing-md)',
                background: onlyCardio && cardioKm !== null ? 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(239,68,68,0.12))' : 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.12), rgba(236,72,153,0.1))'
            }}>
                <div style={{
                    fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px',
                    color: 'var(--text-secondary)', marginBottom: '4px'
                }}>
                    {onlyCardio && cardioKm !== null ? t('cardio.totalDistance', { unit: t('cardio.units.km') }) : t('stats.totalReps')}
                </div>
                <div style={{
                    fontSize: 'clamp(2.5rem, 10vw, 4.5rem)', fontWeight: '900', lineHeight: 1.1,
                    color: onlyCardio && cardioKm !== null ? '#f97316' : '#818cf8'
                }}>
                    {onlyCardio && cardioKm !== null ? cardioKm.toFixed(1) : globalTotalReps.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {onlyCardio && cardioKm !== null ? t('cardio.overSessions', { count: cardioSessionsCount }) : t('stats.overExercises', { count: exercisesCount, days: totalDays, plural: totalDays !== 1 ? 's' : '' })}
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
                    <div style={statLabelStyle}>{t('common.bestStreak')}</div>
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
                    <div style={statLabelStyle}>{t('common.perfectDays')}</div>
                </div>
            </div>
        </>
    );
}
