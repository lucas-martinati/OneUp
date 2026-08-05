import React, { useMemo } from 'react';
import EvolutionChart from './EvolutionChart';

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

    if (exercisesWithDiffChanges.length === 0) return null;

    return (
        <EvolutionChart
            title={title}
            t={t}
            exercises={exercisesWithDiffChanges}
            completions={completions}
            valueKey="difficulty"
            defaultValue={1.0}
            carryForward
            initialMax={1.0}
            gradient="linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.08))"
            emptyTitle={t('stats.difficultyNoData')}
            emptyHint={t('stats.difficultyNoDataHint')}
            yDomain={(maxValue) => [0, Math.max(1.0, maxValue)]}
            yAxisExtra={{ tickFormatter: (value) => `x${Number(value).toFixed(1)}` }}
            formatBadge={(ex) => `x${(getConfig(ex.id).difficulty || 1.0).toFixed(1)}`}
            formatTooltip={(value) => `x${Number(value).toFixed(1)}`}
        />
    );
}
