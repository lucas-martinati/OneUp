import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useProgressStore } from '@store/useProgressStore';
import { useBackHandler } from '@hooks/useBackHandler';
import { isCaughtUpDay, calculateRepsForDay } from '@utils/statUtils';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { getDailyGoal } from '@config/exercises';
import { getCurrentWeekNumber } from '@shared/dateUtils';
import { Star, ShieldAlert, CheckCircle2, FileText, Check, getIcon } from '@utils/icons';
import { DifficultyBadge } from '@components/ui';
import styles from '@styles/Calendar.module.css';

/** Day detail bottom sheet */
export function CalendarDayDetail({
  dateString,
  completions,
  exercises,
  getDayNumber,
  onClose,
  isClosing: externalIsClosing,
  getConfig,
  t,
  startDate
}) {
  const { i18n } = useTranslation();
  const dayNum = getDayNumber(dateString);
  const dayCompletions = completions[dateString] || {};
  const isCaughtUp = isCaughtUpDay(dayCompletions, dateString);
  const [isVisible, setIsVisible] = useState(false);
  
  const notes = useProgressStore(s => s.notes);
  const setNote = useProgressStore(s => s.setNote);
  const noteText = notes?.[dateString] || '';
  const [localNote, setLocalNote] = useState(noteText);
  const [noteSaved, setNoteSaved] = useState(false);
  const noteDirty = localNote !== noteText;

  const handleSaveNote = () => {
    if (noteDirty) {
      setNote(dateString, localNote);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 1800);
    }
  };

  // Blur is only enabled once the entrance slide finishes. Keeping the
  // backdrop-filter live while the sheet translates forces the browser to
  // re-blur the whole backdrop every frame, which makes the slide-in
  // extremely choppy on desktop (large viewport = expensive blur).
  const [entranceDone, setEntranceDone] = useState(false);
  // Drag state lives in refs (not React state) so dragging mutates the DOM
  // directly instead of re-rendering the whole sheet. Re-rendering the
  // exercise list on every pointer-move is what made the drag choppy.
  const startY = useRef(0);
  const dragPx = useRef(0);
  const isDragging = useRef(false);
  const sheetRef = useRef(null);
  const isClosing = externalIsClosing ?? false;

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  useBackHandler(() => {
    onClose();
    return true;
  }, true);

  // Unified pointer drag handlers — mutate the DOM via sheetRef instead of
  // React state so a drag never re-renders the sheet.
  const beginDrag = (y) => {
    const contentEl = sheetRef.current?.querySelector('[data-scroll-content]');
    const canScrollUp = contentEl ? contentEl.scrollTop > 0 : false;
    if (!canScrollUp || y < 100) {
      startY.current = y;
      dragPx.current = 0;
      isDragging.current = true;
    }
  };

  const moveDrag = (y) => {
    if (!isDragging.current) return;
    const diff = y - startY.current;
    if (diff > 0) {
      const px = diff * 0.5;
      dragPx.current = px;
      if (sheetRef.current) {
        // No transition + no blur while following the finger — both
        // would force expensive per-frame recompositing.
        sheetRef.current.style.transition = 'none';
        sheetRef.current.style.backdropFilter = 'none';
        sheetRef.current.style.webkitBackdropFilter = 'none';
        sheetRef.current.style.transform = `translateY(${px}px)`;
      }
    }
  };

  const endDrag = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (dragPx.current > 80) {
      onClose();
    } else if (dragPx.current > 0 && sheetRef.current) {
      // Snap back; blur is only re-enabled once the sheet has settled so
      // it never re-blurs while still moving.
      sheetRef.current.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), backdrop-filter 0.3s ease';
      sheetRef.current.style.transform = 'translateY(0px)';
      setTimeout(() => {
        if (sheetRef.current) {
          sheetRef.current.style.transform = '';
          sheetRef.current.style.backdropFilter = 'blur(20px)';
          sheetRef.current.style.webkitBackdropFilter = 'blur(20px)';
        }
      }, 420);
    }
    dragPx.current = 0;
  };

  // Only blur when the sheet is settled at rest — never while it is
  // translating (entrance / drag / close), to avoid per-frame re-blur jank.
  const showBlur = entranceDone && !isClosing;

  // ── Day summary ──────────────────────────────────────────────────────
  const doneCount = exercises ? exercises.filter(ex => dayCompletions[ex.id]?.isCompleted).length : 0;
  const totalCount = exercises ? exercises.length : 0;
  const totalReps = calculateRepsForDay(dayCompletions, dayNum, exercises, getConfig, dateString, startDate);
  const successRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const isPerfectDay = totalCount > 0 && doneCount === totalCount;

  let translateYPct = 100;
  if (!isClosing && isVisible) {
    translateYPct = 0;
  }

  return (
    <div className={styles.previewOverlay}>
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => beginDrag(e.touches[0].clientY)}
        onTouchMove={(e) => moveDrag(e.touches[0].clientY)}
        onTouchEnd={endDrag}
        onMouseDown={(e) => beginDrag(e.clientY)}
        onMouseMove={(e) => moveDrag(e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTransitionEnd={(e) => {
          if (e.propertyName === 'transform' && isVisible && !isClosing) {
            setEntranceDone(true);
          }
        }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
          background: 'var(--sheet-bg)',
          backdropFilter: showBlur ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: showBlur ? 'blur(20px)' : 'none',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
          transform: `translateY(${translateYPct}%)`,
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), backdrop-filter 0.3s ease',
          willChange: 'transform',
          maxHeight: '80vh', display: 'flex', flexDirection: 'column',
          pointerEvents: 'auto'
        }}
      >
        {/* Background extension below the sheet: the spring easing overshoots
            past bottom:0, lifting the sheet up and briefly exposing a gap
            underneath. This fills that gap so nothing shows through. */}
        <div aria-hidden style={{
          position: 'absolute', top: '100%', left: 0, right: 0, height: '40vh',
          background: 'var(--sheet-bg)', pointerEvents: 'none'
        }} />
        <div style={{
          width: '40px', height: '4px', borderRadius: '2px',
          background: 'var(--sheet-handle)', margin: 'var(--space-4) auto',
          cursor: 'grab'
        }} />

        <div className={styles.previewContent}>
          <div className={styles.detailHead}>
            <div style={{ minWidth: 0 }}>
              <div className={styles.detailDate}>
                {new Date(`${dateString}T00:00:00`).toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <div className={styles.detailDay}>{t('calendar.day', { num: dayNum })}</div>
            </div>
            {(isPerfectDay || isCaughtUp) && (
              <div className={styles.detailPills}>
                {isPerfectDay && (
                  <span className={`${styles.statusPill} ${styles.pillPerfect}`}>
                    <Star size={12} color="#fcd34d" fill="#fcd34d" /> {t('calendar.perfectDayLegend')}
                  </span>
                )}
                {isCaughtUp && (
                  <span className={`${styles.statusPill} ${styles.pillCaught}`}>
                    <ShieldAlert size={12} color="#f59e0b" /> {t('calendar.caughtUp')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Summary ribbon — at-a-glance recap */}
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={`${styles.statValue} ${styles.statValueAccent}`}>{doneCount}/{totalCount}</div>
              <div className={styles.statLabel}>{t('share.exercises')}</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <div className={`${styles.statValue} ${styles.statValueGold}`}>{totalReps.toLocaleString()}</div>
              <div className={styles.statLabel}>{t('common.reps')}</div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <div className={`${styles.statValue} ${styles.statValueSuccess}`}>{successRate}%</div>
              <div className={styles.statLabel}>{t('calendar.success')}</div>
            </div>
          </div>

          <div data-scroll-content className={`${styles.exList} no-scrollbar`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {exercises && exercises.map(ex => {
              const ExIcon = getIcon(ex.icon);
              const exDiff = getConfig(ex.id, dateString).difficulty;
              const isCardio = ex.id === 'running' || ex.id === 'cycling';
              const num = isCardio ? getCurrentWeekNumber(startDate, new Date(dateString)) : dayNum;
              const goal = getDailyGoal(ex, num, exDiff, isCardio);
              const done = !!(dayCompletions[ex.id] || {}).isCompleted;
              const currentCount = (dayCompletions[ex.id] || {}).count || (done ? goal : 0);
              return (
                <div
                  key={ex.id}
                  className={`${styles.exRow} ${done ? '' : styles.exRowTodo}`}
                  style={done ? { background: `${ex.color}16`, borderColor: `${ex.color}3a` } : undefined}
                >
                  <div className={styles.exIcon} style={done ? { background: `${ex.color}26` } : undefined}>
                    <ExIcon size={18} color={done ? ex.color : 'var(--text-secondary)'} />
                  </div>
                  <div className={styles.exMain}>
                    <div className={styles.exName} style={done ? { color: ex.color } : undefined}>
                      {getExerciseLabel(ex, t)}
                    </div>
                    <div className={styles.exSub}>
                      <DifficultyBadge difficulty={exDiff} />
                    </div>
                  </div>
                  {done ? (
                    <>
                      <span className={styles.exReps} style={{ color: ex.color }}>
                        {currentCount.toLocaleString()}<span className={styles.exRepsUnit}>{t('common.reps')}</span>
                      </span>
                      <CheckCircle2 size={22} color={ex.color} strokeWidth={2.2} />
                    </>
                  ) : (
                    <>
                      <span className={styles.exReps} style={{ color: 'var(--text-secondary)' }}>
                        {currentCount.toLocaleString()}/{goal.toLocaleString()}<span className={styles.exRepsUnit} style={{ marginLeft: 2 }}>{t('common.reps')}</span>
                      </span>
                      <span className={styles.exTodoMark} aria-hidden />
                    </>
                  )}
                </div>
              );
            })}

            <div className={styles.noteSection}>
              <div className={styles.noteHeader}>
                <FileText size={16} className={styles.noteIcon} />
                <span>{t('calendar.notes')}</span>
                {noteSaved && (
                  <span className={styles.noteSavedBadge}>
                    <Check size={12} /> {t('calendar.noteSaved')}
                  </span>
                )}
              </div>
              <textarea
                className={styles.noteInput}
                placeholder={t('calendar.addNotePlaceholder')}
                value={localNote}
                onChange={(e) => setLocalNote(e.target.value)}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
              {noteDirty && (
                <button
                  type="button"
                  className={styles.noteSaveBtn}
                  onClick={handleSaveNote}
                  onPointerDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <Check size={16} />
                  {t('common.save')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
