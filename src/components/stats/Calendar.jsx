import { useState, useRef, useEffect, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getLocalDateStr } from '../../utils/dateUtils';
import { registerBackHandler } from '../../utils/backHandler';
import { getDailyGoal } from '../../config/exercises';
import ICON_MAP from '../../utils/iconMap';

export function Calendar({ startDate, completions, exercises, getDayNumber, onClose, settings }) { // Added settings prop
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

    const monthNames = t('calendar.months', { returnObjects: true });

    const todayStr = getLocalDateStr(new Date());

    const { days, monthCompleted, completionRate } = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        const daysArr = [];
        for (let i = 0; i < firstDay; i++) daysArr.push(null);
        for (let i = 1; i <= daysInMonth; i++) daysArr.push(new Date(year, month, i));

        const todayStr = getLocalDateStr(new Date());
        let completed = 0, total = 0;
        
        daysArr.filter(Boolean).forEach(date => {
            const dStr = getLocalDateStr(date);
            const isFuture = dStr > todayStr;
            const isBeforeStart = dStr < startDate;
            if (!isFuture && !isBeforeStart) {
                total++;
                const day = completions[dStr];
                if (day && Object.values(day).some(ex => ex?.isCompleted)) completed++;
            }
        });
        
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return { days: daysArr, monthCompleted: completed, completionRate: rate };
    }, [year, month, startDate, completions]);

    // Slide-in animation for button navigation
    const gridSlideStyle = slideDirection ? {
        animation: `cal-slide-${slideDirection} 0.2s ease forwards`
    } : {};

    return (
        <div
            className="fade-in modal-overlay"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ zIndex: 100, touchAction: 'pan-y', overflowX: 'hidden' }}
        >
            <div className="modal-content" style={{
                maxWidth: '640px', width: '100%', margin: '0 auto',
                padding: 'var(--spacing-md)',
                paddingTop: 'calc(var(--spacing-md) + env(safe-area-inset-top))',
                paddingBottom: 'calc(var(--spacing-lg) + env(safe-area-inset-bottom))'
            }}>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 'var(--spacing-md)'
            }}>
                <h2 className="rainbow-gradient" style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>
                    {t('calendar.title')}
                </h2>
                <button onClick={onClose} className="hover-lift glass" style={{
                    background: 'var(--surface-hover)', border: 'none', borderRadius: '50%',
                    width: '44px', height: '44px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer'
                }}>
                    <X size={24} />
                </button>
            </div>

            {/* Month Stats */}
            <div className="glass-premium slide-up" style={{
                padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--spacing-md)',
                background: 'linear-gradient(135deg, rgba(109,40,217,0.15), rgba(139,92,246,0.15))',
                display: 'flex', justifyContent: 'space-around', gap: 'var(--spacing-sm)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#10b981' }}>{monthCompleted}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('calendar.completed')}</div>
                </div>
                <div style={{ width: '1px', background: 'var(--border-default)' }} />
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#8b5cf6' }}>{completionRate}%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t('calendar.success')}</div>
                </div>
            </div>

            {/* Month navigation */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 'var(--spacing-md)', padding: '0 var(--spacing-xs)'
            }}>
                <button onClick={goToPrevMonth} className="hover-lift glass" style={navBtnStyle}>
                    <ChevronLeft size={24} />
                </button>
                <span style={{
                    fontSize: '1.3rem', fontWeight: '700',
                    background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                    {monthNames[month]} {year}
                </span>
                <button onClick={goToNextMonth} className="hover-lift glass" style={navBtnStyle}>
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Grid */}
            <div ref={gridRef} style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '6px', flex: 1, alignContent: 'start',
                willChange: 'transform, opacity',
                ...gridSlideStyle
            }}>
                {/* Weekday headers */}
                {t('calendar.weekdays', { returnObjects: true }).map(d => (
                    <div key={d} style={{
                        textAlign: 'center', color: 'var(--text-secondary)',
                        fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase',
                        letterSpacing: '0.5px', marginBottom: '4px'
                    }}>{d}</div>
                ))}

                {days.map((date, i) => {
                    if (!date) return <div key={`pad-${i}`} />;

                    const dateString = getLocalDateStr(date);
                    const isFuture = dateString > todayStr;
                    const isBeforeStart = dateString < startDate;
                    const isToday = dateString === todayStr;

                    const dayCompletions = completions[dateString] || {};
                    const isAnyDone = Object.values(dayCompletions).some(ex => ex?.isCompleted);
                    const isMissed = !isAnyDone && !isFuture && !isBeforeStart;
                    const completedCount = exercises.filter(ex => dayCompletions[ex.id]?.isCompleted).length;
                    const totalCount = completedCount + (isMissed ? 1 : 0);
                    const dotSize = totalCount > 12 ? '4px' : totalCount > 8 ? '5px' : totalCount > 4 ? '6px' : '7px';
                    const dotGap = totalCount > 12 ? '1px' : totalCount > 8 ? '2px' : '3px';

                    let bgColor = 'var(--surface-subtle)';
                    if (isToday) bgColor = 'rgba(139, 92, 246, 0.1)';
                    if (isAnyDone) bgColor = 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.15))';
                    if (isMissed) bgColor = 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.1))';

                    const isSelected = selectedDay === dateString;

                    return (
                        <div
                            key={i}
                            onClick={() => {
                                if (!isFuture && !isBeforeStart) {
                                    setSelectedDay(isSelected ? null : dateString);
                                }
                            }}
                            className={!isFuture && !isBeforeStart ? 'hover-lift' : ''}
                            style={{
                                aspectRatio: '1', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                background: bgColor, borderRadius: 'var(--radius-md)',
                                position: 'relative',
                                minWidth: 0, overflow: 'hidden',
                                opacity: isFuture || isBeforeStart ? 0.25 : 1,
                                border: isSelected
                                    ? '2px solid var(--border-strong)'
                                    : isToday
                                        ? '2px solid rgba(139,92,246,0.5)'
                                        : '2px solid transparent',
                                transition: 'all 0.2s ease',
                                cursor: !isFuture && !isBeforeStart ? 'pointer' : 'default'
                            }}
                        >
                            <span style={{
                                fontSize: '0.85rem', fontWeight: isToday ? '700' : '600',
                                color: isToday ? '#8b5cf6' : 'var(--text-primary)',
                                marginBottom: '2px'
                            }}>
                                {date.getDate()}
                            </span>

                            {/* Exercise dots */}
                            {!isFuture && !isBeforeStart && exercises && (
                                <div style={{
                                    display: 'flex',
                                    gap: dotGap,
                                    flexWrap: 'wrap',
                                    justifyContent: 'center',
                                    alignContent: 'center',
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    overflow: 'hidden',
                                    padding: '0 2px',
                                    flex: 1,
                                    minHeight: 0
                                }}>
                                    {exercises.map(ex => {
                                        const exData = dayCompletions[ex.id];
                                        if (!exData?.isCompleted) return null;
                                        return (
                                            <div key={ex.id} style={{
                                                width: dotSize, height: dotSize, borderRadius: '50%',
                                                background: ex.color, flexShrink: 0,
                                                boxShadow: `0 0 4px ${ex.color}88`
                                            }} />
                                        );
                                    })}
                                    {/* Red X if nothing done and not future */}
                                    {isMissed && (
                                        <X size={parseInt(dotSize) + 6} color="#ef4444" strokeWidth={3} style={{ flexShrink: 0, filter: 'drop-shadow(0 0 3px rgba(239,68,68,0.5))' }} />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
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
                        settings={settings} // Pass settings to DayDetail
                        t={t}
                    />
                </>
            )}

            {/* Legend */}
            <div className="glass" style={{
                marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm)',
                borderRadius: 'var(--radius-lg)', display: 'flex',
                flexWrap: 'wrap', gap: '10px', justifyContent: 'center', fontSize: '0.75rem'
            }}>
                {exercises && exercises.map(ex => (
                    <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: ex.color, boxShadow: `0 0 4px ${ex.color}`
                        }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{ex.label || t('exercises.' + ex.id)}</span>
                    </div>
                ))}
            </div>
            </div>
        </div>
    );
}

/** Day detail bottom sheet */
function DayDetail({ dateString, completions, exercises, getDayNumber, onClose, isClosing: externalIsClosing, settings, t }) { // Added settings prop
    const dayNum = getDayNumber(dateString);
    const dayCompletions = completions[dateString] || {};
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const startY = useRef(0);
    const currentDragY = useRef(0);
    const sheetRef = useRef(null);
    const isClosing = externalIsClosing ?? false;

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    useEffect(() => {
        history.pushState({ sheetOpen: true }, '');
        const handlePopState = (e) => {
            onClose();
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [onClose]);

    useEffect(() => {
        const unregister = registerBackHandler(() => {
            onClose();
            return true;
        });
        return unregister;
    }, [onClose]);

    const handleTouchStart = (e) => {
        const contentEl = sheetRef.current?.querySelector('[data-scroll-content]');
        const canScrollUp = contentEl ? contentEl.scrollTop > 0 : false;
        
        const touchY = e.touches[0].clientY;
        const isNearTop = touchY < 100;
        
        if (!canScrollUp || isNearTop) {
            startY.current = e.touches[0].clientY;
            setIsDragging(true);
        }
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;
        if (diff > 0) {
            const newDragY = diff * 0.13;
            currentDragY.current = newDragY;
            setDragY(newDragY);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (currentDragY.current > 15) {
            onClose();
        } else {
            currentDragY.current = 0;
            setDragY(0);
        }
    };

    const handleMouseDown = (e) => {
        startY.current = e.clientY;
        setIsDragging(true);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const currentY = e.clientY;
        const diff = currentY - startY.current;
        if (diff > 0) {
            const newDragY = diff * 0.13;
            currentDragY.current = newDragY;
            setDragY(newDragY);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (currentDragY.current > 15) {
            onClose();
        } else {
            currentDragY.current = 0;
            setDragY(0);
        }
    };

    const translateY = dragY;

    return (
        <div
            ref={sheetRef}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
                background: 'var(--card-bg)',
                backdropFilter: isDragging ? 'none' : 'blur(20px)',
                WebkitBackdropFilter: isDragging ? 'none' : 'blur(20px)',
                borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                padding: '20px',
                paddingBottom: 'calc(var(--spacing-lg) + env(safe-area-inset-bottom))',
                boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
                transform: `translateY(${isClosing ? 100 : (isVisible ? translateY : 100)}%)`,
                transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), backdrop-filter 0.3s ease',
                willChange: 'transform',
                maxHeight: '80vh', display: 'flex', flexDirection: 'column'
            }}>
            <div style={{
                width: '40px', height: '4px', borderRadius: '2px',
                background: 'var(--sheet-handle)', margin: '0 auto 16px',
                cursor: 'grab'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {dateString}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{t('calendar.day', { num: dayNum })}</div>
                </div>
                <div style={{
                    fontSize: '1.4rem', fontWeight: '800',
                    background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                    {exercises.reduce((sum, ex) => {
                        const exData = dayCompletions[ex.id];
                        if (!exData?.isCompleted) return sum;
                        return sum + getDailyGoal(ex, dayNum, settings?.difficultyMultiplier);
                    }, 0)} <span style={{ fontSize: '0.7rem', WebkitTextFillColor: 'var(--text-secondary)' }}>{t('common.reps')}</span>
                </div>
            </div>

            <div data-scroll-content style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', scrollbarWidth: 'none', msOverflowStyle: 'none', position: 'relative', zIndex: 1 }} className="no-scrollbar">
                {exercises && exercises.map(ex => {
                    const ExIcon = ICON_MAP[ex.icon] || Dumbbell;
                    const goal = getDailyGoal(ex, dayNum, settings?.difficultyMultiplier);
                    const exData = dayCompletions[ex.id] || { isCompleted: false };
                    return (
                        <div key={ex.id} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '10px 14px', borderRadius: 'var(--radius-md)',
                            background: exData.isCompleted ? `${ex.color}18` : 'var(--surface-subtle)',
                            border: `1px solid ${exData.isCompleted ? ex.color + '44' : 'var(--border-muted)'}`,
                            flexShrink: 0
                        }}>
                            <div style={{
                                width: '34px', height: '34px', borderRadius: '50%',
                                background: `${ex.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <ExIcon size={16} color={ex.color} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: exData.isCompleted ? ex.color : 'var(--text-primary)' }}>
                                    {ex.label || t('exercises.' + ex.id)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {t('calendar.repsCount', { done: exData.isCompleted ? goal : 0, goal })}
                                </div>
                            </div>
                            {exData.isCompleted && (
                                <CheckCircle2 size={20} color={ex.color} strokeWidth={2} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const navBtnStyle = {
    color: 'var(--text-secondary)', background: 'var(--surface-muted)',
    border: 'none', borderRadius: '50%', width: 'var(--touch-min)', height: 'var(--touch-min)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
};
