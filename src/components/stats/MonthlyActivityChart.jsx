import { useTranslation } from 'react-i18next';
import { sectionTitleStyle } from './statsStyles';

/** Stacked per-exercise monthly activity bar chart (pure CSS, no charting lib). */
export function MonthlyActivityChart({ monthlyActivityTotal, monthlyActivityByExercise, exercises }) {
    const { t } = useTranslation();
    const maxMonthly = Math.max(...monthlyActivityTotal, 1);
    const monthNames = t('stats.monthAbbreviations', { returnObjects: true });
    const today = new Date();

    return (
        <div className="glass-premium" style={{
            padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--spacing-md)',
            background: 'var(--surface-section)'
        }}>
            <h3 style={sectionTitleStyle}>{t('stats.monthlyActivity')}</h3>
            <div style={{
                display: 'flex', alignItems: 'flex-end', gap: '4px',
                height: '100px', padding: '0 4px'
            }}>
                {monthlyActivityTotal.map((count, i) => {
                    const height = count > 0 ? Math.max(8, (count / maxMonthly) * 100) : 0;
                    const isCurrentMonth = i === today.getMonth();

                    const exCounts = exercises.map((ex, exIdx) => ({
                        ex,
                        count: monthlyActivityByExercise[exIdx]?.[i] || 0
                    }));
                    const totalExCount = exCounts.reduce((sum, e) => sum + e.count, 0);

                    return (
                        <div key={i} style={{
                            flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: '2px',
                            height: '100%', justifyContent: 'flex-end'
                        }}>
                            {totalExCount > 0 && (
                                <span style={{
                                    fontSize: '0.5rem', color: 'var(--text-secondary)',
                                    fontWeight: '600', lineHeight: 1.1
                                }}>{totalExCount}</span>
                            )}
                            <div style={{
                                width: '100%', borderRadius: '4px 4px 2px 2px',
                                height: count > 0 ? `${height}%` : '3px',
                                background: 'var(--surface-muted)',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                transition: 'height 0.5s ease'
                            }}>
                                {exCounts.map(({ ex, count: exCount }, exIdx) => {
                                    if (exCount === 0) return null;
                                    const segmentHeight = (exCount / Math.max(totalExCount, 1)) * 100;
                                    const nextEx = exCounts[exIdx + 1];
                                    return (
                                        <div key={exIdx} style={{
                                            width: '100%',
                                            height: `${segmentHeight}%`,
                                            background: ex.color,
                                            opacity: isCurrentMonth ? 1 : 0.6,
                                            transition: 'height 0.3s ease',
                                            position: 'relative'
                                        }}>
                                            {nextEx && nextEx.count > 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: '15%',
                                                    background: `linear-gradient(to bottom, ${ex.color}88, transparent)`,
                                                    pointerEvents: 'none'
                                                }} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <span style={{
                                fontSize: '0.55rem',
                                color: isCurrentMonth ? '#818cf8' : 'var(--text-secondary)',
                                fontWeight: isCurrentMonth ? '700' : '500'
                            }}>{monthNames[i]}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
