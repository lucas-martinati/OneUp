import React from 'react';
import DonutChart from './charts/DonutChart';

export default function ConsistencyPieChart({ activeData, trackedCount, title, subTitle, emptyTitle, emptySub }) {
    return (
        <div className="glass-premium chart-card" style={{ background: 'linear-gradient(135deg, rgba(109,40,217,0.1), rgba(139,92,246,0.1))' }}>
            <h3 className="chart-title">{title}</h3>

            {trackedCount > 0 ? (
                <>
                    <DonutChart
                        data={activeData}
                        centerLabel={{ value: trackedCount, label: '' }}
                    />
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
