import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export function Calendar({ startDate, completions, onClose }) {
    const [currentDate, setCurrentDate] = useState(new Date());

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

    return (
        <div className="fade-in" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(5, 5, 5, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            padding: 'var(--spacing-lg)'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--spacing-lg)'
            }}>
                <h2 className="title-gradient" style={{ margin: 0, fontSize: '2rem' }}>History</h2>
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
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

            {/* Calendar Controls */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                padding: '0 10px'
            }}>
                <button onClick={handlePrevMonth} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none' }}>
                    <ChevronLeft size={32} />
                </button>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {monthNames[month]} {year}
                </span>
                <button onClick={handleNextMonth} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none' }}>
                    <ChevronRight size={32} />
                </button>
            </div>

            {/* Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '10px',
                flex: 1,
                alignContent: 'start'
            }}>
                {/* Weekday Headers */}
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <div key={d} style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold' }}>
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
                    const isFuture = dateString > new Date().toISOString().split('T')[0];
                    const isBeforeStart = dateString < startDate;

                    // Determine Dot Color
                    // Green if done
                    // Red if missed (calculated as: strictly before today AND not done AND not before start)
                    // No dot if future or before start

                    const isMissed = !isCompleted && !isFuture && !isBeforeStart;

                    return (
                        <div key={i} style={{
                            aspectRatio: '1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            position: 'relative',
                            opacity: isFuture ? 0.3 : 1
                        }}>
                            <span style={{ fontSize: '1rem', fontWeight: '600' }}>{date.getDate()}</span>

                            {isCompleted && (
                                <div style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: 'var(--success)',
                                    marginTop: '4px',
                                    boxShadow: '0 0 5px var(--success)'
                                }} />
                            )}

                            {isMissed && (
                                <div style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: 'var(--error)',
                                    marginTop: '4px'
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
