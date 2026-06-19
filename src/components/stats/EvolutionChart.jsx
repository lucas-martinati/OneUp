import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DynamicIcon } from '@utils/icons';
import { getExerciseLabel } from '@utils/exerciseLabel';

/**
 * Graphe d'évolution générique (une métrique par exercice dans le temps).
 * Mutualise toute la logique commune entre la difficulté et le poids ; seules
 * les différences sont passées en props (métrique, format, domaine, couleurs…).
 */
export default function EvolutionChart({
    title,
    t,
    exercises,
    completions,
    valueKey,        // champ lu dans completions (ex. 'difficulty', 'weight')
    defaultValue,    // valeur de repli quand le point n'est pas un nombre
    initialMax,      // borne basse pour le calcul du maximum
    gradient,        // dégradé de fond de la carte
    emptyTitle,
    emptyHint,
    yDomain,         // (maxValue) => [min, max]
    yAxisExtra,      // props additionnelles passées au YAxis (tickFormatter / unit)
    formatBadge,     // (ex) => texte du badge "valeur actuelle"
    formatTooltip,   // (value) => texte de la valeur dans le tooltip
}) {
    const defaultId = exercises[0]?.id;
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
            const hasDataForSelected = selectedExIds.some(id => dayData[id] && dayData[id][valueKey] != null && dayData[id].isCompleted);
            if (hasDataForSelected) allDates.add(date);
        });

        const sortedDates = Array.from(allDates).sort((a, b) => a.localeCompare(b));

        return sortedDates.map(date => {
            const point = { date, label: date.slice(5).replace('-', '/') };
            const dayData = completions[date] || {};
            selectedExIds.forEach(id => {
                if (dayData[id] && dayData[id][valueKey] != null && dayData[id].isCompleted) {
                    point[id] = Number(dayData[id][valueKey]) || defaultValue;
                }
            });
            return point;
        });
    }, [completions, selectedExIds, valueKey, defaultValue]);

    const maxValue = useMemo(() => {
        let max = initialMax;
        chartData.forEach(d => {
            selectedExIds.forEach(id => {
                if (d[id] > max) max = d[id];
            });
        });
        return max;
    }, [chartData, selectedExIds, initialMax]);

    return (
        <div className="glass-premium chart-card" style={{ background: gradient }}>
            <h3 className="chart-title">
                {title}
            </h3>

            {/* Exercise toggles */}
            <div style={{
                display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center',
                paddingBottom: '8px', marginBottom: '12px'
            }}>
                {exercises.map(ex => {
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

            {/* Current value badges */}
            {selectedExIds.length > 0 && (
                <div style={{
                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', marginBottom: '12px'
                }}>
                    {selectedExIds.map(id => {
                        const ex = exercises.find(e => e.id === id);
                        if (!ex) return null;
                        return (
                            <span key={id} style={{
                                fontSize: '0.75rem', fontWeight: '800', color: ex.color,
                                background: `${ex.color}15`, padding: '2px 8px', borderRadius: '8px',
                                border: `1px solid ${ex.color}30`
                            }}>
                                {formatBadge(ex)}
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
                        {emptyTitle}
                    </span>
                    <span className="chart-empty-hint">
                        {emptyHint}
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
                                domain={yDomain(maxValue)}
                                tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                width={38}
                                {...yAxisExtra}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--tooltip-bg)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: '8px'
                                }}
                                labelStyle={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.7rem' }}
                                formatter={(value, name) => {
                                    const ex = exercises.find(e => e.id === name);
                                    const label = ex ? getExerciseLabel(ex, t) : name;
                                    return [formatTooltip(value), label];
                                }}
                                labelFormatter={(label) => label}
                            />
                            {selectedExIds.map(id => {
                                const ex = exercises.find(e => e.id === id);
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
