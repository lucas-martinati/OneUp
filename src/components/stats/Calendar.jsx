import { useState, useRef, useEffect, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle2, ShieldAlert, Star } from '@utils/icons';
import { IconButton } from '@components/ui';
import { useTranslation } from 'react-i18next';
import { getLocalDateStr } from '@utils/dateUtils';
import { useBackHandler } from '@hooks/useBackHandler';
import { getDailyGoal } from '@config/exercises';
import { getIcon } from '@utils/icons';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { isPerfectDay, calculateRepsForDay, isCaughtUpDay } from '@utils/statUtils';
import { getCurrentWeekNumber } from '@utils/dateUtils';
import { DifficultyBadge } from '@components/ui/DifficultyBadge';
import styles from '@styles/Calendar.module.css';

export function Calendar({ startDate, completions, exercises, isCustom, getDayNumber, onClose, getConfig }) {
    const { t } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);
    const [isClosing, setIsClosing] = useState(false);
    const [slideDirection, setSlideDirection] = useState(null); // 'left' | 'right' | null

    // Swipe tracking refs (no re-renders during drag)
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const isDragging = useRef(false);
    const isSwipeLocked = useRef(false); // locks axis after initial movement
    const gridRef = useRef(null);
    const swipeAnimating = useRef(false);

    const handleCloseDetail = () => {
        setIsClosing(true);
        setTimeout(() => {
            setSelectedDay(null);
            setIsClosing(false);
        }, 150);
    };

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const changeMonth = (direction) => {
        if (swipeAnimating.current) return;
        swipeAnimating.current = true;
        // direction: 1 = next, -1 = prev
        setSlideDirection(direction === 1 ? 'left' : 'right');
        setTimeout(() => {
            setCurrentDate(new Date(year, month + direction, 1));
            setSlideDirection(null);
            swipeAnimating.current = false;
        }, 200);
    };

    const goToPrevMonth = () => changeMonth(-1);
    const goToNextMonth = () => changeMonth(1);

    const handleTouchStart = (e) => {
        if (swipeAnimating.current || selectedDay) return;
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        isDragging.current = true;
        isSwipeLocked.current = false;
        if (gridRef.current) {
            gridRef.current.style.transition = 'none';
        }
    };

    const handleTouchMove = (e) => {
        if (!isDragging.current || touchStartX.current === null) return;
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - touchStartX.current;
        const diffY = currentY - touchStartY.current;

        // Lock to horizontal axis after 10px of movement
        if (!isSwipeLocked.current && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
            isSwipeLocked.current = true;
            if (Math.abs(diffY) > Math.abs(diffX)) {
                // Vertical scroll — abort swipe
                isDragging.current = false;
                return;
            }
        }

        if (isSwipeLocked.current && gridRef.current) {
            // Apply a dampened translateX to follow the finger
            const dampened = diffX * 0.4;
            const opacity = Math.max(0.3, 1 - Math.abs(diffX) / 600);
            gridRef.current.style.transform = `translateX(${dampened}px)`;
            gridRef.current.style.opacity = opacity;
        }
    };

    const handleTouchEnd = (e) => {
        if (!isDragging.current || touchStartX.current === null) {
            isDragging.current = false;
            return;
        }
        isDragging.current = false;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX;
        const threshold = 50;

        if (gridRef.current) {
            gridRef.current.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
        }

        if (Math.abs(diff) > threshold) {
            // Animate out, then change month
            if (gridRef.current) {
                const direction = diff > 0 ? -1 : 1;
                gridRef.current.style.transform = `translateX(${direction * 60}px)`;
                gridRef.current.style.opacity = '0';
            }
            setTimeout(() => {
                if (diff > 0) setCurrentDate(new Date(year, month + 1, 1));
                else setCurrentDate(new Date(year, month - 1, 1));
                // Reset grid for slide-in
                if (gridRef.current) {
                    gridRef.current.style.transition = 'none';
                    gridRef.current.style.transform = `translateX(${diff > 0 ? 40 : -40}px)`;
                    gridRef.current.style.opacity = '0';
                    requestAnimationFrame(() => {
                        if (gridRef.current) {
                            gridRef.current.style.transition = 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease';
                            gridRef.current.style.transform = 'translateX(0)';
                            gridRef.current.style.opacity = '1';
                        }
                    });
                }
            }, 180);
        } else {
            // Snap back
            if (gridRef.current) {
                gridRef.current.style.transform = 'translateX(0)';
                gridRef.current.style.opacity = '1';
            }
        }
        touchStartX.current = null;
        touchStartY.current = null;
    };

    // Handle back button
    useBackHandler(() => {
        if (selectedDay) {
            handleCloseDetail();
            return true;
        }
        onClose();
        return true;
    }, true);

    const monthNames = t('calendar.months', { returnObjects: true });

    const todayStr = getLocalDateStr(new Date());

    const { days, monthCompleted, completionRate, monthPerfect } = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const daysArr = [];
        for (let i = 0; i < firstDay; i++) daysArr.push(null);
        for (let i = 1; i <= daysInMonth; i++) daysArr.push(new Date(year, month, i));

        const todayStr = getLocalDateStr(new Date());
        let completed = 0, total = 0, perfect = 0;

        daysArr.filter(Boolean).forEach(date => {
            const dStr = getLocalDateStr(date);
            const isFuture = dStr > todayStr;
            const isBeforeStart = dStr < startDate;
            if (!isFuture && !isBeforeStart) {
                total++;
                const day = completions[dStr];
                if (day && Object.values(day).some(ex => ex?.isCompleted)) completed++;
                if (!isCustom && day && isPerfectDay(day, exercises)) perfect++;
            }
        });

        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { days: daysArr, monthCompleted: completed, completionRate: rate, monthPerfect: perfect };
    }, [year, month, startDate, completions, exercises, isCustom]);

    // Slide-in animation for button navigation
    const gridSlideStyle = slideDirection ? {
        animation: `cal-slide-${slideDirection} 0.2s ease forwards`
    } : {};

    const now = new Date();
    const viewingCurrentMonth = year === now.getFullYear() && month === now.getMonth();
    const goToToday = () => {
        if (viewingCurrentMonth || swipeAnimating.current) return;
        setCurrentDate(new Date());
    };

    const weekdayLabels = t('calendar.weekdays', { returnObjects: true });

    return (
        <div
            className="fade-in modal-overlay"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ zIndex: 100, touchAction: 'pan-y', overflowX: 'hidden' }}
        >
            <div className={`modal-content ${styles.shell}`}>
                {/* Top bar */}
                <div className={`${styles.topBar} ${styles.rise} ${styles.rise1}`}>
                    <h2 className="panel-title" style={{ margin: 0, textAlign: 'left' }}>
                        {t('dashboard.calendar')}
                    </h2>
                    <IconButton icon={X} variant="glass" onClick={onClose} className="hover-lift" aria-label="Close" style={{ flexShrink: 0 }} />
                </div>

                {/* Month navigation — the hero */}
                <div className={`${styles.monthNav} ${styles.rise} ${styles.rise1}`}>
                    <button onClick={goToPrevMonth} aria-label="Previous month" className={styles.navBtn}>
                        <ChevronLeft size={22} />
                    </button>
                    <div
                        className={styles.monthLabel}
                        onClick={goToToday}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToToday(); } }}
                    >
                        <div className={styles.monthName}>{monthNames[month]}</div>
                        <div className={styles.monthYear}>{year}</div>
                        {!viewingCurrentMonth && <span className={styles.todayHint}>{'↩'} {t('calendar.today')}</span>}
                    </div>
                    <button onClick={goToNextMonth} aria-label="Next month" className={styles.navBtn}>
                        <ChevronRight size={22} />
                    </button>
                </div>

                {/* Stats ribbon */}
                <div className={`${styles.stats} ${styles.rise} ${styles.rise2}`}>
                    <div className={styles.stat}>
                        <div className={`${styles.statValue} ${styles.statValueGold}`}>{monthPerfect}</div>
                        <div className={styles.statLabel}>{t('common.perfectDays')}</div>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.stat}>
                        <div className={`${styles.statValue} ${styles.statValueAccent}`}>{monthCompleted}</div>
                        <div className={styles.statLabel}>{t('calendar.completed')}</div>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.stat}>
                        <div className={`${styles.statValue} ${styles.statValueSuccess}`}>{completionRate}%</div>
                        <div className={styles.statLabel}>{t('calendar.success')}</div>
                    </div>
                </div>

                {/* Day grid */}
                <div ref={gridRef} className={`${styles.grid} ${styles.rise} ${styles.rise3}`} style={gridSlideStyle}>
                    {weekdayLabels.map(d => (
                        <div key={d} className={styles.weekday}>{d}</div>
                    ))}

                    {days.map((date, i) => {
                        if (!date) return <div key={`pad-${i}`} className={styles.pad} />;

                        const dateString = getLocalDateStr(date);
                        const isFuture = dateString > todayStr;
                        const isBeforeStart = dateString < startDate;
                        const isToday = dateString === todayStr;
                        const isMuted = isFuture || isBeforeStart;

                        const dayCompletions = completions[dateString] || {};
                        const isPerfect = !isCustom && isPerfectDay(dayCompletions, exercises);
                        const isAnyDone = !isPerfect && Object.values(dayCompletions).some(ex => ex?.isCompleted);
                        const isCaughtUp = isCaughtUpDay(dayCompletions, dateString);
                        // Today is never shown as "missed" — it isn't a failure yet.
                        const isMissed = !isPerfect && !isAnyDone && !isMuted && !isToday;
                        const completedCount = exercises.filter(ex => dayCompletions[ex.id]?.isCompleted).length;
                        const isSelected = selectedDay === dateString;

                        // Exercise dots scale down as the day gets busier so they stay inside the cell.
                        const dotCount = completedCount + (isMissed ? 1 : 0);
                        let dotPx = 7;
                        if (dotCount > 12) {
                            dotPx = 4;
                        } else if (dotCount > 8) {
                            dotPx = 5;
                        } else if (dotCount > 5) {
                            dotPx = 6;
                        }

                        const cls = [styles.day];
                        if (isMuted) cls.push(styles.muted);
                        else if (isPerfect) cls.push(styles.perfect);
                        else if (isCaughtUp) cls.push(styles.caught);
                        else if (isAnyDone) cls.push(styles.done);
                        else if (isMissed) cls.push(styles.missed);
                        if (isToday) cls.push(styles.today);
                        if (isSelected) cls.push(styles.selected);

                        return (
                            <button
                                key={i}
                                type="button"
                                className={cls.join(' ')}
                                disabled={isMuted}
                                aria-pressed={isSelected}
                                aria-label={`${date.getDate()} ${monthNames[month]}`}
                                onClick={() => setSelectedDay(isSelected ? null : dateString)}
                            >
                                <span className={styles.dayNum}>{date.getDate()}</span>
                                {!isMuted && (
                                    <span className={styles.dots}>
                                        {exercises && exercises.map(ex => (
                                            dayCompletions[ex.id]?.isCompleted ? (
                                                <span
                                                    key={ex.id}
                                                    className={styles.dot}
                                                    style={{
                                                        width: dotPx, height: dotPx,
                                                        background: ex.color,
                                                        boxShadow: `0 0 4px ${ex.color}99`
                                                    }}
                                                />
                                            ) : null
                                        ))}
                                        {isMissed && (
                                            <X size={dotPx + 6} color="#ef4444" strokeWidth={3} style={{ filter: 'drop-shadow(0 0 3px rgba(239,68,68,0.5))' }} />
                                        )}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Legend — calendar states (per-exercise breakdown lives in the day sheet) */}
                <div className={`${styles.legend} ${styles.rise} ${styles.rise4}`}>
                    <div className={styles.legendItem}><span className={`${styles.swatch} ${styles.swPerfect}`} />{t('calendar.perfectDayLegend')}</div>
                    <div className={styles.legendItem}><span className={`${styles.swatch} ${styles.swDone}`} />{t('calendar.completed')}</div>
                    <div className={styles.legendItem}><span className={`${styles.swatch} ${styles.swCaught}`} />{t('calendar.caughtUpDayLegend')}</div>
                    <div className={styles.legendItem}><span className={`${styles.swatch} ${styles.swMissed}`} />{t('calendar.missed')}</div>
                </div>

                {/* Detail popup */}
                {selectedDay && (
                    <>
                        <div onClick={handleCloseDetail} style={{
                            position: 'fixed', inset: 0, zIndex: 199,
                            background: 'rgba(0,0,0,0.5)', opacity: isClosing ? 0 : 1, transition: 'opacity 0.15s'
                        }} />
                        <DayDetail
                            dateString={selectedDay}
                            completions={completions}
                            exercises={exercises}
                            getDayNumber={getDayNumber}
                            onClose={handleCloseDetail}
                            isClosing={isClosing}
                            getConfig={getConfig}
                            t={t}
                            startDate={startDate}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

/** Day detail bottom sheet */
function DayDetail({ dateString, completions, exercises, getDayNumber, onClose, isClosing: externalIsClosing, getConfig, t, startDate }) {
    const { i18n } = useTranslation();
    const dayNum = getDayNumber(dateString);
    const dayCompletions = completions[dateString] || {};
    const isCaughtUp = isCaughtUpDay(dayCompletions, dateString);
    const [isVisible, setIsVisible] = useState(false);
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
        <div className="modal-overlay" style={{
            background: 'transparent', zIndex: 199,
            overflow: 'hidden', pointerEvents: 'none'
        }}>
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
                borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
                transform: `translateY(${translateYPct}%)`,
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), backdrop-filter 0.3s ease',
                willChange: 'transform',
                maxHeight: '80vh', display: 'flex', flexDirection: 'column',
                pointerEvents: 'auto'
            }}>
            {/* Background extension below the sheet: the spring easing overshoots
                past bottom:0, lifting the sheet up and briefly exposing a gap
                underneath. This fills that gap so nothing shows through. */}
            <div aria-hidden style={{
                position: 'absolute', top: '100%', left: 0, right: 0, height: '40vh',
                background: 'var(--sheet-bg)', pointerEvents: 'none'
            }} />
            <div style={{
                width: '40px', height: '4px', borderRadius: '2px',
                background: 'var(--sheet-handle)', margin: 'var(--spacing-sm) auto',
                cursor: 'grab'
            }} />

            <div className="modal-content" style={{
                flex: 1, overflowY: 'auto',
                paddingTop: 0,
                paddingBottom: 0,
                maxWidth: 'none',
                display: 'flex', flexDirection: 'column'
            }}>
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
                                <Star size={11} color="#fcd34d" fill="#fcd34d" /> {t('calendar.perfectDayLegend')}
                            </span>
                        )}
                        {isCaughtUp && (
                            <span className={`${styles.statusPill} ${styles.pillCaught}`}>
                                <ShieldAlert size={11} color="#f59e0b" /> {t('calendar.caughtUp')}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Summary ribbon — at-a-glance recap */}
            <div className={styles.stats} style={{ marginBottom: '14px' }}>
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
                                    {t('calendar.repsCount', { done: done ? goal : 0, goal })}
                                    <DifficultyBadge difficulty={exDiff} />
                                </div>
                            </div>
                            {done ? (
                                <>
                                    <span className={styles.exReps} style={{ color: ex.color }}>
                                        {goal.toLocaleString()}<span className={styles.exRepsUnit}>{t('common.reps')}</span>
                                    </span>
                                    <CheckCircle2 size={22} color={ex.color} strokeWidth={2.2} />
                                </>
                            ) : (
                                <span className={styles.exTodoMark} aria-hidden />
                            )}
                        </div>
                    );
                })}
            </div>
            </div>
        </div>
        </div>
    );
}

