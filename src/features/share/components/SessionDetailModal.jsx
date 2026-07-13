import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Clock, Trash2, Dumbbell, Zap } from '@utils/icons';
import { getIcon } from '@utils/icons';
import { IconButton, Button, ConfirmDialog, WeightBadge, InlineNameEditor } from '@components/ui';
import { Z_INDEX } from '@utils/zIndex';
import { updateSessionName } from '@features/share/services/sessionHistoryService';
import { getExerciseLabel, getExerciseColor } from '@utils/exerciseLabel';
import { sumExerciseReps } from '@utils/stats';
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

  // Escape backs out one level: name edit first, then the panel.
  // The delete dialog handles its own Escape (and sits above us).
  // The delete dialog handles its own Escape (and sits above us).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || confirmDelete) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmDelete, onClose]);

  if (!session) return null;

  const handleNameSave = async (newName) => {
    setName(newName);
    updateSessionName(session.id, newName);
    onNameChange?.(session.id, newName);
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
    <div className="fade-in modal-overlay" style={{ zIndex: Z_INDEX.TOAST + 1 }}>
      <div className="modal-content">
        <div className={styles.header}>
          <h2 className={`panel-title ${styles.title}`}>
            {t('share.sessionDetail')}
          </h2>
          <IconButton icon={X} variant="glass" onClick={onClose} aria-label={t('common.close')} />
        </div>

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
      </div>

      <ConfirmDialog
        open={confirmDelete}
        destructive
        title={t('share.deleteSession')}
        message={hasName ? name : formatDateTime(session.date, lang)}
        warning={t('share.deleteSessionWarning')}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
