import React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricBadge } from './MetricBadge';

/**
 * Small rounded pill showing a weight value tinted with the exercise color,
 * e.g. "20 kg". Used wherever a weighted exercise surfaces its load.
 *
 * @param {Object} props
 * @param {number} props.weight - Weight value in kg. Renders nothing if nullish.
 * @param {string} props.color - Exercise color used for the tint/border/text.
 * @param {Object} [props.style] - Optional additional styles (e.g. spacing).
 * @returns {JSX.Element|null}
 */
export const WeightBadge = React.memo(({ weight, color, style = {} }) => {
    const { t } = useTranslation();
    if (weight == null) return null;

    return (
        <MetricBadge color={color} size="sm" style={style}>
            {weight} {t('weight.kg')}
        </MetricBadge>
    );
});
