import React, { useState, useMemo } from 'react';
import LineChart from './charts/LineChart';
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
    carryForward = false, // tracé en escalier : maintient la dernière valeur jusqu'à la saisie suivante au lieu d'interpoler
}) {
    const defaultId = exercises[0]?.id;
    const [selectedExIds, setSelectedExIds] = useState(defaultId ? [defaultId] : []);

    const toggleExercise = (id) => {
        setSelectedExIds(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            return [...prev, id];
        });
    };

    const allSelected = exercises.length > 0 && selectedExIds.length === exercises.length;
    const toggleAll = () => {
        setSelectedExIds(allSelected ? [] : exercises.map(e => e.id));
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

    const yRange = useMemo(() => yDomain(maxValue), [yDomain, maxValue]);

    const selectedSeries = useMemo(() => selectedExIds
        .map(id => {
            const ex = exercises.find(e => e.id === id);
            return ex ? { key: id, color: ex.color, name: getExerciseLabel(ex, t) } : null;
        })
        .filter(Boolean), [selectedExIds, exercises, t]);

    let formatYTick = (v) => `${v}`;
    if (yAxisExtra?.tickFormatter) formatYTick = yAxisExtra.tickFormatter;
    else if (yAxisExtra?.unit) formatYTick = (v) => `${v}${yAxisExtra.unit}`;

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
                {exercises.length > 1 && (
                    <button
                        onClick={toggleAll}
                        className="hover-lift"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '6px 12px', borderRadius: 'var(--radius-full)',
                            background: 'rgba(255,255,255,0.07)',
                            border: '1.5px dashed rgba(255,255,255,0.22)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer', whiteSpace: 'nowrap',
                            fontSize: '0.7rem', fontWeight: '700',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <DynamicIcon icon={allSelected ? 'CheckCheck' : 'Check'} size={12} color="var(--text-primary)" />
                        {allSelected ? t('stats.deselectAll') : t('stats.selectAll')}
                    </button>
                )}
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
                <LineChart
                    data={chartData}
                    series={selectedSeries}
                    yMin={yRange[0]}
                    yMax={yRange[1]}
                    formatValue={formatTooltip}
                    formatYTick={formatYTick}
                    dots={true}
                    step={carryForward}
                />
            )}
        </div>
    );
}
