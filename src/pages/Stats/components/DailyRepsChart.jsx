import React, { useMemo } from 'react';
import LineChart from './charts/LineChart';
import { Card } from '@components/ui';

export default function DailyRepsChart({ dailyRepsData, title, t }) {
    const data = useMemo(() => (dailyRepsData || []).map(d => ({
        label: d.date.slice(5).replace('-', '/'),
        reps: d.reps,
    })), [dailyRepsData]);

    if (data.length < 2) return null;

    const maxReps = Math.max(...data.map(d => d.reps), 1);

    return (
        <Card variant="premium" className="chart-card">
            <h3 className="chart-title">{title}</h3>
            <LineChart
                data={data}
                series={[{ key: 'reps', color: '#818cf8', name: t('common.reps') }]}
                yMin={0}
                yMax={Math.ceil(maxReps * 1.15)}
                formatValue={(v) => `${v}`}
                dots={false}
            />
        </Card>
    );
}
