import React from 'react';
import { WEIGHT_EXERCISES } from '@config/weights';
import EvolutionChart from './EvolutionChart';

export default function WeightEvolutionChart({ title, t, getConfig, completions }) {
    return (
        <EvolutionChart
            title={title}
            t={t}
            exercises={WEIGHT_EXERCISES}
            completions={completions}
            valueKey="weight"
            defaultValue={0}
            initialMax={1}
            gradient="linear-gradient(135deg, rgba(245,158,11,0.1), rgba(234,88,12,0.08))"
            emptyTitle={t('weight.noData')}
            emptyHint={t('weight.noDataHint')}
            yDomain={(maxValue) => [0, Math.ceil(maxValue * 1.15)]}
            yAxisExtra={{ unit: ' kg' }}
            formatBadge={(ex) => `${getConfig(ex.id).weight || ex.defaultWeight || 0} ${t('weight.kg')}`}
            formatTooltip={(value) => `${value} ${t('weight.kg')}`}
        />
    );
}
