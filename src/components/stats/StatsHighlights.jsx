import { useTranslation } from 'react-i18next';
import { Trophy, Crown, DynamicIcon } from '../../utils/icons';
import { getExerciseLabel } from '../../utils/exerciseLabel';
import { AnimatedNumber } from '../ui/AnimatedNumber';

const intFormat = (v) => v.toLocaleString();

/** Small tinted icon chip reused by the highlight cards. */
function Chip({ color, children }) {
    return (
        <div style={{
            width: '34px', height: '34px', borderRadius: '11px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${color}1f`, border: `1px solid ${color}3a`, color,
            position: 'relative', zIndex: 1, flexShrink: 0
        }}>
            {children}
        </div>
    );
}

/** Champion + best day highlight cards, followed by the exercise color legend. */
export function StatsHighlights({ champion, bestDayDate, bestDayReps, bestDayExReps, exercises, pending = false }) {
    const { t, i18n } = useTranslation();

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
    };

    const cardBase = {
        position: 'relative', overflow: 'hidden',
        padding: '15px 14px', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', gap: '10px'
    };
    const labelStyle = {
        fontSize: 'clamp(0.55rem, 1.3vw, 0.62rem)', color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '600'
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
                        <div className="glass-premium scale-in" style={{ ...cardBase, animationDelay: '0.3s' }}>
                            <div aria-hidden="true" style={{
                                position: 'absolute', top: '-28px', right: '-28px',
                                width: '86px', height: '86px', borderRadius: '50%',
                                background: `radial-gradient(circle, ${champion.color}33 0%, transparent 70%)`,
                                pointerEvents: 'none'
                            }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
                                <Chip color={champion.color}>
                                    <DynamicIcon icon={champion.icon} size={18} color={champion.color} />
                                </Chip>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Crown size={11} color="#fbbf24" /> {t('stats.champion')}
                                    </div>
                                    <div style={{
                                        fontSize: '0.9rem', fontWeight: '700', color: champion.color,
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                    }}>
                                        {getExerciseLabel(exercises?.find(e => e.id === champion.id) || { id: champion.id }, t)}
                                    </div>
                                </div>
                            </div>
                            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)', position: 'relative', zIndex: 1 }}>
                                <AnimatedNumber value={champion.totalReps} format={intFormat} pending={pending} /> <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{t('common.reps')}</span>
                            </div>
                        </div>
                    )}
                    {bestDayDate && (
                        <div className="glass-premium scale-in" style={{ ...cardBase, animationDelay: '0.35s' }}>
                            <div aria-hidden="true" style={{
                                position: 'absolute', top: '-28px', right: '-28px',
                                width: '86px', height: '86px', borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(251,191,36,0.33) 0%, transparent 70%)',
                                pointerEvents: 'none'
                            }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
                                <Chip color="#fbbf24"><Trophy size={18} /></Chip>
                                <div>
                                    <div style={labelStyle}>{t('stats.recordDay')}</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fbbf24' }}>
                                        {formatDate(bestDayDate)}
                                    </div>
                                </div>
                            </div>
                            <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)', position: 'relative', zIndex: 1 }}>
                                <AnimatedNumber value={bestDayReps} format={intFormat} pending={pending} /> <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{t('common.reps')}</span>
                            </div>
                            <div style={{
                                display: 'flex', flexWrap: 'wrap', gap: '4px 6px',
                                position: 'relative', zIndex: 1
                            }}>
                                {Object.entries(bestDayExReps).map(([exId, reps]) => {
                                    const ex = exercises?.find(e => e.id === exId);
                                    if (!ex) return null;
                                    return (
                                        <div key={exId} style={{
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            fontSize: '0.6rem', color: 'var(--text-secondary)',
                                            background: 'var(--surface-subtle)',
                                            border: '1px solid var(--border-subtle)',
                                            padding: '2px 7px', borderRadius: '20px'
                                        }}>
                                            <div style={{
                                                width: '6px', height: '6px', borderRadius: '50%',
                                                background: ex.color
                                            }} />
                                            <span style={{ fontWeight: '700', color: ex.color }}>{reps}</span>
                                            <span>{getExerciseLabel(ex, t)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
