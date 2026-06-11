import { useTranslation } from 'react-i18next';
import { Trophy, Crown, DynamicIcon } from '../../utils/icons';
import { getExerciseLabel } from '../../utils/exerciseLabel';
import { statLabelSmallStyle } from './statsStyles';

/** Champion + best day highlight cards, followed by the exercise color legend. */
export function StatsHighlights({ champion, bestDayDate, bestDayReps, bestDayExReps, exercises }) {
    const { t, i18n } = useTranslation();

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
    };

    return (
        <>
            {(champion?.totalReps > 0 || bestDayDate) && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: champion?.totalReps > 0 && bestDayDate ? '1fr 1fr' : '1fr',
                    gap: '10px', marginBottom: 'var(--spacing-md)'
                }}>
                    {champion && champion.totalReps > 0 && (
                        <div className="glass-premium scale-in" style={{
                            padding: '14px 12px', borderRadius: 'var(--radius-lg)',
                            background: `linear-gradient(135deg, ${champion.color}18, ${champion.color}08)`,
                            border: `1px solid ${champion.color}30`,
                            textAlign: 'center', animationDelay: '0.5s'
                        }}>
                            <Crown size={20} color="#fbbf24" style={{ marginBottom: '4px' }} />
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '6px', marginBottom: '2px'
                            }}>
                                {champion && <DynamicIcon icon={champion.icon} size={16} color={champion.color} />}
                                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: champion.color }}>
                                    {getExerciseLabel(exercises?.find(e => e.id === champion.id) || { id: champion.id }, t)}
                                </span>
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                {champion.totalReps.toLocaleString()} {t('common.reps')}
                            </div>
                            <div style={statLabelSmallStyle}>{t('stats.champion')}</div>
                        </div>
                    )}
                    {bestDayDate && (
                        <div className="glass-premium scale-in" style={{
                            padding: '14px 12px', borderRadius: 'var(--radius-lg)',
                            background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06))',
                            border: '1px solid rgba(251,191,36,0.2)',
                            textAlign: 'center', animationDelay: '0.55s'
                        }}>
                            <Trophy size={20} color="#fbbf24" style={{ marginBottom: '4px' }} />
                            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fbbf24', marginBottom: '2px' }}>
                                {formatDate(bestDayDate)}
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                                {bestDayReps.toLocaleString()} {t('common.reps')}
                            </div>
                            <div style={{
                                display: 'flex', flexWrap: 'wrap', gap: '4px 8px',
                                justifyContent: 'center', marginTop: '6px'
                            }}>
                                {Object.entries(bestDayExReps).map(([exId, reps]) => {
                                    const ex = exercises?.find(e => e.id === exId);
                                    if (!ex) return null;
                                    return (
                                        <div key={exId} style={{
                                            display: 'flex', alignItems: 'center', gap: '3px',
                                            fontSize: '0.6rem', color: 'var(--text-secondary)',
                                            background: 'rgba(255,255,255,0.05)', padding: '2px 6px',
                                            borderRadius: '4px'
                                        }}>
                                            <div style={{
                                                width: '6px', height: '6px', borderRadius: '2px',
                                                background: ex.color
                                            }} />
                                            <span style={{ fontWeight: '600', color: ex.color }}>{reps}</span>
                                            <span>{getExerciseLabel(ex, t)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {exercises && exercises.length > 0 && (
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '8px',
                    marginTop: '12px', justifyContent: 'center'
                }}>
                    {exercises.map(ex => (
                        <div key={ex.id} style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            fontSize: '0.6rem', color: 'var(--text-secondary)'
                        }}>
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '2px',
                                background: ex.color
                            }} />
                            <span>{getExerciseLabel(ex, t)}</span>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
