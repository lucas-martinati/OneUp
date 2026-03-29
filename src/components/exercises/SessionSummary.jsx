import React from 'react';
import { Trophy, Check, Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints, Flame, Square, MoveDown, MoveDiagonal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CSSConfetti } from '../feedback/CSSConfetti';
import ICON_MAP from '../../utils/iconMap';

export function SessionSummary({ queue, exerciseInfo, onClose }) {
    const { t } = useTranslation();

    return (
        <div className="fade-in" style={{
            position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.97)',
            zIndex: 1000, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 'var(--spacing-lg)', gap: '20px',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
            <CSSConfetti
                active={true}
                colors={['#818cf8', '#fbbf24', '#10b981', '#ec4899', '#22d3ee']}
                onDone={() => {}}
            />

            <Trophy size={56} color="#fbbf24" />

            <div style={{
                fontSize: '1.6rem', fontWeight: '800',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                WebkitTextFillColor: 'transparent', textAlign: 'center'
            }}>
                {t('workout.sessionDone')}
            </div>

            <div style={{
                fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center'
            }}>
                {t('workout.allCompleted')}
            </div>

            {/* Recap */}
            <div style={{
                width: '100%', maxWidth: '300px',
                display: 'flex', flexDirection: 'column', gap: '6px'
            }}>
                {queue.map(id => {
                    const ex = exerciseInfo.find(e => e.id === id);
                    if (!ex) return null;
                    const Icon = ICON_MAP[ex.icon] || Dumbbell;
                    return (
                        <div key={id} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', borderRadius: 'var(--radius-md)',
                            background: `${ex.color}08`
                        }}>
                            <Icon size={16} color={ex.color} />
                            <span style={{
                                flex: 1, fontSize: '0.8rem', fontWeight: '600', color: ex.color
                            }}>{ex.label || t('exercises.' + ex.id)}</span>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}>
                                <Check size={14} color="#10b981" />
                                <span style={{
                                    fontSize: '0.75rem', fontWeight: '700', color: '#10b981'
                                }}>{ex.type === 'timer' ? `${ex.goal}s` : t('workout.reps', { count: ex.goal })}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={onClose}
                className="hover-lift"
                style={{
                    marginTop: '8px', padding: '14px 40px', borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                    border: 'none', color: 'white', fontSize: '1rem', fontWeight: '700',
                    cursor: 'pointer'
                }}
            >
                {t('common.close')}
            </button>
        </div>
    );
}
