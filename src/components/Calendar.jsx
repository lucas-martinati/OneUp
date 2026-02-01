import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';

export function Calendar({ startDate, completions, onClose }) {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Helper to get local date string (not UTC)
    const getLocalDateStr = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helpers
    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay(); // 0 = Sun

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // Generate calendar grid
    const days = [];
    // Padding for start of month
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }

    // Calculate stats for current month
    const monthStats = days.filter(d => d).reduce((acc, date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const dStr = String(date.getDate()).padStart(2, '0');
        const dateString = `${y}-${m}-${dStr}`;

        const isCompleted = completions[dateString];
        const isFuture = dateString > getLocalDateStr(new Date());
        const isBeforeStart = dateString < startDate;

        if (!isFuture && !isBeforeStart) {
            acc.total++;
            if (isCompleted) acc.completed++;
        }
        return acc;
    }, { completed: 0, total: 0 });

    const completionRate = monthStats.total > 0
        ? Math.round((monthStats.completed / monthStats.total) * 100)
        : 0;

    return (
        <div className="fade-in" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(5, 5, 5, 0.97)',
            backdropFilter: 'blur(16px)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            padding: 'var(--spacing-md)',
            paddingTop: 'calc(var(--spacing-md) + env(safe-area-inset-top))',
            paddingBottom: 'calc(var(--spacing-md) + env(safe-area-inset-bottom))',
            overflowY: 'auto'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-md)'
            }}>
                <h2 className="rainbow-gradient" style={{
                    margin: 0,
                    fontSize: '2rem',
                    fontWeight: '800'
                }}>
                    History
                </h2>
                <button
                    onClick={onClose}
                    className="hover-lift glass"
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    <X size={24} />
                </button>
            </div>

            {/* Month Stats */}
            <div className="glass-premium slide-up" style={{
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--spacing-md)',
                background: 'linear-gradient(135deg, rgba(109, 40, 217, 0.15), rgba(139, 92, 246, 0.15))',
                display: 'flex',
                justifyContent: 'space-around',
                gap: 'var(--spacing-sm)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#10b981' }}>
                        {monthStats.completed}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Completed
                    </div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#8b5cf6' }}>
                        {completionRate}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Success Rate
                    </div>
                </div>
            </div>

            {/* Calendar Controls */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-md)',
                padding: '0 var(--spacing-xs)'
            }}>
                <button
                    onClick={handlePrevMonth}
                    className="hover-lift glass"
                    style={{
                        color: 'var(--text-secondary)',
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <ChevronLeft size={24} />
                </button>
                <span style={{
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    {monthNames[month]} {year}
                </span>
                <button
                    onClick={handleNextMonth}
                    className="hover-lift glass"
                    style={{
                        color: 'var(--text-secondary)',
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '8px',
                flex: 1,
                alignContent: 'start'
            }}>
                {/* Weekday Headers */}
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} style={{
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '4px'
                    }}>
                        {d}
                    </div>
                ))}

                {days.map((date, i) => {
                    if (!date) return <div key={`pad-${i}`} />;

                    // Format YYYY-MM-DD
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const dStr = String(date.getDate()).padStart(2, '0');
                    const dateString = `${y}-${m}-${dStr}`;

                    const isCompleted = completions[dateString];
                    const isFuture = dateString > getLocalDateStr(new Date());
                    const isBeforeStart = dateString < startDate;
                    const isToday = dateString === getLocalDateStr(new Date());

                    const isMissed = !isCompleted && !isFuture && !isBeforeStart;

                    // Determine styling
                    let bgColor = 'rgba(255,255,255,0.03)';
                    let borderColor = 'transparent';
                    let iconColor = null;

                    if (isToday) {
                        borderColor = 'rgba(139, 92, 246, 0.5)';
                        bgColor = 'rgba(139, 92, 246, 0.1)';
                    }

                    if (isCompleted) {
                        bgColor = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))';
                        iconColor = '#10b981';
                    } else if (isMissed) {
                        bgColor = 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15))';
                        iconColor = '#ef4444';
                    }

                    return (
                        <div
                            key={i}
                            className={!isFuture && !isBeforeStart ? 'hover-lift' : ''}
                            style={{
                                aspectRatio: '1',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: bgColor,
                                borderRadius: 'var(--radius-md)',
                                position: 'relative',
                                opacity: isFuture || isBeforeStart ? 0.3 : 1,
                                border: `2px solid ${borderColor}`,
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <span style={{
                                fontSize: '0.95rem',
                                fontWeight: isToday ? '700' : '600',
                                color: isToday ? '#8b5cf6' : 'var(--text-primary)',
                                marginBottom: '2px'
                            }}>
                                {date.getDate()}
                            </span>

                            {iconColor && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '4px',
                                    right: '4px',
                                    animation: isCompleted ? 'scaleIn 0.3s ease' : 'none'
                                }}>
                                    {isCompleted ? (
                                        <CheckCircle2 size={14} color={iconColor} strokeWidth={2.5} />
                                    ) : (
                                        <Circle size={10} color={iconColor} fill={iconColor} />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="glass" style={{
                marginTop: 'var(--spacing-md)',
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                justifyContent: 'space-around',
                fontSize: '0.8rem',
                gap: 'var(--spacing-xs)',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} color="#10b981" />
                    <span style={{ color: 'var(--text-secondary)' }}>Completed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Circle size={10} color="#ef4444" fill="#ef4444" />
                    <span style={{ color: 'var(--text-secondary)' }}>Missed</span>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    <div style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '3px',
                        border: '2px solid rgba(139, 92, 246, 0.5)',
                        background: 'rgba(139, 92, 246, 0.1)'
                    }} />
                    <span style={{ color: 'var(--text-secondary)' }}>Today</span>
                </div>
            </div>
        </div>
    );
}
