import React, { useState, useMemo } from 'react';
import { Trophy, Check, Clock, Pencil } from '../../utils/icons';
import { useTranslation } from 'react-i18next';
import { CSSConfetti } from '../feedback/CSSConfetti';
import { getIcon } from '../../utils/icons';
import { Z_INDEX } from '../../utils/zIndex';
import { updateSessionName } from '../../features/share/services/sessionHistoryService';
import { getExerciseLabel } from '../../utils/exerciseLabel';
import { useBackHandler } from '../../hooks/useBackHandler';
import { SharePanel } from '../../features/share/components/SharePanel';

function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export function SessionSummary({ queue, exerciseInfo, onClose, sessionData, stats, defaultSessionName = '' }) {
    const { t } = useTranslation();
    const [editingName, setEditingName] = useState(false);
    const [sessionName, setSessionName] = useState(defaultSessionName);
    const [confettiDone, setConfettiDone] = useState(false);

    // Handle back button to close summary or cancel editing
    useBackHandler(() => {
        if (editingName) {
            setEditingName(false);
            return true;
        }
        onClose();
        return true;
    }, true);

    const exercises = useMemo(() => {
        return queue.map(id => {
            const ex = exerciseInfo.find(e => e.id === id);
            if (!ex) return null;
            const label = getExerciseLabel(ex, t);
            return { id: ex.id, label, reps: ex.goal, color: ex.color, icon: ex.icon, type: ex.type };
        }).filter(Boolean);
    }, [queue, exerciseInfo, t]);

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

    const handleNameSave = () => {
        setEditingName(false);
        if (sessionData?.id) {
            updateSessionName(sessionData.id, sessionName);
        }
    };

    return (
        <div className="fade-in modal-overlay" style={{ zIndex: Z_INDEX.TOAST }}>
            <div className="modal-content" style={{ 
                alignItems: 'center', justifyContent: 'center', gap: '20px',
                height: '100%' 
            }}>
            <CSSConfetti
                active={!confettiDone}
                colors={['#818cf8', '#fbbf24', '#10b981', '#ec4899', '#22d3ee']}
                onDone={() => setConfettiDone(true)}
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
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#818cf8' }}>
                        {formatDuration(sessionDuration)}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {t('share.duration')}
                    </span>
                </div>
            )}

            {/* Editable session name */}
            <div style={{ width: '100%', maxWidth: '300px' }}>
                {editingName ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                            autoFocus
                            value={sessionName}
                            onChange={e => setSessionName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); }}
                            placeholder={t('share.sessionNamePlaceholder')}
                            style={{
                                flex: 1, padding: '8px 12px', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(129,140,248,0.3)',
                                color: 'white', fontSize: '0.85rem', fontWeight: 600,
                                outline: 'none',
                            }}
                        />
                        <button onClick={handleNameSave} style={{
                            padding: '8px 14px', borderRadius: '10px',
                            background: 'rgba(129,140,248,0.2)',
                            border: 'none', color: '#818cf8',
                            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                        }}>
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
                            cursor: 'pointer',
                            color: sessionName ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontSize: '0.85rem', fontWeight: 600, textAlign: 'left',
                        }}
                    >
                        <Pencil size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>
                            {sessionName || t('share.sessionNamePlaceholder')}
                        </span>
                    </button>
                )}
            </div>

            {/* Recap */}
            <div style={{
                width: '100%', maxWidth: '300px',
                display: 'flex', flexDirection: 'column', gap: '6px'
            }}>
                {shareSessionData.exercises.map((ex, i) => {
                    if (!ex) return null;
                    const Icon = getIcon(ex.icon);
                    return (
                        <div key={ex.id || i} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', borderRadius: 'var(--radius-md)',
                            background: `${ex.color}08`
                        }}>
                            <Icon size={16} color={ex.color} />
                            <span style={{
                                flex: 1, fontSize: '0.8rem', fontWeight: '600', color: ex.color
                            }}>{ex.label}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={14} color="#10b981" />
                                <span style={{
                                    fontSize: '0.75rem', fontWeight: '700', color: '#10b981'
                                }}>
                                    {ex.type === 'timer' ? `${ex.reps || ex.goal}s` : t('common.repsCount', { count: ex.reps || ex.goal })}
                                    {ex.weight ? ` • ${ex.weight} ${t('weight.kg')}` : ''}
                                </span>
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
                <SharePanel
                    sessionData={shareSessionData}
                    stats={stats}
                    variant="large"
                />
            </div>
            </div>
        </div>
    );
}
