import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export default function ConsistencyPieChart({ activeData, trackedCount, title, subTitle, emptyTitle, emptySub }) {
    return (
        <div className="glass-premium" style={{
            padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            marginBottom: 'var(--spacing-md)',
            background: 'linear-gradient(135deg, rgba(109,40,217,0.1), rgba(139,92,246,0.1))'
        }}>
            <h3 style={{ marginBottom: 'var(--spacing-sm)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', textAlign: 'center', width: '100%' }}>
                {title}
            </h3>

            {trackedCount > 0 ? (
                <>
                    <div style={{ width: '100%', minHeight: '180px' }}>
                        <ResponsiveContainer width="100%" height={180} minWidth={0} minHeight={0} debounce={100}>
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
                                    borderRadius: '8px'
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
                        {subTitle}
                    </p>
                </>
            ) : (
                <div style={{
                    textAlign: 'center', color: 'var(--text-secondary)',
                    padding: 'var(--spacing-lg)'
                }}>
                    <p style={{ fontSize: '0.9rem', marginBottom: '6px' }}>{emptyTitle}</p>
                    <p style={{ fontSize: '0.78rem', opacity: 0.7, lineHeight: '1.5' }}>{emptySub}</p>
                </div>
            )}
        </div>
    );
}
