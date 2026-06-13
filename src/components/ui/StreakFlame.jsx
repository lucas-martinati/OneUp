import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Streak indicator: a flame + day count. The flame is colored when the
 * streak is "active" (exercise done today) and greyed out otherwise, to
 * signal a streak that's still pending for the current day.
 *
 * Variants:
 *  - 'pill'  (default): inline rounded chip used in stats lists. Shows the
 *            localized "days" suffix and an orange/grey color scheme.
 *  - 'badge': compact overlay used on dashboard tiles (dark background,
 *            no "days" suffix, inherits container text color).
 *
 * @param {Object} props
 * @param {number} props.streak - Streak length in days. Renders nothing if <= 0.
 * @param {boolean} props.active - Whether the streak is active today (colored flame).
 * @param {'pill'|'badge'} [props.variant] - Visual variant (default 'pill').
 * @param {Object} [props.style] - Optional additional container styles.
 * @returns {JSX.Element|null}
 */
export const StreakFlame = React.memo(({ streak, active, variant = 'pill', style = {} }) => {
    const { t } = useTranslation();
    if (!streak || streak <= 0) return null;

    const isBadge = variant === 'badge';

    const containerStyle = isBadge
        ? {
            display: 'flex', alignItems: 'center', gap: '1px',
            fontSize: 'clamp(0.52rem, 1.2vh, 0.7rem)', fontWeight: '700',
            padding: '1px 5px', borderRadius: '999px',
            background: 'rgba(0, 0, 0, 0.35)',
            border: active ? '1px solid rgba(249, 115, 22, 0.3)' : '1px solid rgba(148, 163, 184, 0.3)',
            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
            lineHeight: 1.4,
            ...style
        }
        : {
            display: 'flex', alignItems: 'center', gap: '3px',
            background: active ? 'rgba(249,115,22,0.1)' : 'rgba(120,120,120,0.08)',
            padding: '2px 8px', borderRadius: '10px',
            ...style
        };

    return (
        <div style={containerStyle}>
            <span style={{
                ...(isBadge ? {} : { fontSize: '0.7rem' }),
                opacity: active ? 1 : 0.6,
                filter: active ? 'none' : 'grayscale(1)'
            }}>🔥</span>
            <span style={isBadge ? undefined : {
                fontSize: '0.75rem', fontWeight: '700',
                color: active ? '#f97316' : '#888'
            }}>
                {streak}{isBadge ? '' : t('common.daysAbbr')}
            </span>
        </div>
    );
});
