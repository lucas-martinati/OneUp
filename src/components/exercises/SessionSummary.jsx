import React, { useState, useMemo } from 'react';
import { Trophy, Check } from '@utils/icons';
import { useTranslation } from 'react-i18next';
import { CSSConfetti } from '../feedback/CSSConfetti';
import { getIcon } from '@utils/icons';
import { Z_INDEX } from '@utils/zIndex';
import { updateSessionName } from '@features/share/services/sessionHistoryService';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { useBackHandler } from '@hooks/useBackHandler';
import { SharePanel } from '@features/share/components/SharePanel';
import { InlineNameEditor } from '@components/ui';
import styles from '@styles/SessionSummary.module.css';

function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export function SessionSummary({ queue, exerciseInfo, onClose, sessionData, stats, defaultSessionName = '' }) {
    const { t } = useTranslation();
    const [sessionName, setSessionName] = useState(defaultSessionName);
    const [confettiDone, setConfettiDone] = useState(false);

    // Handle back button to close summary
    useBackHandler(() => {
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
    const recapExercises = (shareSessionData.exercises || []).filter(Boolean);
    const exCount = recapExercises.length;
    const totalReps = recapExercises.reduce((sum, ex) => sum + (ex.type !== 'timer' ? (ex.reps || ex.goal || 0) : 0), 0);

    const handleNameSave = async (newName) => {
        setSessionName(newName);
        if (sessionData?.id) {
            await updateSessionName(sessionData.id, newName);
        }
    };

    return (
        <div className={`fade-in ${styles.overlay}`} style={{ zIndex: Z_INDEX.TOAST }}>
            <CSSConfetti
                active={!confettiDone}
                colors={['#818cf8', '#fbbf24', '#10b981', '#ec4899', '#22d3ee']}
                onDone={() => setConfettiDone(true)}
            />

            <div className={styles.card}>
                {/* ── Header (fixed) ── */}
                <div className={styles.header}>
                    <div className={styles.trophy}><Trophy size={34} color="var(--color-amber)" /></div>
                    <div className={styles.title}>{t('workout.sessionDone')}</div>
                    <div className={styles.subtitle}>{t('workout.allCompleted')}</div>

                    <div className={styles.stats}>
                        <div className={styles.statChip}>
                            <div className={styles.statVal}>{exCount}</div>
                            <div className={styles.statLab}>{t('share.exercises')}</div>
                        </div>
                        {totalReps > 0 && (
                            <div className={styles.statChip}>
                                <div className={styles.statVal}>{totalReps.toLocaleString()}</div>
                                <div className={styles.statLab}>{t('common.reps')}</div>
                            </div>
                        )}
                        {sessionDuration > 0 && (
                            <div className={styles.statChip}>
                                <div className={styles.statVal}>{formatDuration(sessionDuration)}</div>
                                <div className={styles.statLab}>{t('share.duration')}</div>
                            </div>
                        )}
                    </div>

                    {/* Editable session name */}
                    <div style={{ width: '100%', marginTop: '2px' }}>
                        <InlineNameEditor
                            value={sessionName}
                            onSave={handleNameSave}
                            placeholder={t('share.sessionNamePlaceholder')}
                            emptyLabel={t('share.sessionNamePlaceholder')}
                            align="center"
                            textStyle={{ fontSize: '0.85rem' }}
                        />
                    </div>
                </div>

                {/* ── Recap (scrollable) ── */}
                <div className={`${styles.list} no-scrollbar`}>
                    {recapExercises.map((ex, i) => {
                        const Icon = getIcon(ex.icon);
                        return (
                            <div key={ex.id || i} className={styles.row} style={{ background: `${ex.color}16`, border: `1px solid ${ex.color}33` }}>
                                <div className={styles.rowIcon} style={{ background: `${ex.color}26` }}>
                                    <Icon size={18} color={ex.color} />
                                </div>
                                <span className={styles.rowName} style={{ color: ex.color }}>{ex.label}</span>
                                <span className={styles.rowVal}>
                                    {ex.type === 'timer' ? `${ex.reps || ex.goal}s` : t('common.repsCount', { count: ex.reps || ex.goal })}
                                    {ex.weight ? ` • ${ex.weight} ${t('weight.kg')}` : ''}
                                    <Check size={16} strokeWidth={2.5} />
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* ── Footer (fixed) ── */}
                <div className={styles.footer}>
                    <button onClick={onClose} className={styles.closeBtn}>
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
