import React from 'react';
import DonutChart from './charts/DonutChart';
import { Card, SectionTitle, EmptyState } from '@components/ui';

export default function ConsistencyPieChart({ activeData, trackedCount, title, subTitle, emptyTitle, emptySub }) {
    return (
        <Card variant="premium" className="chart-card" style={{ background: 'linear-gradient(135deg, rgba(109,40,217,0.1), rgba(139,92,246,0.1))' }}>
            <SectionTitle level="h3" className="chart-title">{title}</SectionTitle>

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
                <EmptyState 
                    icon="PieChart"
                    title={emptyTitle}
                    description={emptySub}
                    style={{ padding: 'var(--space-8)' }}
                />
            )}
        </Card>
    );
}
