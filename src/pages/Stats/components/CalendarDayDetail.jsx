import { useSettingsStore } from '@store/useSettingsStore';
import { getCardioGoal, getCardioWeekEntry } from '@shared/cardioLevels.js';
import { getProgressGoal, getEntryLevel, LEVEL_COUNT } from '@shared/exerciseLevels.js';
import { LevelEmblem } from '@components/ui/LevelEmblem';
import { memo, useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useProgressStore } from '@store/useProgressStore';
import { useBackHandler } from '@hooks/useBackHandler';
import { isCaughtUpDay, calculateRepsForDay } from '@utils/statUtils';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { Star, ShieldAlert, FileText, Check, getIcon } from '@utils/icons';
import styles from '@styles/Calendar.module.css';

/** Isolated note editor so typing never re-renders the exercise breakdown list. */
const DayNoteSection = memo(function DayNoteSection({ dateString, noteText, setNote, t }) {
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

  return (
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
  );
});

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
  const weekStartDay = useSettingsStore(s => s.settings.weekStartDay) || 'monday';
  const { i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  const noteText = useProgressStore(s => s.notes?.[dateString] || '');
  const setNote = useProgressStore(s => s.setNote);

  // Drag state lives in refs (not React state) so dragging mutates the DOM
  // directly instead of re-rendering the whole sheet.
  const startY = useRef(0);
  const dragPx = useRef(0);
  const isDragging = useRef(false);
  const sheetRef = useRef(null);
  const isClosing = externalIsClosing ?? false;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
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
        sheetRef.current.style.transition = 'none';
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
      sheetRef.current.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      sheetRef.current.style.transform = 'translateY(0px)';
      setTimeout(() => {
        if (sheetRef.current) {
          sheetRef.current.style.transform = '';
        }
      }, 420);
    }
    dragPx.current = 0;
  };

  const levelLabels = useMemo(
    () => Array.from({ length: LEVEL_COUNT + 1 }, (_, lvl) => t('levels.short', { level: lvl })),
    [t]
  );

  const formattedDate = useMemo(
    () => new Date(`${dateString}T00:00:00`).toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }),
    [dateString, i18n.language]
  );

  // ── Precomputed day summary & exercise rows ──────────────────────────
  const {
    dayNum,
    isCaughtUp,
    doneCount,
    totalCount,
    totalReps,
    successRate,
    isPerfectDay,
    rows,
  } = useMemo(() => {
    const safeExercises = exercises || [];
    const num = getDayNumber(dateString);
    const dayCompletions = completions[dateString] || {};
    const caughtUp = isCaughtUpDay(dayCompletions, dateString);
    const doneCnt = safeExercises.filter(ex => dayCompletions[ex.id]?.isCompleted).length;
    const totalCnt = safeExercises.length;
    const reps = calculateRepsForDay(dayCompletions, num, safeExercises, getConfig, dateString, startDate);
    const rate = totalCnt > 0 ? Math.round((doneCnt / totalCnt) * 100) : 0;
    const perfect = totalCnt > 0 && doneCnt === totalCnt;

    const exRows = safeExercises.map(ex => {
      const ExIcon = getIcon(ex.icon);
      const isCardio = ex.id === 'running' || ex.id === 'cycling';
      let entry = dayCompletions[ex.id];
      if (isCardio) {
        const weekEntry = getCardioWeekEntry(completions, ex.id, dateString, weekStartDay);
        entry = weekEntry?.dateStr <= dateString ? weekEntry : null;
      }
      const goal = isCardio
        ? getCardioGoal(ex.id, startDate, dateString, entry, weekStartDay)
        : getProgressGoal(ex, num, entry);
      const done = !!(entry || {}).isCompleted;
      const level = getEntryLevel(entry);
      const currentCount = (entry || {}).count || (done ? goal : 0);
      const unitLabel = t(isCardio ? 'cardio.units.km' : 'common.reps');
      let valueText;
      if (done) {
        valueText = isCardio ? (currentCount / 1000).toFixed(2) : currentCount.toLocaleString();
      } else if (isCardio) {
        valueText = `${(currentCount / 1000).toFixed(2)}/${(goal / 1000).toFixed(2)}`;
      } else {
        valueText = `${currentCount}/${goal}`;
      }

      return {
        id: ex.id,
        color: ex.color,
        ExIcon,
        label: getExerciseLabel(ex, t),
        done,
        level,
        unitLabel,
        valueText,
      };
    });

    return {
      dayNum: num,
      isCaughtUp: caughtUp,
      doneCount: doneCnt,
      totalCount: totalCnt,
      totalReps: reps,
      successRate: rate,
      isPerfectDay: perfect,
      rows: exRows,
    };
  }, [completions, dateString, exercises, getConfig, getDayNumber, startDate, t, weekStartDay]);

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
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
          // --sheet-bg is 97% opaque across every theme, so skipping the 80vh
          // backdrop-filter blur saves heavy mobile GPU passes with identical visuals.
          background: 'var(--sheet-bg)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
          transform: `translateY(${translateYPct}%)`,
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
              <div className={styles.detailDate}>{formattedDate}</div>
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
            {rows.map(({ id, color, ExIcon, label, done, level, unitLabel, valueText }) => (
              <div
                key={id}
                className={`${styles.exRow} ${done ? '' : styles.exRowTodo}`}
                style={done ? { background: `${color}16`, borderColor: `${color}3a` } : undefined}
              >
                <div className={styles.exIcon} style={done ? { background: `${color}26` } : undefined}>
                  <ExIcon size={18} color={done ? color : 'var(--text-secondary)'} />
                </div>
                <div className={styles.exMain}>
                  <div className={styles.exName} style={done ? { color } : undefined}>
                    {label}
                  </div>
                </div>
                <span className={styles.exReps} style={{ color: done ? color : 'var(--text-secondary)' }}>
                  {valueText}<span className={styles.exRepsUnit} style={done ? undefined : { marginLeft: 2 }}>{unitLabel}</span>
                </span>
                <LevelEmblem level={level} size={26} showZero label={levelLabels[level]} />
              </div>
            ))}

            <DayNoteSection
              key={dateString}
              dateString={dateString}
              noteText={noteText}
              setNote={setNote}
              t={t}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
