import React, { useMemo } from 'react';
import EvolutionChart from './EvolutionChart';
import { LevelEmblem } from '@components/ui/LevelEmblem';
import { getDayLevel } from '@shared/exerciseLevels.js';
import { getLocalDateStr, shiftDateStr } from '@shared/dateUtils';

export default function LevelEvolutionChart({ title, t, completions, exercises, weekStartDay = 'monday' }) {
    const today = getLocalDateStr(new Date());
    const { history, latestLevels } = useMemo(() => {
        const first = Object.keys(completions || {}).filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today).sort()[0];
        const result = {};
        const latest = {};
        // Keep only attained levels, including cardio levels valid for the week.
        for (let date = first; date && date <= today; date = shiftDateStr(date, 1)) {
            const entries = {};
            for (const ex of exercises) {
                const level = getDayLevel(completions, date, [ex.id], weekStartDay);
                if (level > 0) {
                    entries[ex.id] = { level };
                    latest[ex.id] = level;
                }
            }
            if (Object.keys(entries).length) result[date] = entries;
        }
        return { history: result, latestLevels: latest };
    }, [completions, exercises, today, weekStartDay]);
    return <EvolutionChart
        title={title} t={t} exercises={exercises} completions={history}
        valueKey="level" defaultValue={0} initialMax={10} carryForward includeIncomplete
        emptyTitle={t('stats.levelNoData')} emptyHint={t('stats.levelNoDataHint')}
        yDomain={() => [1, 10]}
        yAxisExtra={{ tickFormatter: value => t('levels.short', { level: Math.round(value) }) }}
        formatBadge={ex => latestLevels[ex.id] ? <LevelEmblem level={latestLevels[ex.id]} size={28} /> : null}
        formatTooltip={value => t('levels.short', { level: Math.round(value) })}
    />;
}
