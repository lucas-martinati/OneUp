import { X, ChevronRight, DynamicIcon } from '../../../utils/icons';

export function ExercisePanelHeader({ activeColor, exerciseConfig, exerciseLabel, onClose, onNext, hideNextButton, t }) {
    const showNextButton = onNext && !hideNextButton;

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'clamp(8px, 1.5vh, 16px)', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                <div style={{
                    width: 'var(--touch-min)',
                    height: 'var(--touch-min)',
                    borderRadius: '50%',
                    background: `${activeColor}22`,
                    border: `1.5px solid ${activeColor}55`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.45s ease, border-color 0.45s ease'
                }}>
                    <DynamicIcon icon={exerciseConfig?.icon} size={20} color={activeColor} />
                </div>
                <h2 className="panel-title" style={{
                    color: activeColor,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: 'clamp(1rem, 4.5vw, 1.4rem)',
                    flex: 1,
                    textAlign: 'left',
                    transition: 'color 0.45s ease'
                }}>
                    {exerciseLabel}
                </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {showNextButton && (
                    <button
                        onClick={onNext}
                        className="hover-lift"
                        style={{
                            padding: '8px 12px',
                            borderRadius: '20px',
                            background: `${activeColor}20`,
                            border: `1px solid ${activeColor}40`,
                            color: activeColor,
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            minHeight: 'var(--touch-min)',
                            whiteSpace: 'nowrap',
                            transition: 'background 0.45s ease, border-color 0.45s ease, color 0.45s ease'
                        }}
                    >
                        <span style={{ display: 'inline-block' }}>{t('common.next')}</span>
                        <ChevronRight size={14} />
                    </button>
                )}
                <button
                    onClick={onClose}
                    aria-label={t('common.close', 'Fermer')}
                    className="glass hover-lift"
                    style={{
                        width: 'var(--touch-min)',
                        height: 'var(--touch-min)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.08)',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        flexShrink: 0
                    }}
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
}
