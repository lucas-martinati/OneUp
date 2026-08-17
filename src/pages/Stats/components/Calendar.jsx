import { useState, useRef, useMemo } from 'react';
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

export function Calendar({ startDate, completions, exercises, isCustom, getDayNumber, onClose, getConfig }) {
    const { t } = useTranslation();
    const frozenDays = useProgressStore(s => s.frozenDays);
    const notes = useProgressStore(s => s.notes);
    const weekStartDay = useSettingsStore(s => s.settings.weekStartDay) || 'monday';
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

    const { days, monthCompleted, completionRate, monthPerfect, perfectSet } = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const daysArr = [];
        // Compute padding: how many empty cells before Day 1
        // getDay() returns 0=Sun, 1=Mon, ... 6=Sat
        let padding;
        if (weekStartDay === 'sunday') {
            // Sunday-first: column 0 is Sunday, so padding = firstDay directly
            padding = firstDay;
        } else {
            // Monday-first: column 0 is Monday
            padding = firstDay === 0 ? 6 : firstDay - 1;
        }
        for (let i = 0; i < padding; i++) daysArr.push(null);
        for (let i = 1; i <= daysInMonth; i++) daysArr.push(new Date(year, month, i));

        const todayStr = getLocalDateStr(new Date());
        let completed = 0, total = 0, perfect = 0;
        const pSet = new Set();

        daysArr.filter(Boolean).forEach(date => {
            const dStr = getLocalDateStr(date);
            const isFuture = dStr > todayStr;
            const isBeforeStart = dStr < startDate;
            if (!isFuture && !isBeforeStart) {
                total++;
                if (getDayStatus(dStr, completions, frozenDays, todayStr, weekStartDay) === DAY_STATUS.DONE) completed++;
                const day = completions[dStr] || {};
                if (isPerfectDay(day, exercises)) {
                    pSet.add(dStr);
                    if (!isCustom) perfect++;
                }
            }
        });

        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { days: daysArr, monthCompleted: completed, completionRate: rate, monthPerfect: perfect, perfectSet: pSet };
    }, [year, month, startDate, completions, exercises, isCustom, frozenDays, weekStartDay]);

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

    const rawWeekdayLabels = weekStartDay === 'monday'
        ? t('calendar.weekdaysMon', { returnObjects: true })
        : t('calendar.weekdays', { returnObjects: true });
    // Fallback: if weekdaysMon doesn't exist yet, rotate the Sun-first array
    const weekdayLabels = Array.isArray(rawWeekdayLabels) ? rawWeekdayLabels : t('calendar.weekdays', { returnObjects: true });

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
                        if (!date) return <div key={`pad-${i}-${year}-${month}`} className={styles.pad} />;

                        const dateString = getLocalDateStr(date);
                        const isFuture = dateString > todayStr;
                        const isBeforeStart = dateString < startDate;
                        const isToday = dateString === todayStr;

                        let isMissed = false;
                        let isFrozen = false;
                        let isPerfect = false;
                        let isAnyDone = false;
                        let isCaughtUp = false;
                        let isMuted = false;

                        const dayCompletions = completions[dateString] || {};

                        if (isCustom) {
                            // Custom routine view (subset of exercises)
                            isPerfect = perfectSet.has(dateString);
                            isAnyDone = !isPerfect && Object.values(dayCompletions).some(ex => ex?.isCompleted);
                            isMuted = isFuture || isBeforeStart;
                            isMissed = !isPerfect && !isAnyDone && !isMuted && !isToday;
                        } else {
                            // Global stats view
                            const status = getDayStatus(dateString, completions, frozenDays, todayStr, weekStartDay);
                            if (isBeforeStart && status === DAY_STATUS.MISSED) {
                                isMuted = true;
                            } else if (status === DAY_STATUS.FUTURE) {
                                isMuted = true;
                            } else if (status === DAY_STATUS.DONE) {
                                isPerfect = perfectSet.has(dateString);
                                isAnyDone = !isPerfect;
                                isCaughtUp = isCaughtUpDay(dayCompletions, dateString);
                            } else if (status === DAY_STATUS.FROZEN) {
                                isFrozen = true;
                            } else if (status === DAY_STATUS.MISSED) {
                                isMissed = true;
                            }
                        }
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
                        else if (isFrozen) cls.push(styles.frozen);
                        else if (isMissed) cls.push(styles.missed);
                        if (isToday) cls.push(styles.today);
                        if (isSelected) cls.push(styles.selected);
                        
                        const hasNote = !!notes?.[dateString];

                        return (
                            <button
                                key={dateString}
                                type="button"
                                className={cls.join(' ')}
                                style={{ animationDelay: `${i * 10}ms` }}
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
                                                        background: ex.color
                                                    }}
                                                />
                                            ) : null
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
                    })}
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

