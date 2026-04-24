import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function DailyRepsChart({ dailyRepsData, title, t }) {
    if (!dailyRepsData || dailyRepsData.length < 2) return null;

    const data = dailyRepsData.map(d => ({
        ...d,
        label: d.date.slice(5).replace('-', '/'),
    }));

    const maxReps = Math.max(...data.map(d => d.reps), 1);

    return (
        <div className="glass-premium chart-card" style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.1), rgba(139,92,246,0.08))' }}>
            <h3 className="chart-title">
                {title}
            </h3>
            <div className="chart-wrapper-overflow">
                <ResponsiveContainer width="100%" height={200} debounce={100}>
                    <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis
                            dataKey="label"
                            tick={{ fill: 'var(--text-secondary)', fontSize: 9, fontWeight: 500 }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={[0, Math.ceil(maxReps * 1.15)]}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                            width={38}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--tooltip-bg)',
                                border: '1px solid var(--border-default)',
                                borderRadius: '8px'
                            }}
                            labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.7rem' }}
                            itemStyle={{ color: '#818cf8', fontWeight: 800 }}
                            formatter={(value) => [`${value} ${t('common.reps')}`, null]}
                            labelFormatter={(label) => label}
                        />
                        <Line
                            type="monotone"
                            dataKey="reps"
                            stroke="#818cf8"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }}
                            animationDuration={800}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
