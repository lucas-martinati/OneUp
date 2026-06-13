import { X, ChevronRight, DynamicIcon } from '../../../utils/icons';

export function ExercisePanelHeader({ activeColor, exerciseConfig, exerciseLabel, onClose, onNext, hideNextButton, t }) {
    const showNextButton = onNext && !hideNextButton;

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'clamp(8px, 1.5vh, 16px)', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                <div style={{
                    width: 'var(--touch-min)',
                    height: 'var(--touch-min)',
                    borderRadius: '14px',
                    background: `linear-gradient(135deg, ${activeColor}33, ${activeColor}14)`,
                    border: `1px solid ${activeColor}55`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 4px 16px ${activeColor}33`,
                    transition: 'background 0.45s ease, border-color 0.45s ease, box-shadow 0.45s ease'
                }}>
                    <DynamicIcon icon={exerciseConfig?.icon} size={20} color={activeColor} />
                </div>
                <h2 className="panel-title" style={{
                    color: 'var(--text-primary)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: 'clamp(1.05rem, 4.5vw, 1.4rem)',
                    letterSpacing: '-0.01em',
                    flex: 1,
                    textAlign: 'left'
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
                            padding: '8px 14px',
                            borderRadius: 'var(--radius-full)',
                            background: `${activeColor}1f`,
                            border: `1px solid ${activeColor}44`,
                            color: activeColor,
                            fontSize: '0.82rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            cursor: 'pointer',
                            minHeight: 'var(--touch-min)',
                            whiteSpace: 'nowrap',
                            transition: 'background 0.45s ease, border-color 0.45s ease, color 0.45s ease'
                        }}
                    >
                        <span>{t('common.next')}</span>
                        <ChevronRight size={15} />
                    </button>
                )}
                <button
                    onClick={onClose}
                    aria-label={t('common.close')}
                    className="hover-lift"
                    style={{
                        width: 'var(--touch-min)',
                        height: 'var(--touch-min)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
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
