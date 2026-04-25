import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DynamicIcon } from '../../utils/icons';
import { getExerciseLabel } from '../../utils/exerciseLabel';

export default function DifficultyEvolutionChart({ title, t, getConfig, completions, exercises }) {
    const exercisesWithDiffChanges = useMemo(() => {
        return exercises.filter(ex => {
            if (getConfig(ex.id).difficulty !== 1.0) return true;
            if (!completions) return false;
            for (const date in completions) {
                if (completions[date]?.[ex.id]?.difficulty !== undefined && completions[date][ex.id].difficulty !== 1.0) {
                    return true;
                }
            }
            return false;
        });
    }, [exercises, completions, getConfig]);

    const defaultId = exercisesWithDiffChanges[0]?.id;
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
        
        Object.entries(completions).forEach(([date, dayData]) => {
            if (!dayData || typeof dayData !== 'object') return;
            const hasDataForSelected = selectedExIds.some(id => dayData[id] && dayData[id].difficulty !== undefined && dayData[id].isCompleted);
            if (hasDataForSelected) allDates.add(date);
        });

        const sortedDates = Array.from(allDates).sort((a, b) => a.localeCompare(b));

        return sortedDates.map(date => {
            const point = { date, label: date.slice(5).replace('-', '/') };
            const dayData = completions[date] || {};
            selectedExIds.forEach(id => {
                if (dayData[id] && dayData[id].difficulty !== undefined && dayData[id].isCompleted) {
                    point[id] = Number(dayData[id].difficulty) || 1.0;
                }
            });
            return point;
        });
    }, [completions, selectedExIds]);

    const maxDiff = useMemo(() => {
        let max = 1.0;
        chartData.forEach(d => {
            selectedExIds.forEach(id => {
                if (d[id] > max) max = d[id];
            });
        });
        return max;
    }, [chartData, selectedExIds]);

    if (exercisesWithDiffChanges.length === 0) return null;

    return (
        <div className="glass-premium" style={{
            padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
            display: 'flex', flexDirection: 'column',
            marginBottom: 'var(--spacing-md)',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.08))'
        }}>
            <h3 style={{
                marginBottom: 'var(--spacing-sm)', fontSize: '0.85rem', fontWeight: '700',
                textTransform: 'uppercase', letterSpacing: '1px',
                color: 'var(--text-secondary)', textAlign: 'center', width: '100%'
            }}>
                {title}
            </h3>

            {/* Exercise toggles */}
            <div style={{
                display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center',
                paddingBottom: '8px', marginBottom: '12px'
            }}>
                {exercisesWithDiffChanges.map(ex => {
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

            {/* Current difficulty badges */}
            {selectedExIds.length > 0 && (
                <div style={{
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', marginBottom: '12px'
                }}>
                    {selectedExIds.map(id => {
                        const ex = exercisesWithDiffChanges.find(e => e.id === id);
                        if (!ex) return null;
                        const diff = getConfig(id).difficulty || 1.0;
                        return (
                            <span key={id} style={{
                                fontSize: '0.75rem', fontWeight: '800', color: ex.color,
                                background: `${ex.color}15`, padding: '2px 8px', borderRadius: '8px',
                                border: `1px solid ${ex.color}30`
                            }}>
                                x{diff.toFixed(1)}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Chart or empty state */}
            {chartData.length < 2 ? (
                <div style={{
                    height: '180px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: '8px', color: 'var(--text-secondary)'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>📊</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                        {t('stats.difficultyNoData')}
                    </span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.7, textAlign: 'center', maxWidth: '240px' }}>
                        {t('stats.difficultyNoDataHint')}
                    </span>
                </div>
            ) : (
                <div style={{ width: 'calc(100% + 16px)', marginLeft: '-16px', height: '200px', minHeight: '200px' }}>
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
                                domain={[0, Math.max(1.0, maxDiff)]}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                width={38}
                                tickFormatter={(value) => `x${Number(value).toFixed(1)}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--tooltip-bg)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: '8px'
                                }}
                                labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.7rem' }}
                                formatter={(value, name) => {
                                    const ex = exercisesWithDiffChanges.find(e => e.id === name);
                                    const label = ex ? getExerciseLabel(ex, t) : name;
                                    return [`x${Number(value).toFixed(1)}`, label];
                                }}
                                labelFormatter={(label) => label}
                            />
                            {selectedExIds.map(id => {
                                const ex = exercisesWithDiffChanges.find(e => e.id === id);
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
