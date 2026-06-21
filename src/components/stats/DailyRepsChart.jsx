import React, { useMemo } from 'react';
import LineChart from './charts/LineChart';

export default function DailyRepsChart({ dailyRepsData, title, t }) {
    const data = useMemo(() => (dailyRepsData || []).map(d => ({
        label: d.date.slice(5).replace('-', '/'),
        reps: d.reps,
    })), [dailyRepsData]);

    if (data.length < 2) return null;

    const maxReps = Math.max(...data.map(d => d.reps), 1);

    return (
        <div className="glass-premium chart-card" style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.1), rgba(139,92,246,0.08))' }}>
            <h3 className="chart-title">{title}</h3>
            <LineChart
                data={data}
                series={[{ key: 'reps', color: '#818cf8', name: t('common.reps') }]}
                yMin={0}
                yMax={Math.ceil(maxReps * 1.15)}
                formatValue={(v) => `${v}`}
                dots={false}
            />
        </div>
    );
}
