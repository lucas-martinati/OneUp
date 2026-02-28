import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { X, TrendingUp, Award, Flame, Target, Trophy, Activity, Hash, Crown } from 'lucide-react';
import { Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints } from 'lucide-react';
import { getLocalDateStr, calculateExerciseStreak, isDayDoneFromCompletions } from '../utils/dateUtils';

const ICON_MAP = { Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints };

export function Stats({ completions, exercises, onClose }) {
    const todayStr = getLocalDateStr(new Date());
    const today = new Date(todayStr);
    const utcStart = Date.UTC(today.getFullYear(), 0, 1);

    // ── Sorted dates ─────────────────────────────────────────────────────
    const sortedDates = Object.keys(completions).sort();

    // ── Time-of-day pie chart ────────────────────────────────────────────
    const pieData = [
        { name: 'Matin', value: 0, color: '#f59e0b' },
        { name: 'Après-midi', value: 0, color: '#0ea5e9' },
        { name: 'Soir', value: 0, color: '#8b5cf6' }
    ];
    let trackedCount = 0;
    let totalDays = 0;
    let totalExerciseCompletions = 0;

    // ── Best day tracking ────────────────────────────────────────────────
    let bestDayDate = null;
    let bestDayExCount = 0;
    let bestDayReps = 0;

    // ── Monthly activity ─────────────────────────────────────────────────
    const monthlyActivity = Array(12).fill(0);

    // ── First active day ─────────────────────────────────────────────────
    let firstActiveDate = null;

    sortedDates.forEach(dateStr => {
        const day = completions[dateStr];
        if (!day) return;

        const anyDone = isDayDoneFromCompletions(completions, dateStr);
        if (anyDone) {
            totalDays++;
            if (!firstActiveDate) firstActiveDate = dateStr;

            // Monthly activity
            const monthIdx = new Date(dateStr).getMonth();
            monthlyActivity[monthIdx]++;

            // Count individual exercise completions + best day
            let dayExCount = 0;
            let dayReps = 0;
            const current = new Date(dateStr);
            const utcCurrent = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
            const dayNum = Math.floor((utcCurrent - utcStart) / (1000 * 60 * 60 * 24)) + 1;

            for (const [exId, exData] of Object.entries(day)) {
                if (exData?.isCompleted) {
                    totalExerciseCompletions++;
                    dayExCount++;
                    const ex = exercises?.find(e => e.id === exId);
                    if (ex) {
                        dayReps += Math.max(1, Math.ceil(dayNum * ex.multiplier));
                    }
                }
            }

            if (dayExCount > bestDayExCount || (dayExCount === bestDayExCount && dayReps > bestDayReps)) {
                bestDayDate = dateStr;
                bestDayExCount = dayExCount;
                bestDayReps = dayReps;
            }

            // Pie chart time-of-day (one entry per day)
            for (const exData of Object.values(day)) {
                if (exData?.isCompleted && exData.timeOfDay) {
                    if (exData.timeOfDay === 'morning') pieData[0].value++;
                    else if (exData.timeOfDay === 'afternoon') pieData[1].value++;
                    else if (exData.timeOfDay === 'evening') pieData[2].value++;
                    trackedCount++;
                    break;
                }
            }
        }
    });

    // ── Overall streaks ──────────────────────────────────────────────────
    const calcGlobalStreak = () => {
        let streak = 0;
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            if (isDayDoneFromCompletions(completions, getLocalDateStr(d))) streak++;
            else break;
        }
        return streak;
    };

    const calcMaxGlobalStreak = () => {
        let max = 0, temp = 0;
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            if (isDayDoneFromCompletions(completions, getLocalDateStr(d))) {
                temp++;
                if (temp > max) max = temp;
            } else {
                temp = 0;
            }
        }
        return max;
    };

    const currentStreak = calcGlobalStreak();
    const maxStreak = calcMaxGlobalStreak();
    const successRate = totalDays > 0 ? Math.round((totalDays / 365) * 100) : 0;
    const activeData = pieData.filter(d => d.value > 0);

    // Duolingo-style streak display
    const todayDone = isDayDoneFromCompletions(completions, todayStr);
    const yesterdayStreak = (() => {
        let streak = 0;
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        for (let i = 0; i < 365; i++) {
            const d = new Date(yesterday);
            d.setDate(d.getDate() - i);
            if (isDayDoneFromCompletions(completions, getLocalDateStr(d))) streak++;
            else break;
        }
        return streak;
    })();
    const displayStreak = todayDone ? currentStreak : yesterdayStreak;
    const streakActive = todayDone;

    // ── Weekly average ───────────────────────────────────────────────────
    const weeksSinceStart = firstActiveDate
        ? Math.max(1, Math.ceil((today - new Date(firstActiveDate)) / (7 * 24 * 60 * 60 * 1000)))
        : 1;
    const weeklyAverage = totalDays > 0 ? (totalDays / weeksSinceStart).toFixed(1) : '0';

    // ── Per-exercise stats ───────────────────────────────────────────────
    const exerciseStats = exercises ? exercises.map(ex => {
        let totalReps = 0;
        let daysCompleted = 0;
        sortedDates.forEach(dateStr => {
            const exData = completions[dateStr]?.[ex.id];
            if (exData?.isCompleted) {
                daysCompleted++;
                const current = new Date(dateStr);
                const utcCurrent = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
                const dayNum = Math.floor((utcCurrent - utcStart) / (1000 * 60 * 60 * 24)) + 1;
                totalReps += Math.max(1, Math.ceil(dayNum * ex.multiplier));
            }
        });

        // Current streak (Duolingo-style)
        const streak = calculateExerciseStreak(completions, todayStr, ex.id);
        const exDoneToday = completions[todayStr]?.[ex.id]?.isCompleted || false;
        const yesterdayExStreak = (() => {
            const d = new Date(today);
            d.setDate(d.getDate() - 1);
            return calculateExerciseStreak(completions, getLocalDateStr(d), ex.id);
        })();
        const displayExStreak = exDoneToday ? streak : yesterdayExStreak;
        const exStreakActive = exDoneToday;

        // Max streak per exercise
        let maxExStreak = 0, tempStreak = 0;
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            if (completions[getLocalDateStr(d)]?.[ex.id]?.isCompleted) {
                tempStreak++;
                if (tempStreak > maxExStreak) maxExStreak = tempStreak;
            } else {
                tempStreak = 0;
            }
        }

        // Completion rate (out of active days)
        const completionRate = totalDays > 0 ? Math.round((daysCompleted / totalDays) * 100) : 0;

        return {
            ...ex, totalReps, daysCompleted,
            streak: displayExStreak, streakActive: exStreakActive,
            maxStreak: maxExStreak, completionRate
        };
    }) : [];

    // ── Global total reps ────────────────────────────────────────────────
    const globalTotalReps = exerciseStats.reduce((sum, ex) => sum + ex.totalReps, 0);

    // ── Champion exercise (most total reps) ──────────────────────────────
    const champion = exerciseStats.length > 0
        ? exerciseStats.reduce((best, ex) => ex.totalReps > best.totalReps ? ex : best, exerciseStats[0])
        : null;
    const ChampionIcon = champion ? (ICON_MAP[champion.icon] || Dumbbell) : null;

    // ── Monthly bar chart max ────────────────────────────────────────────
    const maxMonthly = Math.max(...monthlyActivity, 1);
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    // ── Format date helper ───────────────────────────────────────────────
    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="fade-in" style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'var(--overlay-bg)', backdropFilter: 'blur(16px)', zIndex: 110,
            display: 'flex', flexDirection: 'column', padding: 'var(--spacing-md)',
            paddingTop: 'calc(var(--spacing-md) + env(safe-area-inset-top))',
            paddingBottom: 'calc(var(--spacing-md) + env(safe-area-inset-bottom))',
            overflowY: 'auto'
        }}>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 'var(--spacing-md)'
            }}>
                <h2 className="rainbow-gradient" style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>
                    Statistiques
                </h2>
                <button onClick={onClose} className="hover-lift glass" style={{
                    background: 'var(--surface-hover)', border: 'none', borderRadius: '50%',
                    width: '40px', height: '40px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer'
                }}>
                    <X size={22} />
                </button>
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
                    Reps totales
                </div>
                <div style={{
                    fontSize: 'clamp(2.5rem, 10vw, 4.5rem)', fontWeight: '900', lineHeight: 1.1,
                    background: 'linear-gradient(135deg, #818cf8, #a78bfa, #f472b6)',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                    {globalTotalReps.toLocaleString('fr-FR')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    sur {exercises?.length || 0} exercices · {totalDays} jour{totalDays !== 1 ? 's' : ''} d'effort
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
                    <div style={statLabelStyle}>Série actuelle</div>
                </div>
                <div className="glass-premium scale-in" style={{
                    ...statCardStyle('rgba(251,191,36,0.15)', 'rgba(245,158,11,0.15)'),
                    animationDelay: '0.1s'
                }}>
                    <Award size={24} color="#fbbf24" style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fbbf24', lineHeight: 1 }}>{maxStreak}</div>
                    <div style={statLabelStyle}>Meilleure série</div>
                </div>
                <div className="glass-premium scale-in" style={{
                    ...statCardStyle('rgba(16,185,129,0.15)', 'rgba(5,150,105,0.15)'),
                    animationDelay: '0.2s'
                }}>
                    <Target size={24} color="#10b981" style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981', lineHeight: 1 }}>{totalDays}</div>
                    <div style={statLabelStyle}>Jours complétés</div>
                </div>
                <div className="glass-premium scale-in" style={{
                    ...statCardStyle('rgba(139,92,246,0.15)', 'rgba(109,40,217,0.15)'),
                    animationDelay: '0.3s'
                }}>
                    <TrendingUp size={24} color="#8b5cf6" style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#8b5cf6', lineHeight: 1 }}>{successRate}%</div>
                    <div style={statLabelStyle}>De l'année</div>
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
                    <div style={statLabelStyle}>Exercices faits</div>
                </div>
                <div className="glass-premium scale-in" style={{
                    ...statCardStyle('rgba(16,185,129,0.15)', 'rgba(16,185,129,0.08)'),
                    animationDelay: '0.4s'
                }}>
                    <Activity size={24} color="#34d399" style={{ marginBottom: '6px' }} />
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#34d399', lineHeight: 1 }}>
                        {weeklyAverage}
                    </div>
                    <div style={statLabelStyle}>Jours / sem.</div>
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
                                    {champion.label}
                                </span>
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                {champion.totalReps.toLocaleString('fr-FR')} reps
                            </div>
                            <div style={statLabelSmallStyle}>Champion</div>
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
                                {bestDayReps.toLocaleString('fr-FR')} reps
                            </div>
                            <div style={statLabelSmallStyle}>
                                {bestDayExCount}/{exercises?.length || 0} exercices · Meilleur jour
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Monthly Activity Bar Chart ──────────────────────────── */}
            <div className="glass-premium" style={{
                padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                marginBottom: 'var(--spacing-md)',
                background: 'var(--surface-section)'
            }}>
                <h3 style={sectionTitleStyle}>📅 Activité mensuelle</h3>
                <div style={{
                    display: 'flex', alignItems: 'flex-end', gap: '4px',
                    height: '80px', padding: '0 4px'
                }}>
                    {monthlyActivity.map((count, i) => {
                        const height = count > 0 ? Math.max(8, (count / maxMonthly) * 100) : 0;
                        const isCurrentMonth = i === today.getMonth();
                        return (
                            <div key={i} style={{
                                flex: 1, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: '4px',
                                height: '100%', justifyContent: 'flex-end'
                            }}>
                                {count > 0 && (
                                    <span style={{
                                        fontSize: '0.55rem', color: 'var(--text-secondary)',
                                        fontWeight: '600'
                                    }}>{count}</span>
                                )}
                                <div style={{
                                    width: '100%', borderRadius: '4px 4px 2px 2px',
                                    height: count > 0 ? `${height}%` : '3px',
                                    background: count > 0
                                        ? isCurrentMonth
                                            ? 'linear-gradient(180deg, #818cf8, #6366f1)'
                                            : 'linear-gradient(180deg, rgba(129,140,248,0.5), rgba(99,102,241,0.3))'
                                        : 'var(--surface-muted)',
                                    transition: 'height 0.5s ease'
                                }} />
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

            {/* ── Per-exercise breakdown ───────────────────────────────── */}
            {exerciseStats.length > 0 && (
                <div className="glass-premium" style={{
                    padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                    marginBottom: 'var(--spacing-md)',
                background: 'var(--surface-section)'
            }}>
                <h3 style={sectionTitleStyle}>Par exercice</h3>
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
                                                }}>{ex.label}</span>
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
                                                            max {ex.maxStreak}j
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
                                                            }}>{ex.streak}j</span>
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
                                                    {ex.totalReps.toLocaleString('fr-FR')} reps
                                                </span>
                                                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', opacity: 0.5 }}>·</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                    {ex.daysCompleted}j
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

            {/* ── Time-of-day pie ─────────────────────────────────────── */}
            <div className="glass-premium" style={{
                padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                marginBottom: 'var(--spacing-md)',
                background: 'linear-gradient(135deg, rgba(109,40,217,0.1), rgba(139,92,246,0.1))'
            }}>
                <h3 style={{ ...sectionTitleStyle, textAlign: 'center', width: '100%' }}>
                    ⏰ Consistance
                </h3>

                {trackedCount > 0 ? (
                    <>
                        <div style={{ width: '100%', height: '200px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={activeData} cx="50%" cy="50%"
                                        innerRadius={45} outerRadius={68}
                                        paddingAngle={4} dataKey="value" stroke="none"
                                        animationBegin={0} animationDuration={800}>
                                        {activeData.map((entry, idx) => (
                                            <Cell key={`cell-${idx}`} fill={entry.color}
                                                style={{ filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.3))' }} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{
                                        background: 'var(--tooltip-bg)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: '8px', backdropFilter: 'blur(10px)'
                                    }} itemStyle={{ color: 'var(--text-primary)', fontWeight: '600' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle"
                                        wrapperStyle={{ fontSize: '0.8rem', fontWeight: '600' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <p style={{
                            textAlign: 'center', color: 'var(--text-secondary)',
                            fontSize: '0.7rem', marginTop: '4px', fontStyle: 'italic'
                        }}>
                            Basé sur {trackedCount} journée{trackedCount !== 1 ? 's' : ''} manuelles
                        </p>
                    </>
                ) : (
                    <div style={{
                        textAlign: 'center', color: 'var(--text-secondary)',
                        padding: 'var(--spacing-lg)'
                    }}>
                        <p style={{ fontSize: '0.9rem', marginBottom: '6px' }}>
                            📊 Pas encore assez de données
                        </p>
                        <p style={{ fontSize: '0.78rem', opacity: 0.7, lineHeight: '1.5' }}>
                            Complete tes exercices quotidiens pour voir<br />tes habitudes ici !
                        </p>
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
                    💪 <strong style={{ color: '#0ea5e9' }}>"La régularité bat la perfection"</strong>
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', opacity: 0.7 }}>
                    Montre-toi chaque jour, un pas à la fois !
                </p>
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
    fontSize: '0.65rem', color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '3px'
};

const statLabelSmallStyle = {
    fontSize: '0.55rem', color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.3px', marginTop: '2px'
};

const sectionTitleStyle = {
    marginBottom: 'var(--spacing-sm)', fontSize: '0.85rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '1px',
    color: 'var(--text-secondary)'
};
