import React, { useState, useMemo, Suspense, lazy } from 'react';
import { Trophy, Check, Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints, Flame, Square, MoveDown, MoveDiagonal, Share2, Clock, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CSSConfetti } from '../feedback/CSSConfetti';
import ICON_MAP from '../../utils/iconMap';
import { Z_INDEX } from '../../utils/zIndex';
import { useShareCard } from '../../features/share/hooks/useShareCard';
import { getSessionHistory, updateSessionName } from '../../features/share/services/sessionHistoryService';

const ShareModal = lazy(() => import('../../features/share/components/ShareModal').then(m => ({ default: m.ShareModal })));

function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export function SessionSummary({ queue, exerciseInfo, onClose, sessionData, stats, sessionHistory, isPro = false, defaultSessionName = '' }) {
    const { t } = useTranslation();
    const [showShare, setShowShare] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [sessionName, setSessionName] = useState(defaultSessionName);

    const exercises = useMemo(() => {
        return queue.map(id => {
            const ex = exerciseInfo.find(e => e.id === id);
            if (!ex) return null;
            const label = ex.label || t('exercises.' + ex.id);
            return { id: ex.id, label, reps: ex.goal, color: ex.color, icon: ex.icon, type: ex.type };
        }).filter(Boolean);
    }, [queue, exerciseInfo, t]);

    const history = useMemo(() => {
        return sessionHistory || getSessionHistory();
    }, [sessionHistory]);

    const shareSessionData = useMemo(() => {
        const base = sessionData || {
            date: new Date().toISOString(),
            exercises,
            duration: 0,
            name: sessionName,
            type: 'bodyweight',
        };
        return { ...base, name: sessionName };
    }, [sessionData, exercises, sessionName]);

    const sessionDuration = shareSessionData?.duration || 0;

    const shareHook = useShareCard({
        sessionData: shareSessionData,
        stats: stats || {},
        sessionHistory: history,
    });

    const handleNameSave = () => {
        setEditingName(false);
        if (sessionData?.id) {
            updateSessionName(sessionData.id, sessionName);
        }
    };

    return (
        <div className="fade-in" style={{
            position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.97)',
            zIndex: Z_INDEX.TOAST, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 'var(--spacing-lg)', gap: '20px',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
            <CSSConfetti
                active={!showShare}
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

            {/* Duration */}
            {sessionDuration > 0 && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', borderRadius: '12px',
                    background: 'rgba(129,140,248,0.1)',
                    border: '1px solid rgba(129,140,248,0.15)',
                }}>
                    <Clock size={16} color="#818cf8" />
                    <span style={{
                        fontSize: '0.9rem', fontWeight: 700, color: '#818cf8',
                    }}>
                        {formatDuration(sessionDuration)}
                    </span>
                    <span style={{
                        fontSize: '0.7rem', color: 'var(--text-secondary)',
                    }}>
                        {t('share.duration', 'Durée')}
                    </span>
                </div>
            )}

            {/* Editable session name */}
            <div style={{
                width: '100%', maxWidth: '300px',
            }}>
                {editingName ? (
                    <div style={{
                        display: 'flex', gap: '6px', alignItems: 'center',
                    }}>
                        <input
                            autoFocus
                            value={sessionName}
                            onChange={e => setSessionName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); }}
                            placeholder={t('share.sessionNamePlaceholder', 'Nom de la séance (optionnel)')}
                            style={{
                                flex: 1, padding: '8px 12px', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(129,140,248,0.3)',
                                color: 'white', fontSize: '0.85rem', fontWeight: 600,
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={handleNameSave}
                            style={{
                                padding: '8px 14px', borderRadius: '10px',
                                background: 'rgba(129,140,248,0.2)',
                                border: 'none', color: '#818cf8',
                                fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                            }}
                        >
                            OK
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setEditingName(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            width: '100%', padding: '8px 12px', borderRadius: '10px',
                            background: sessionName ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                            border: '1px dashed rgba(255,255,255,0.1)',
                            cursor: 'pointer', color: sessionName ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontSize: '0.85rem', fontWeight: 600,
                            textAlign: 'left',
                        }}
                    >
                        <Pencil size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>
                            {sessionName || t('share.sessionNamePlaceholder', 'Nom de la séance (optionnel)')}
                        </span>
                    </button>
                )}
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

            {/* Action buttons */}
            <div style={{
                display: 'flex', gap: '10px', marginTop: '8px',
                width: '100%', maxWidth: '300px',
            }}>
                <button
                    onClick={onClose}
                    className="hover-lift"
                    style={{
                        flex: 1, padding: '14px 20px', borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                        border: 'none', color: 'white', fontSize: '1rem', fontWeight: '700',
                        cursor: 'pointer'
                    }}
                >
                    {t('common.close')}
                </button>
                <button
                    onClick={() => setShowShare(true)}
                    className="hover-lift"
                    style={{
                        padding: '14px 16px', borderRadius: 'var(--radius-lg)',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'white', fontSize: '1rem', fontWeight: '700',
                        cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <Share2 size={20} />
                </button>
            </div>

            {/* Share Modal */}
            <Suspense fallback={null}>
                {showShare && (
                    <ShareModal
                        shareHook={shareHook}
                        onClose={() => setShowShare(false)}
                        isPro={isPro}
                    />
                )}
            </Suspense>
        </div>
    );
}
