import { useTranslation } from 'react-i18next';
import { TrendingUp, Award, Flame, Target, Hash, Star } from '@utils/icons';
import { AnimatedNumber } from '@components/ui/AnimatedNumber';

/**
 * A single refined stat card: a tinted icon chip, a bold value and a label,
 * over a neutral glass surface with a soft colored corner glow. Replaces the
 * old fully-colored blocks for a calmer, more premium look.
 */
function StatCard({ icon: Icon, value, format, label, color, dim = false, delay = 0, pending = false }) {
    const c = dim ? '#8a8a93' : color;
    return (
        <div className="glass-premium hover-lift scale-in" style={{
            position: 'relative', overflow: 'hidden',
            padding: '15px 14px', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column', gap: '11px',
            animationDelay: `${delay}s`
        }}>
            {/* Soft accent glow in the corner */}
            <div aria-hidden="true" style={{
                position: 'absolute', top: '-28px', right: '-28px',
                width: '86px', height: '86px', borderRadius: '50%',
                background: `radial-gradient(circle, ${c}33 0%, transparent 70%)`,
                pointerEvents: 'none', opacity: dim ? 0.4 : 1
            }} />
            {/* Icon chip */}
            <div style={{
                width: '38px', height: '38px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${c}1f`, border: `1px solid ${c}3a`, color: c,
                position: 'relative', zIndex: 1
            }}>
                <Icon size={20} />
            </div>
            {/* Value + label */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                    fontSize: 'clamp(1.5rem, 6vw, 1.8rem)', fontWeight: '800', lineHeight: 1,
                    color: 'var(--text-primary)'
                }}>
                    <AnimatedNumber value={value} format={format} pending={pending} />
                </div>
                <div style={{
                    fontSize: 'clamp(0.6rem, 1.5vw, 0.68rem)', color: 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '6px',
                    fontWeight: '600'
                }}>{label}</div>
            </div>
        </div>
    );
}

const intFormat = (v) => v.toLocaleString();
const pctFormat = (v) => `${v}%`;

/** Hero total + the six main stat cards of the Stats panel. */
export function StatsOverviewCards({
    onlyCardio, cardioKm, cardioSessionsCount,
    globalTotalReps, exercisesCount, totalDays,
    displayStreak, streakActive, maxStreak, successRate,
    totalExerciseCompletions, perfectDays, pending = false
}) {
    const { t } = useTranslation();

    const isCardioHero = onlyCardio && cardioKm !== null;
    // Solid colour (not background-clip:text): a gradient-clipped number can flash
    // as a filled rectangle with invisible text when it re-renders on filter change.
    const heroNumberColor = isCardioHero ? '#f97316' : '#818cf8';

    return (
        <>
            {/* ── Hero: Global Total Reps ─────────────────────────────── */}
            <div className="glass-premium scale-in" style={{
                position: 'relative', overflow: 'hidden',
                padding: 'var(--spacing-lg) var(--spacing-md)',
                borderRadius: 'var(--radius-xl)', textAlign: 'center',
                marginBottom: 'var(--spacing-md)',
                border: '1px solid var(--border-subtle)'
            }}>
                {/* Layered ambient glow */}
                <div aria-hidden="true" style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: isCardioHero
                        ? 'radial-gradient(ellipse at 30% 0%, rgba(249,115,22,0.18) 0%, transparent 60%), radial-gradient(ellipse at 80% 120%, rgba(239,68,68,0.14) 0%, transparent 55%)'
                        : 'radial-gradient(ellipse at 25% 0%, rgba(129,140,248,0.20) 0%, transparent 60%), radial-gradient(ellipse at 85% 120%, rgba(236,72,153,0.14) 0%, transparent 55%)'
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2.5px',
                        color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600'
                    }}>
                        {isCardioHero ? t('cardio.totalDistance', { unit: t('cardio.units.km') }) : t('stats.totalReps')}
                    </div>
                    <div style={{
                        fontSize: 'clamp(2.6rem, 11vw, 4.6rem)', fontWeight: '900', lineHeight: 1.05,
                        color: heroNumberColor,
                        letterSpacing: '-1px'
                    }}>
                        <AnimatedNumber
                            value={isCardioHero ? cardioKm : globalTotalReps}
                            format={isCardioHero ? (v) => v.toFixed(1) : intFormat}
                            pending={pending}
                        />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        {isCardioHero ? t('cardio.overSessions', { count: cardioSessionsCount }) : t('stats.overExercises', { count: exercisesCount, days: totalDays, plural: totalDays !== 1 ? 's' : '' })}
                    </div>
                </div>
            </div>

            {/* ── Six stat cards (2 columns) ──────────────────────────── */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px', marginBottom: 'var(--spacing-md)'
            }}>
                <StatCard icon={Flame} value={displayStreak} format={intFormat} label={t('stats.currentStreak')}
                    color="#f97316" dim={!streakActive} delay={0} pending={pending} />
                <StatCard icon={Award} value={maxStreak} format={intFormat} label={t('common.bestStreak')}
                    color="#fbbf24" delay={0.05} pending={pending} />
                <StatCard icon={Target} value={totalDays} format={intFormat} label={t('stats.completedDays')}
                    color="#10b981" delay={0.1} pending={pending} />
                <StatCard icon={TrendingUp} value={successRate} format={pctFormat} label={t('stats.ofYear')}
                    color="#8b5cf6" delay={0.15} pending={pending} />
                <StatCard icon={Hash} value={totalExerciseCompletions} format={intFormat} label={t('stats.exercisesDone')}
                    color="#22d3ee" delay={0.2} pending={pending} />
                <StatCard icon={Star} value={perfectDays} format={intFormat} label={t('common.perfectDays')}
                    color="#ec4899" delay={0.25} pending={pending} />
            </div>
        </>
    );
}
