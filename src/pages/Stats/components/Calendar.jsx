import { createDayLevelLookup, LEVEL_COUNT } from '@shared/exerciseLevels.js';
import { LevelEmblem } from '@components/ui/LevelEmblem';
import { memo, useState, useRef, useMemo, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Snowflake } from '@utils/icons';
import { ModalHeader, ModalContainer } from '@components/ui';
import { useTranslation } from 'react-i18next';
import { getLocalDateStr, getDayStatus, DAY_STATUS } from '@shared/dateUtils';
import { useBackHandler } from '@hooks/useBackHandler';
import { isPerfectDay, isCaughtUpDay } from '@utils/statUtils';
import { useProgressStore } from '@store/useProgressStore';
import { useSettingsStore } from '@store/useSettingsStore';
import { CalendarDayDetail } from './CalendarDayDetail';
import styles from '@styles/Calendar.module.css';

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const CalendarDayCell = memo(function CalendarDayCell({
    cell,
    monthName,
    levelLabel,
    isSelected,
    hasNote,
    animDelayMs,
    onToggleDay,
}) {
    const {
        dateString,
        dayOfMonth,
        stateClass,
        isToday,
        isMuted,
        isMissed,
        isFrozen,
        level,
        completedDots,
        dotPx,
    } = cell;

    const cls = [styles.day];
    if (stateClass) cls.push(stateClass);
    if (isToday) cls.push(styles.today);
    if (isSelected) cls.push(styles.selected);

    return (
        <button
            type="button"
            className={cls.join(' ')}
            style={animDelayMs !== undefined ? { animationDelay: `${animDelayMs}ms` } : undefined}
            disabled={isMuted}
            aria-pressed={isSelected}
            aria-label={`${dayOfMonth} ${monthName}${level ? ' · ' + levelLabel : ''}`}
            onClick={() => onToggleDay(dateString)}
        >
            <span className={styles.dayNum}>{dayOfMonth}</span>
            {level > 0 && !isMuted && <LevelEmblem level={level} size={20} label={levelLabel} />}
            {!isMuted && (
                <span className={styles.dots}>
                    {completedDots.map(dot => (
                        <span
                            key={dot.id}
                            className={styles.dot}
                            style={{
                                width: dotPx,
                                height: dotPx,
                                background: dot.color,
                            }}
                        />
                    ))}
                    {isMissed && (
                        <X className={styles.missedIcon} size={dotPx + 6} color="#ef4444" strokeWidth={3} />
                    )}
                    {isFrozen && (
                        <Snowflake className={styles.frozenIcon} size={dotPx + 6} color="#38bdf8" strokeWidth={2.5} />
                    )}
                </span>
            )}
            {hasNote && !isMuted && (
                <span className={styles.noteIndicator} />
            )}
        </button>
    );
});

export function Calendar({ startDate, completions, exercises, isCustom, getDayNumber, onClose, getConfig }) {
    const { t } = useTranslation();
    const frozenDays = useProgressStore(s => s.frozenDays);
    const notes = useProgressStore(s => s.notes);
    const weekStartDay = useSettingsStore(s => s.settings.weekStartDay) || 'monday';
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);
    const [isClosing, setIsClosing] = useState(false);
    const [slideDirection, setSlideDirection] = useState(null); // 'left' | 'right' | null
    const [hasSwitchedMonth, setHasSwitchedMonth] = useState(false);

    // Swipe tracking refs (no re-renders during drag)
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const isDragging = useRef(false);
    const isSwipeLocked = useRef(false); // locks axis after initial movement
    const gridRef = useRef(null);
    const swipeAnimating = useRef(false);

    const handleCloseDetail = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setSelectedDay(null);
            setIsClosing(false);
        }, 150);
    }, []);

    const handleToggleDay = useCallback((dateString) => {
        setSelectedDay(prev => (prev === dateString ? null : dateString));
    }, []);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const changeMonth = (direction) => {
        if (swipeAnimating.current) return;
        swipeAnimating.current = true;
        // direction: 1 = next, -1 = prev
        setSlideDirection(direction === 1 ? 'left' : 'right');
        setTimeout(() => {
            setHasSwitchedMonth(true);
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
                setHasSwitchedMonth(true);
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
    const levelLabels = useMemo(
        () => Array.from({ length: LEVEL_COUNT + 1 }, (_, lvl) => (lvl > 0 ? t('levels.short', { level: lvl }) : '')),
        [t]
    );

    const { cells, monthCompleted, completionRate, monthPerfect } = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const todayStr = getLocalDateStr(new Date());
        const padMonth = String(month + 1).padStart(2, '0');
        const safeExercises = exercises || [];
        const exerciseIds = safeExercises.map(ex => ex.id);
        const getLevelAt = createDayLevelLookup(completions, exerciseIds, weekStartDay);

        // Compute padding: how many empty cells before Day 1
        // getDay() returns 0=Sun, 1=Mon, ... 6=Sat
        let padding;
        if (weekStartDay === 'sunday') {
            padding = firstDay;
        } else {
            padding = firstDay === 0 ? 6 : firstDay - 1;
        }

        const cellList = [];
        for (let i = 0; i < padding; i++) {
            cellList.push({ isPad: true });
        }

        let completed = 0, total = 0, perfect = 0;

        for (let dayOfMonth = 1; dayOfMonth <= daysInMonth; dayOfMonth++) {
            const dateString = `${year}-${padMonth}-${String(dayOfMonth).padStart(2, '0')}`;
            const isFuture = dateString > todayStr;
            const isBeforeStart = dateString < startDate;
            const isToday = dateString === todayStr;
            const dayCompletions = completions[dateString] || {};
            const dayPerfect = !isFuture && !isBeforeStart && isPerfectDay(dayCompletions, safeExercises);

            let status = null;
            if (!isFuture && !isBeforeStart) {
                total++;
                status = getDayStatus(dateString, completions, frozenDays, todayStr, weekStartDay);
                if (status === DAY_STATUS.DONE) completed++;
                if (dayPerfect && !isCustom) perfect++;
            }

            let isMissed = false;
            let isFrozen = false;
            let isPerfect = false;
            let isAnyDone = false;
            let isCaughtUp = false;
            let isMuted = false;

            if (isCustom) {
                isPerfect = dayPerfect;
                isAnyDone = !isPerfect && Object.values(dayCompletions).some(ex => ex?.isCompleted);
                isMuted = isFuture || isBeforeStart;
                isMissed = !isPerfect && !isAnyDone && !isMuted && !isToday;
            } else {
                const resolvedStatus = status ?? getDayStatus(dateString, completions, frozenDays, todayStr, weekStartDay);
                if ((isBeforeStart && resolvedStatus === DAY_STATUS.MISSED) || resolvedStatus === DAY_STATUS.FUTURE) {
                    isMuted = true;
                } else if (resolvedStatus === DAY_STATUS.DONE) {
                    isPerfect = dayPerfect;
                    isAnyDone = !isPerfect;
                    isCaughtUp = isCaughtUpDay(dayCompletions, dateString);
                } else if (resolvedStatus === DAY_STATUS.FROZEN) {
                    isFrozen = true;
                } else if (resolvedStatus === DAY_STATUS.MISSED) {
                    isMissed = true;
                }
            }

            const completedDots = [];
            if (!isMuted) {
                for (let j = 0; j < safeExercises.length; j++) {
                    const ex = safeExercises[j];
                    if (dayCompletions[ex.id]?.isCompleted) {
                        completedDots.push({ id: ex.id, color: ex.color });
                    }
                }
            }

            const level = isMuted ? 0 : getLevelAt(dateString);
            const dotCount = completedDots.length + (isMissed ? 1 : 0);
            let dotPx = 7;
            if (dotCount > 12) dotPx = 4;
            else if (dotCount > 8) dotPx = 5;
            else if (dotCount > 5) dotPx = 6;

            let stateClass = '';
            if (isMuted) stateClass = styles.muted;
            else if (isPerfect) stateClass = styles.perfect;
            else if (isCaughtUp) stateClass = styles.caught;
            else if (isAnyDone) stateClass = styles.done;
            else if (isFrozen) stateClass = styles.frozen;
            else if (isMissed) stateClass = styles.missed;

            cellList.push({
                isPad: false,
                dateString,
                dayOfMonth,
                stateClass,
                isToday,
                isMuted,
                isMissed,
                isFrozen,
                level,
                completedDots,
                dotPx,
            });
        }

        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { cells: cellList, monthCompleted: completed, completionRate: rate, monthPerfect: perfect };
    }, [year, month, startDate, completions, exercises, isCustom, frozenDays, weekStartDay]);

    // Slide-in animation for button navigation
    const gridSlideStyle = slideDirection ? {
        animation: `cal-slide-${slideDirection} 0.2s ease forwards`
    } : {};

    const now = new Date();
    const viewingCurrentMonth = year === now.getFullYear() && month === now.getMonth();
    const goToToday = () => {
        if (viewingCurrentMonth || swipeAnimating.current) return;
        setHasSwitchedMonth(true);
        setCurrentDate(new Date());
    };

    const rawWeekdayLabels = weekStartDay === 'monday'
        ? t('calendar.weekdaysMon', { returnObjects: true })
        : t('calendar.weekdays', { returnObjects: true });
    // Fallback: if weekdaysMon doesn't exist yet, rotate the Sun-first array
    const weekdayLabels = Array.isArray(rawWeekdayLabels) ? rawWeekdayLabels : t('calendar.weekdays', { returnObjects: true });
    const monthName = monthNames[month];

    return (
        <ModalContainer
            open={true}
            onClose={onClose}
            maxWidth="680px"
            ambientGlow
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
                {/* Top bar */}
                <ModalHeader 
                    title={t('dashboard.calendar')} 
                    onClose={onClose} 
                />

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
                        <div className={styles.monthName}>{monthName}</div>
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
                <div
                    ref={gridRef}
                    className={[styles.grid, styles.rise, styles.rise3, hasSwitchedMonth && styles.gridSwitched].filter(Boolean).join(' ')}
                    style={gridSlideStyle}
                >
                    {weekdayLabels.map(d => (
                        <div key={d} className={styles.weekday}>{d}</div>
                    ))}

                    {cells.map((cell, i) => (
                        cell.isPad ? (
                            <div key={`slot-${i}`} className={styles.pad} />
                        ) : (
                            <CalendarDayCell
                                key={`slot-${i}`}
                                cell={cell}
                                monthName={monthName}
                                levelLabel={levelLabels[cell.level]}
                                isSelected={selectedDay === cell.dateString}
                                hasNote={!!notes?.[cell.dateString]}
                                animDelayMs={hasSwitchedMonth ? undefined : i * 10}
                                onToggleDay={handleToggleDay}
                            />
                        )
                    ))}
                </div>

                {/* Legend — calendar states (per-exercise breakdown lives in the day sheet) */}
                <div className={`${styles.legend} ${styles.rise} ${styles.rise4}`}>
                    <div className={styles.legendItem}><span className={`${styles.swatch} ${styles.swPerfect}`} />{t('calendar.perfectDayLegend')}</div>
                    <div className={styles.legendItem}><span className={`${styles.swatch} ${styles.swDone}`} />{t('calendar.completed')}</div>
                    <div className={styles.legendItem}><span className={`${styles.swatch} ${styles.swCaught}`} />{t('calendar.caughtUpDayLegend')}</div>
                    <div className={styles.legendItem}><span className={`${styles.swatch} ${styles.swMissed}`} />{t('calendar.missed')}</div>
                    <div className={styles.legendItem}><span className={`${styles.swatch} ${styles.swFrozen}`} />{t('streakFreeze.frozen')}</div>
                </div>

                {/* Detail popup */}
                {selectedDay && (
                    <>
                        <div onClick={handleCloseDetail} style={{
                            position: 'fixed', inset: 0, zIndex: 199,
                            background: 'rgba(0,0,0,0.5)', opacity: isClosing ? 0 : 1, transition: 'opacity 0.15s'
                        }} />
                        <CalendarDayDetail
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
        </ModalContainer>
    );
}

