import React from 'react';
import { Card } from '@components/ui';
import RadarChart from './charts/RadarChart';

export default function RadarChartPanel({ radarData, globalTotalReps, title }) {
    if (radarData.length <= 2 || globalTotalReps <= 0) return null;
    return (
        <Card variant="premium" color="var(--color-emerald)" className="chart-card">
            <h3 className="chart-title">{title}</h3>
            <RadarChart data={radarData} />
        </Card>
    );
}
