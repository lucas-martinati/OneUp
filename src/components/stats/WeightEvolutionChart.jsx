import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { WEIGHT_EXERCISES } from '../../config/weights';
import { DynamicIcon } from '../../utils/icons';
import { getExerciseLabel } from '../../utils/exerciseLabel';

export default function WeightEvolutionChart({ title, t, getConfig, completions }) {
    const defaultId = WEIGHT_EXERCISES[0]?.id;
    const [selectedExIds, setSelectedExIds] = useState(defaultId ? [defaultId] : []);

    const toggleExercise = (id) => {
        setSelectedExIds(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            return [...prev, id];
        });
    };

    const chartData = useMemo(() => {
        if (!completions) return [];
        const allDates = new Set();
        
        // Find all dates where ANY selected weight exercise was completed with a weight
        Object.entries(completions).forEach(([date, dayData]) => {
            if (!dayData || typeof dayData !== 'object') return;
            const hasDataForSelected = selectedExIds.some(id => dayData[id] && dayData[id].weight !== undefined && dayData[id].weight !== null && dayData[id].isCompleted);
            if (hasDataForSelected) allDates.add(date);
        });

        const sortedDates = Array.from(allDates).sort((a, b) => a.localeCompare(b));

        return sortedDates.map(date => {
            const point = { date, label: date.slice(5).replace('-', '/') };
            const dayData = completions[date] || {};
            selectedExIds.forEach(id => {
                if (dayData[id] && dayData[id].weight !== undefined && dayData[id].weight !== null && dayData[id].isCompleted) {
                    point[id] = Number(dayData[id].weight) || 0;
                }
            });
            return point;
        });
    }, [completions, selectedExIds]);

    const maxWeight = useMemo(() => {
        let max = 1;
        chartData.forEach(d => {
            selectedExIds.forEach(id => {
                if (d[id] > max) max = d[id];
            });
        });
        return max;
    }, [chartData, selectedExIds]);

    return (
        <div className="glass-premium chart-card" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(234,88,12,0.08))' }}>
            <h3 className="chart-title">
                {title}
            </h3>

            {/* Exercise toggles */}
            <div style={{
                display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center',
                paddingBottom: '8px', marginBottom: '12px'
            }}>
                {WEIGHT_EXERCISES.map(ex => {
                    const isActive = selectedExIds.includes(ex.id);
                    return (
                        <button
                            key={ex.id}
                            onClick={() => toggleExercise(ex.id)}
                            className="hover-lift"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '6px 12px', borderRadius: 'var(--radius-full)',
                                background: isActive
                                    ? `linear-gradient(135deg, ${ex.color}30, ${ex.color}18)`
                                    : 'rgba(255,255,255,0.04)',
                                border: isActive
                                    ? `1.5px solid ${ex.color}60`
                                    : '1.5px solid rgba(255,255,255,0.08)',
                                color: isActive ? ex.color : 'var(--text-secondary)',
                                cursor: 'pointer', whiteSpace: 'nowrap',
                                fontSize: '0.7rem', fontWeight: '600',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <DynamicIcon icon={ex.icon} size={12} color={isActive ? ex.color : 'var(--text-secondary)'} />
                            {getExerciseLabel(ex, t)}
                        </button>
                    );
                })}
            </div>

            {/* Current weight badges */}
            {selectedExIds.length > 0 && (
                <div style={{
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', marginBottom: '12px'
                }}>
                    {selectedExIds.map(id => {
                        const ex = WEIGHT_EXERCISES.find(e => e.id === id);
                        if (!ex) return null;
                        const w = getConfig(id).weight || ex.defaultWeight || 0;
                        return (
                            <span key={id} style={{
                                fontSize: '0.75rem', fontWeight: '800', color: ex.color,
                                background: `${ex.color}15`, padding: '2px 8px', borderRadius: '8px',
                                border: `1px solid ${ex.color}30`
                            }}>
                                {w} {t('weight.kg')}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Chart or empty state */}
            {chartData.length < 2 ? (
                <div className="chart-empty-state">
                    <span className="chart-empty-icon">📊</span>
                    <span className="chart-empty-title">
                        {t('weight.noData')}
                    </span>
                    <span className="chart-empty-hint">
                        {t('weight.noDataHint')}
                    </span>
                </div>
            ) : (
                <div className="chart-wrapper-overflow">
                    <ResponsiveContainer width="100%" height={200} debounce={100}>
                        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: 'var(--text-secondary)', fontSize: 9, fontWeight: 500 }}
                                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                                tickLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                domain={[0, Math.ceil(maxWeight * 1.15)]}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                width={38}
                                unit=" kg"
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--tooltip-bg)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: '8px'
                                }}
                                labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.7rem' }}
                                formatter={(value, name) => {
                                    const ex = WEIGHT_EXERCISES.find(e => e.id === name);
                                    const label = ex ? getExerciseLabel(ex, t) : name;
                                    return [`${value} ${t('weight.kg')}`, label];
                                }}
                                labelFormatter={(label) => label}
                            />
                            {selectedExIds.map(id => {
                                const ex = WEIGHT_EXERCISES.find(e => e.id === id);
                                if (!ex) return null;
                                return (
                                    <Line
                                        key={id}
                                        type="monotone"
                                        dataKey={id}
                                        name={id}
                                        stroke={ex.color}
                                        strokeWidth={2.5}
                                        dot={{ r: 4, fill: ex.color, stroke: '#fff', strokeWidth: 2 }}
                                        activeDot={{ r: 6, fill: ex.color, stroke: '#fff', strokeWidth: 2 }}
                                        animationDuration={800}
                                        connectNulls
                                    />
                                );
                            })}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
