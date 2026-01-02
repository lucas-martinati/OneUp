import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Check, Trophy, Calendar as CalendarIcon, PieChart, PawPrint } from 'lucide-react';
import { Calendar } from './Calendar';
import { Stats } from './Stats';

export function Dashboard({ getDayNumber, getTotalPushups, toggleCompletion, completions, startDate, userStartDate }) {
    const getLocalDateStr = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [today, setToday] = useState(getLocalDateStr(new Date()));
    const [showCalendar, setShowCalendar] = useState(false);
    const [showStats, setShowStats] = useState(false);

    const dayNumber = getDayNumber(today);
    const isCompleted = completions[today];
    const totalPushups = getTotalPushups();

    const effectiveStart = userStartDate || startDate;
    const isFuture = today < effectiveStart;

    // With single button, we just toggle. The HOOK handles the time detection.
    const handleComplete = () => {
        // If currently false, we are completing -> Confetti
        if (!isCompleted) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6d28d9', '#8b5cf6', '#0ea5e9', '#ffffff']
            });
        }
        toggleCompletion(today);
    };

    return (
        <div className="fade-in" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            gap: 'var(--spacing-md)',
            paddingBottom: 'var(--spacing-lg)'
        }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--spacing-sm) 0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                        src="/pwa-512x512.png"
                        alt="OneUp Logo"
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            objectFit: 'cover'
                        }}
                    />
                    <span style={{ fontWeight: '600' }}>OneUp</span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        onClick={() => setShowStats(true)}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-primary)',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <PieChart size={18} />
                    </button>
                    <div style={{
                        background: 'rgba(255,255,255,0.1)',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '500'
                    }}>
                        <Trophy size={14} color="#fbbf24" />
                        <span>{totalPushups}</span>
                    </div>
                </div>
            </header>

            {/* Main Counter */}
            <main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--spacing-lg)'
            }}>
                {!isFuture ? (
                    <>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontSize: '1rem',
                                color: 'var(--text-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                marginBottom: 'var(--spacing-xs)'
                            }}>
                                Day {dayNumber}
                            </div>
                            <div className="title-gradient" style={{
                                fontSize: '6rem',
                                fontWeight: '800',
                                lineHeight: 1,
                                marginBottom: 'var(--spacing-xs)'
                            }}>
                                {dayNumber}
                            </div>
                            <div style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
                                Pushups Today
                            </div>
                        </div>

                        {/* Single Action Button */}
                        <button
                            onClick={handleComplete}
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                // If done, show success color. If not, subtle outline
                                background: isCompleted ? 'var(--success)' : 'transparent',
                                border: isCompleted ? 'none' : '2px solid var(--accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                transform: isCompleted ? 'scale(1.1)' : 'scale(1)',
                                boxShadow: isCompleted ? '0 0 30px rgba(16, 185, 129, 0.4)' : 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <Check size={50} color={isCompleted ? 'white' : 'var(--accent)'} strokeWidth={3} />
                        </button>

                        {isCompleted && (
                            <div className="fade-in" style={{
                                color: 'var(--success)',
                                fontWeight: '600',
                                marginTop: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                {isCompleted.timeOfDay ? (
                                    <>
                                        <span>Verified {isCompleted.timeOfDay.charAt(0).toUpperCase() + isCompleted.timeOfDay.slice(1)}</span>
                                    </>
                                ) : (
                                    <span>Day Complete!</span>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                        <h2 style={{ marginBottom: '10px' }}>Waiting to Start</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Challenge starts on <strong>{effectiveStart}</strong>.
                        </p>
                    </div>
                )}
            </main>

            {/* Calendar Button */}
            <button
                onClick={() => setShowCalendar(true)}
                className="glass"
                style={{
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer'
                }}
            >
                <CalendarIcon size={20} />
                Open Calendar
            </button>

            {/* Calendar Modal */}
            {showCalendar && (
                <Calendar
                    startDate={startDate}
                    completions={completions}
                    onClose={() => setShowCalendar(false)}
                />
            )}

            {/* Stats Modal */}
            {showStats && (
                <Stats
                    completions={completions}
                    onClose={() => setShowStats(false)}
                />
            )}
        </div>
    );
}
