import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Trash2, Dumbbell, Zap } from '@utils/icons';
import { getIcon } from '@utils/icons';
import { Button, ConfirmDialog, WeightBadge, InlineNameEditor, ModalHeader, ModalContainer } from '@components/ui';
import { updateSessionName } from '@features/share/services/sessionHistoryService';
import { getExerciseLabel, getExerciseColor } from '@utils/exerciseLabel';
import { sumExerciseReps } from '@utils/statUtils';
import { SharePanel } from './SharePanel';
import styles from './SessionDetailModal.module.css';

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = (seconds % 60).toString().padStart(2, '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${s}`;
  return `${m}:${s}`;
}

function formatDateTime(dateStr, lang) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang || undefined, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function SessionDetailModal({ session, onClose, onDelete, stats = {}, isPro = false, onNameChange }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(session?.name || '');
  const hasName = name && name.trim().length > 0;



  const exercises = session?.exercises || [];
  const totalReps = sumExerciseReps(exercises);
  const sessionWithName = useMemo(() => ({ ...session, name }), [session, name]);


  if (!session) return null;

  const handleNameSave = async (newName) => {
    const previousName = name;
    setName(newName);
    try {
      await updateSessionName(session.id, newName);
      // Propagate to the parent only after the cloud write succeeded, so the
      // parent's list stays consistent with the rollback on failure.
      onNameChange?.(session.id, newName);
    } catch (err) {
      console.error('Failed to save session name', err);
      // Revert the optimistic UI update on failure
      setName(previousName);
    }
  };

  const handleDelete = () => {
    setConfirmDelete(false);
    onDelete?.(session.id);
    onClose();
  };

  const sessionStats = [
    { icon: Clock, value: formatDuration(session.duration), label: t('share.duration') },
    { icon: Zap, value: totalReps, label: t('customExercises.typeReps') },
    { icon: Dumbbell, value: exercises.length, label: t('share.exercises') },
  ];

  return (
    <>
    <ModalContainer open={true} onClose={onClose}>
        <ModalHeader title={t('share.sessionDetail')} onClose={onClose} />

        <div className={styles.body}>
          {/* Date & name */}
          <div className={styles.hero}>
            <div className={styles.date}>{formatDateTime(session.date, lang)}</div>
            <InlineNameEditor
              value={name}
              onSave={handleNameSave}
              placeholder={t('share.sessionNamePlaceholder')}
              emptyLabel={t('share.sessionNamePlaceholder')}
              textStyle={{ fontSize: '1.3rem' }}
            />
          </div>

          {/* Stats strip */}
          <div className={styles.stats}>
            {sessionStats.map(({ icon: Icon, value, label }) => (
              <div key={label} className={styles.stat}>
                <Icon size={16} />
                <div className={styles.statVal}>{value}</div>
                <div className={styles.statLab}>{label}</div>
              </div>
            ))}
          </div>

          {/* Exercise list */}
          {exercises.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>{t('share.exercisesCompleted')}</div>
              {exercises.map((ex, i) => {
                const Icon = getIcon(ex.icon);
                const color = getExerciseColor(ex);
                return (
                  <div key={ex.id || i} className={styles.row} style={{ '--ex-color': color }}>
                    <div className={styles.rowIcon}>
                      <Icon size={18} color={color} />
                    </div>
                    <div className={styles.rowName}>{getExerciseLabel(ex)}</div>
                    {ex.weight ? <WeightBadge weight={ex.weight} color={color} /> : null}
                    <div className={styles.rowVal}>
                      {ex.reps}
                      <span className={styles.rowUnit}>
                        {ex.type === 'timer' ? 's' : t('common.reps')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className={styles.footer}>
            <SharePanel
              sessionData={sessionWithName}
              stats={stats}
              isPro={isPro}
              variant="compact"
            />
            <Button
              variant="danger-ghost"
              icon={Trash2}
              className={styles.deleteBtn}
              aria-label={t('common.delete')}
              onClick={() => setConfirmDelete(true)}
            />
          </div>
        </div>
      </ModalContainer>

      <ConfirmDialog
        destructive
        open={confirmDelete}
        title={t('share.deleteSession')}
        message={hasName ? name : formatDateTime(session.date, lang)}
        warning={t('share.deleteSessionWarning')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
