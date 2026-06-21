import React from 'react';
import RadarChart from './charts/RadarChart';

export default function RadarChartPanel({ radarData, globalTotalReps, title }) {
    if (radarData.length <= 2 || globalTotalReps <= 0) return null;
    return (
        <div className="glass-premium chart-card" style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(16,185,129,0.1))' }}>
            <h3 className="chart-title">{title}</h3>
            <RadarChart data={radarData} color="#34d399" />
        </div>
    );
}
