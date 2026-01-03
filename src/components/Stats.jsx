import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { X, TrendingUp, Award, Flame, Target } from 'lucide-react';

export function Stats({ completions, onClose }) {
    // Process Data: Only count if timeOfDay is NOT null
    const data = [
        { name: 'Morning', value: 0, color: '#f59e0b' },   // Amber
        { name: 'Afternoon', value: 0, color: '#0ea5e9' }, // Sky
        { name: 'Evening', value: 0, color: '#8b5cf6' }    // Violet
    ];

    let trackedCount = 0;
    let totalCompletions = 0;
    let maxStreak = 0;
    let currentStreak = 0;

    // Calculate completions and streaks
    const sortedDates = Object.keys(completions).sort();

    sortedDates.forEach(dateStr => {
        const c = completions[dateStr];
        totalCompletions++;

        if (typeof c === 'object' && c.timeOfDay) {
            if (c.timeOfDay === 'morning') data[0].value++;
            if (c.timeOfDay === 'afternoon') data[1].value++;
            if (c.timeOfDay === 'evening') data[2].value++;
            trackedCount++;
        }
    });

    // Calculate streaks (simplified - checking consecutive dates)
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const year = checkDate.getFullYear();
        const month = String(checkDate.getMonth() + 1).padStart(2, '0');
        const day = String(checkDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        if (completions[dateString]) {
            currentStreak++;
            if (currentStreak > maxStreak) maxStreak = currentStreak;
        } else {
            if (i === 0) currentStreak = 0; // Today not complete yet
            else break;
        }
    }

    const activeData = data.filter(d => d.value > 0);
    const successRate = totalCompletions > 0 ? Math.round((totalCompletions / 365) * 100) : 0;

    return (
        <div className="fade-in" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(5, 5, 5, 0.97)',
            backdropFilter: 'blur(16px)',
            zIndex: 110,
            display: 'flex',
            flexDirection: 'column',
            padding: 'var(--spacing-md)',
            paddingTop: 'calc(var(--spacing-md) + env(safe-area-inset-top))',
            paddingBottom: 'calc(var(--spacing-md) + env(safe-area-inset-bottom))',
            overflowY: 'auto'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)'
            }}>
                <h2 className="rainbow-gradient" style={{
                    margin: 0,
                    fontSize: '2rem',
                    fontWeight: '800'
                }}>
                    Stats
                </h2>
                <button
                    onClick={onClose}
                    className="hover-lift glass"
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    <X size={24} />
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 'var(--spacing-sm)',
                marginBottom: 'var(--spacing-lg)'
            }}>
                {/* Current Streak */}
                <div className="glass-premium scale-in" style={{
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(249, 115, 22, 0.15))',
                    textAlign: 'center'
                }}>
                    <Flame size={28} color="#f97316" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f97316', lineHeight: 1 }}>
                        {currentStreak}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>
                        Current Streak
                    </div>
                </div>

                {/* Best Streak */}
                <div className="glass-premium scale-in" style={{
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.15))',
                    textAlign: 'center',
                    animationDelay: '0.1s'
                }}>
                    <Award size={28} color="#fbbf24" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fbbf24', lineHeight: 1 }}>
                        {maxStreak}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>
                        Best Streak
                    </div>
                </div>

                {/* Total Completions */}
                <div className="glass-premium scale-in" style={{
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15))',
                    textAlign: 'center',
                    animationDelay: '0.2s'
                }}>
                    <Target size={28} color="#10b981" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10b981', lineHeight: 1 }}>
                        {totalCompletions}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>
                        Days Complete
                    </div>
                </div>

                {/* Success Rate */}
                <div className="glass-premium scale-in" style={{
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(109, 40, 217, 0.15))',
                    textAlign: 'center',
                    animationDelay: '0.3s'
                }}>
                    <TrendingUp size={28} color="#8b5cf6" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#8b5cf6', lineHeight: 1 }}>
                        {successRate}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>
                        Of Year
                    </div>
                </div>
            </div>

            {/* Time of Day Distribution */}
            <div className="glass-premium" style={{
                padding: 'var(--spacing-lg)',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(109, 40, 217, 0.1), rgba(139, 92, 246, 0.1))'
            }}>
                <h3 style={{
                    marginBottom: 'var(--spacing-md)',
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: '700'
                }}>
                    ⏰ Consistency Pattern
                </h3>

                {trackedCount > 0 ? (
                    <>
                        <div style={{ width: '100%', height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={activeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={75}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                        animationBegin={0}
                                        animationDuration={800}
                                    >
                                        {activeData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                style={{
                                                    filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.3))'
                                                }}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(18, 18, 20, 0.95)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            backdropFilter: 'blur(10px)'
                                        }}
                                        itemStyle={{ color: 'white', fontWeight: '600' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        wrapperStyle={{
                                            fontSize: '0.85rem',
                                            fontWeight: '600'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <p style={{
                            textAlign: 'center',
                            color: 'var(--text-secondary)',
                            fontSize: '0.8rem',
                            marginTop: 'var(--spacing-xs)',
                            fontStyle: 'italic'
                        }}>
                            Based on {trackedCount} manual completion{trackedCount !== 1 ? 's' : ''}
                        </p>
                    </>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        padding: 'var(--spacing-xl)'
                    }}>
                        <p style={{ fontSize: '1rem', marginBottom: '8px' }}>📊 Not enough data yet</p>
                        <p style={{ fontSize: '0.85rem', opacity: 0.7, lineHeight: '1.5' }}>
                            Complete your daily pushups to see<br />your consistency patterns here!
                        </p>
                        <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: 'var(--spacing-sm)' }}>
                            (Auto-completed days don't count towards habits)
                        </p>
                    </div>
                )}
            </div>

            {/* Motivational Footer */}
            <div className="glass slide-up" style={{
                marginTop: 'var(--spacing-md)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(6, 182, 212, 0.1))'
            }}>
                <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic'
                }}>
                    💪 <strong style={{ color: '#0ea5e9' }}>
                        "Consistency beats perfection"
                    </strong>
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', opacity: 0.7 }}>
                    Keep showing up, one day at a time!
                </p>
            </div>
        </div>
    );
}
