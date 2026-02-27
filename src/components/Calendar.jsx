import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Dumbbell, ArrowDownUp, ArrowUp, Zap } from 'lucide-react';
import { getLocalDateStr } from '../utils/dateUtils';

const ICON_MAP = { Dumbbell, ArrowDownUp, ArrowUp, Zap };

export function Calendar({ startDate, completions, exercises, getDayNumber, onClose }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null); // dateString for detail popup

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    // Month stats
    const todayStr = getLocalDateStr(new Date());
    let monthCompleted = 0, monthTotal = 0;
    days.filter(Boolean).forEach(date => {
        const dStr = getLocalDateStr(date);
        const isFuture = dStr > todayStr;
        const isBeforeStart = dStr < startDate;
        if (!isFuture && !isBeforeStart) {
            monthTotal++;
            const day = completions[dStr];
            if (day && Object.values(day).some(ex => ex?.isCompleted)) monthCompleted++;
        }
    });
    const completionRate = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;

    return (
        <div className="fade-in" style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(5, 5, 5, 0.97)', backdropFilter: 'blur(16px)', zIndex: 100,
            display: 'flex', flexDirection: 'column', padding: 'var(--spacing-md)',
            paddingTop: 'calc(var(--spacing-md) + env(safe-area-inset-top))',
            paddingBottom: 'calc(var(--spacing-md) + env(safe-area-inset-bottom))',
            overflowY: 'auto'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 'var(--spacing-md)'
            }}>
                <h2 className="rainbow-gradient" style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>
                    Historique
                </h2>
                <button onClick={onClose} className="hover-lift glass" style={{
                    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                    width: '44px', height: '44px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white', cursor: 'pointer'
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
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Complétés</div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#8b5cf6' }}>{completionRate}%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Réussite</div>
                </div>
            </div>

            {/* Month navigation */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 'var(--spacing-md)', padding: '0 var(--spacing-xs)'
            }}>
                <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="hover-lift glass" style={navBtnStyle}>
                    <ChevronLeft size={24} />
                </button>
                <span style={{
                    fontSize: '1.3rem', fontWeight: '700',
                    background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                    {monthNames[month]} {year}
                </span>
                <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="hover-lift glass" style={navBtnStyle}>
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '6px', flex: 1, alignContent: 'start'
            }}>
                {/* Weekday headers */}
                {['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'].map(d => (
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

                    let bgColor = 'rgba(255,255,255,0.03)';
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
                                opacity: isFuture || isBeforeStart ? 0.25 : 1,
                                border: isSelected
                                    ? '2px solid rgba(255,255,255,0.5)'
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
                                <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {exercises.map(ex => {
                                        const exData = dayCompletions[ex.id];
                                        if (!exData?.isCompleted) return null;
                                        return (
                                            <div key={ex.id} style={{
                                                width: '5px', height: '5px', borderRadius: '50%',
                                                background: ex.color,
                                                boxShadow: `0 0 3px ${ex.color}88`
                                            }} />
                                        );
                                    })}
                                    {/* Red dot if nothing done and not future */}
                                    {isMissed && (
                                        <div style={{
                                            width: '5px', height: '5px', borderRadius: '50%',
                                            background: '#ef4444'
                                        }} />
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Detail popup */}
            {selectedDay && (
                <DayDetail
                    dateString={selectedDay}
                    completions={completions}
                    exercises={exercises}
                    getDayNumber={getDayNumber}
                    onClose={() => setSelectedDay(null)}
                />
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
                        <span style={{ color: 'var(--text-secondary)' }}>{ex.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Day detail bottom sheet */
function DayDetail({ dateString, completions, exercises, getDayNumber, onClose }) {
    const dayNum = getDayNumber(dateString);
    const dayCompletions = completions[dateString] || {};

    return (
        <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
            background: 'rgba(10,10,15,0.97)', backdropFilter: 'blur(20px)',
            borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
            padding: 'var(--spacing-md)',
            paddingBottom: 'calc(var(--spacing-lg) + env(safe-area-inset-bottom))',
            boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
            animation: 'slideUp 0.25s ease'
        }}>
            {/* Handle */}
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {dateString}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>Jour {dayNum}</div>
                </div>
                <button onClick={onClose} style={{
                    background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
                    width: '36px', height: '36px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer'
                }}>
                    <X size={18} color="var(--text-secondary)" />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {exercises && exercises.map(ex => {
                    const ExIcon = ICON_MAP[ex.icon] || Dumbbell;
                    const goal = Math.max(1, Math.ceil(dayNum * ex.multiplier));
                    const exData = dayCompletions[ex.id] || { isCompleted: false };
                    return (
                        <div key={ex.id} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '10px 14px', borderRadius: 'var(--radius-md)',
                            background: exData.isCompleted ? `${ex.color}18` : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${exData.isCompleted ? ex.color + '44' : 'rgba(255,255,255,0.06)'}`
                        }}>
                            <div style={{
                                width: '34px', height: '34px', borderRadius: '50%',
                                background: `${ex.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <ExIcon size={16} color={ex.color} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: exData.isCompleted ? ex.color : 'var(--text-primary)' }}>
                                    {ex.label}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {exData.isCompleted ? goal : 0} / {goal} reps
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
    color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)',
    border: 'none', borderRadius: '50%', width: '40px', height: '40px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
};
