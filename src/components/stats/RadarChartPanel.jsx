import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

export default function RadarChartPanel({ radarData, globalTotalReps, title }) {
    if (radarData.length <= 2 || globalTotalReps <= 0) return null;
    return (
        <div className="glass-premium" style={{
            padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            marginBottom: 'var(--spacing-md)',
            background: 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(16,185,129,0.1))'
        }}>
            <h3 style={{ marginBottom: 'var(--spacing-sm)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', textAlign: 'center', width: '100%' }}>
                {title}
            </h3>
            <div style={{ width: '100%', height: '220px', minHeight: '220px' }}>
                <ResponsiveContainer width="100%" height={220} debounce={100}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.2)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar name="Reps" dataKey="reps" stroke="#10b981" fill="#34d399" fillOpacity={0.5} />
                        <Tooltip contentStyle={{
                            background: 'var(--tooltip-bg)', border: '1px solid var(--border-default)',
                            borderRadius: '8px'
                        }} itemStyle={{ color: '#10b981', fontWeight: '800' }} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
