import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { X } from 'lucide-react';

export function Stats({ completions, onClose }) {
    // Process Data: Only count if timeOfDay is NOT null
    const data = [
        { name: 'Morning', value: 0, color: '#f59e0b' },   // Amber
        { name: 'Afternoon', value: 0, color: '#0ea5e9' }, // Sky
        { name: 'Evening', value: 0, color: '#8b5cf6' }    // Violet
    ];

    let trackedCount = 0;

    Object.values(completions).forEach(c => {
        // If c is boolean (legacy), invalid, or timeOfDay is null (backfill), skip specific slot stats
        // But maybe we want a "Total" generic stat? 
        // The request was for "time of day detection... auto fill... don't skew results".
        // So backfilled (null) should simply not appear in the Pie Chart.
        if (typeof c === 'object' && c.timeOfDay) {
            if (c.timeOfDay === 'morning') data[0].value++;
            if (c.timeOfDay === 'afternoon') data[1].value++;
            if (c.timeOfDay === 'evening') data[2].value++;
            trackedCount++;
        }
    });

    const activeData = data.filter(d => d.value > 0);

    return (
        <div className="fade-in" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(5, 5, 5, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 110,
            display: 'flex',
            flexDirection: 'column',
            padding: 'var(--spacing-lg)',
            overflowY: 'auto'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)'
            }}>
                <h2 className="title-gradient" style={{ margin: 0 }}>Stats</h2>
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
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

            <div className="glass" style={{
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start'
            }}>
                <h3 style={{ marginBottom: '10px', fontSize: '1.2rem' }}>Consistency</h3>

                {trackedCount > 0 ? (
                    <div style={{ width: '100%', height: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={activeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {activeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#1c1c1c', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: 'white' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '-10px' }}>
                            Based on {trackedCount} manual completions
                        </p>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <p>Not enough data yet.</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            (Auto-completed days don't count towards habits)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
