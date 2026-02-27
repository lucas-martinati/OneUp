import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { X, TrendingUp, Award, Flame, Target } from 'lucide-react';
import { Dumbbell, ArrowDownUp, ArrowUp, Zap } from 'lucide-react';
import { getLocalDateStr, calculateExerciseStreak, isDayDoneFromCompletions } from '../utils/dateUtils';

const ICON_MAP = { Dumbbell, ArrowDownUp, ArrowUp, Zap };

export function Stats({ completions, exercises, onClose }) {
    const todayStr = getLocalDateStr(new Date());

    // ── Time-of-day pie chart ──────────────────────────────────────────────
    const pieData = [
        { name: 'Matin', value: 0, color: '#f59e0b' },
        { name: 'Après-midi', value: 0, color: '#0ea5e9' },
        { name: 'Soir', value: 0, color: '#8b5cf6' }
    ];
    let trackedCount = 0;
    let totalDays = 0;

    const sortedDates = Object.keys(completions).sort();
    sortedDates.forEach(dateStr => {
        const day = completions[dateStr];
        if (!day) return;

        // Count day as done if any exercise is done
        const anyDone = isDayDoneFromCompletions(completions, dateStr);
        if (anyDone) {
            totalDays++;
            // Find first exercise with a timeOfDay for the pie
            for (const exData of Object.values(day)) {
                if (exData?.isCompleted && exData.timeOfDay) {
                    if (exData.timeOfDay === 'morning') pieData[0].value++;
                    else if (exData.timeOfDay === 'afternoon') pieData[1].value++;
                    else if (exData.timeOfDay === 'evening') pieData[2].value++;
                    trackedCount++;
                    break; // one entry per day for the pie
                }
            }
        }
    });

    // ── Overall streaks ───────────────────────────────────────────────────
    const calcGlobalStreak = () => {
        let streak = 0;
        const today = new Date(todayStr);
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const s = getLocalDateStr(d);
            if (isDayDoneFromCompletions(completions, s)) streak++;
            else break;
        }
        return streak;
    };

    const calcMaxGlobalStreak = () => {
        let max = 0, temp = 0;
        for (let i = 0; i < 365; i++) {
            const d = new Date();
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

    // ── Per-exercise stats (compute reps from daily goals on completed days) ──
    const startDate = `${new Date().getFullYear()}-01-01`;
    const utcStart = Date.UTC(new Date().getFullYear(), 0, 1);

    const exerciseStats = exercises ? exercises.map(ex => {
        let totalReps = 0;
        sortedDates.forEach(dateStr => {
            const exData = completions[dateStr]?.[ex.id];
            if (exData?.isCompleted) {
                const current = new Date(dateStr);
                const utcCurrent = Date.UTC(current.getFullYear(), current.getMonth(), current.getDate());
                const dayNum = Math.floor((utcCurrent - utcStart) / (1000 * 60 * 60 * 24)) + 1;
                totalReps += Math.max(1, Math.ceil(dayNum * ex.multiplier));
            }
        });
        const streak = calculateExerciseStreak(completions, todayStr, ex.id);
        return { ...ex, totalReps, streak };
    }) : [];

    return (
        <div className="fade-in" style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(5, 5, 5, 0.97)', backdropFilter: 'blur(16px)', zIndex: 110,
            display: 'flex', flexDirection: 'column', padding: 'var(--spacing-md)',
            paddingTop: 'calc(var(--spacing-md) + env(safe-area-inset-top))',
            paddingBottom: 'calc(var(--spacing-md) + env(safe-area-inset-bottom))',
            overflowY: 'auto'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 'var(--spacing-lg)'
            }}>
                <h2 className="rainbow-gradient" style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>
                    Statistiques
                </h2>
                <button onClick={onClose} className="hover-lift glass" style={{
                    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                    width: '44px', height: '44px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white', cursor: 'pointer'
                }}>
                    <X size={24} />
                </button>
            </div>

            {/* Global stat cards */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)'
            }}>
                <div className="glass-premium scale-in" style={statCardStyle('rgba(239,68,68,0.15)', 'rgba(249,115,22,0.15)')}>
                    <Flame size={28} color="#f97316" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f97316', lineHeight: 1 }}>{currentStreak}</div>
                    <div style={statLabelStyle}>Série actuelle</div>
                </div>
                <div className="glass-premium scale-in" style={{ ...statCardStyle('rgba(251,191,36,0.15)', 'rgba(245,158,11,0.15)'), animationDelay: '0.1s' }}>
                    <Award size={28} color="#fbbf24" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fbbf24', lineHeight: 1 }}>{maxStreak}</div>
                    <div style={statLabelStyle}>Meilleure série</div>
                </div>
                <div className="glass-premium scale-in" style={{ ...statCardStyle('rgba(16,185,129,0.15)', 'rgba(5,150,105,0.15)'), animationDelay: '0.2s' }}>
                    <Target size={28} color="#10b981" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981', lineHeight: 1 }}>{totalDays}</div>
                    <div style={statLabelStyle}>Jours complétés</div>
                </div>
                <div className="glass-premium scale-in" style={{ ...statCardStyle('rgba(139,92,246,0.15)', 'rgba(109,40,217,0.15)'), animationDelay: '0.3s' }}>
                    <TrendingUp size={28} color="#8b5cf6" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#8b5cf6', lineHeight: 1 }}>{successRate}%</div>
                    <div style={statLabelStyle}>De l'année</div>
                </div>
            </div>

            {/* Per-exercise breakdown */}
            {exerciseStats.length > 0 && (
                <div className="glass-premium" style={{
                    padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                    marginBottom: 'var(--spacing-lg)',
                    background: 'linear-gradient(135deg, rgba(15,15,20,0.8), rgba(25,25,35,0.8))'
                }}>
                    <h3 style={{
                        marginBottom: 'var(--spacing-sm)', fontSize: '1rem', fontWeight: '700',
                        textTransform: 'uppercase', letterSpacing: '1px',
                        color: 'var(--text-secondary)'
                    }}>Par exercice</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {exerciseStats.map(ex => {
                            const ExIcon = ICON_MAP[ex.icon] || Dumbbell;
                            return (
                                <div key={ex.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '10px 12px', borderRadius: 'var(--radius-md)',
                                    background: `${ex.color}10`,
                                    border: `1px solid ${ex.color}30`
                                }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%',
                                        background: `${ex.color}20`, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <ExIcon size={18} color={ex.color} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: ex.color }}>
                                            {ex.label}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {ex.totalReps} reps totales
                                        </div>
                                    </div>
                                    {ex.streak > 0 && (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            background: 'rgba(249,115,22,0.1)', padding: '4px 10px',
                                            borderRadius: '12px'
                                        }}>
                                            <span style={{ fontSize: '0.8rem' }}>🔥</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f97316' }}>
                                                {ex.streak}j
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Time-of-day pie */}
            <div className="glass-premium" style={{
                padding: 'var(--spacing-lg)', borderRadius: 'var(--radius-xl)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(109,40,217,0.1), rgba(139,92,246,0.1))'
            }}>
                <h3 style={{
                    marginBottom: 'var(--spacing-md)', fontSize: '1.1rem', textAlign: 'center',
                    background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    fontWeight: '700'
                }}>⏰ Consistance</h3>

                {trackedCount > 0 ? (
                    <>
                        <div style={{ width: '100%', height: '220px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={activeData} cx="50%" cy="50%"
                                        innerRadius={50} outerRadius={72}
                                        paddingAngle={4} dataKey="value" stroke="none"
                                        animationBegin={0} animationDuration={800}>
                                        {activeData.map((entry, idx) => (
                                            <Cell key={`cell-${idx}`} fill={entry.color}
                                                style={{ filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.3))' }} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{
                                        background: 'rgba(18,18,20,0.95)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px', backdropFilter: 'blur(10px)'
                                    }} itemStyle={{ color: 'white', fontWeight: '600' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle"
                                        wrapperStyle={{ fontSize: '0.85rem', fontWeight: '600' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '8px', fontStyle: 'italic' }}>
                            Basé sur {trackedCount} journée{trackedCount !== 1 ? 's' : ''} manuelles
                        </p>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 'var(--spacing-xl)' }}>
                        <p style={{ fontSize: '1rem', marginBottom: '8px' }}>📊 Pas encore assez de données</p>
                        <p style={{ fontSize: '0.82rem', opacity: 0.7, lineHeight: '1.5' }}>
                            Complete tes exercices quotidiens pour voir<br />tes habitudes ici !
                        </p>
                    </div>
                )}
            </div>

            {/* Motivational footer */}
            <div className="glass slide-up" style={{
                marginTop: 'var(--spacing-md)', padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-lg)', textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(6,182,212,0.1))'
            }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    💪 <strong style={{ color: '#0ea5e9' }}>"La régularité bat la perfection"</strong>
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', opacity: 0.7 }}>
                    Montre-toi chaque jour, un pas à la fois !
                </p>
            </div>
        </div>
    );
}

const statCardStyle = (bg1, bg2) => ({
    padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)',
    background: `linear-gradient(135deg, ${bg1}, ${bg2})`, textAlign: 'center'
});

const statLabelStyle = {
    fontSize: '0.72rem', color: 'var(--text-secondary)',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px'
};
