import { useState, useEffect, useMemo } from 'react';
import {
    X, Play, Check, Trophy,
    Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints,
    Flame, Square, MoveDown, MoveDiagonal
} from 'lucide-react';
import { EXERCISES, getDailyGoal } from '../config/exercises';
import { Counter } from './Counter';
import { Timer } from './Timer';
import { CSSConfetti } from './CSSConfetti';
import { registerBackHandler } from '../utils/backHandler';

const ICON_MAP = { Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints, Flame, Square, MoveDown, MoveDiagonal };

export function WorkoutSession({
    onClose, today, dayNumber, getExerciseCount, updateExerciseCount, completions, settings
}) {
    const [phase, setPhase] = useState('config'); // 'config' | 'running' | 'done'
    const [queue, setQueue] = useState([]); // ordered list of exercise IDs
    const [currentIdx, setCurrentIdx] = useState(0);

    // Back handler
    useEffect(() => {
        const unreg = registerBackHandler(() => {
            if (phase === 'running') {
                setPhase('config');
                return true;
            }
            onClose();
            return true;
        });
        return unreg;
    }, [phase, onClose]);

    // Exercise info with current state
    const exerciseInfo = useMemo(() => {
        return EXERCISES.map(ex => {
            const goal = getDailyGoal(ex, dayNumber, settings?.difficultyMultiplier);
            const count = getExerciseCount(today, ex.id);
            const done = completions[today]?.[ex.id]?.isCompleted || count >= goal;
            return { ...ex, goal, count, done };
        });
    }, [dayNumber, today, completions, getExerciseCount, settings?.difficultyMultiplier]);

    // Toggle in queue
    const toggleExercise = (id) => {
        setQueue(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // Start session
    const startSession = () => {
        if (queue.length < 1) return;
        setCurrentIdx(0);
        setPhase('running');
    };

    // ── Running phase ──────────────────────────────────────────

    // Current exercise
    const currentExId = queue[currentIdx];
    const currentEx = currentExId ? EXERCISES.find(e => e.id === currentExId) : null;
    const currentGoal = currentEx ? getDailyGoal(currentEx, dayNumber, settings?.difficultyMultiplier) : 0;
    const currentCount = currentEx ? getExerciseCount(today, currentExId) : 0;
    const currentDone = currentEx ? (completions[today]?.[currentExId]?.isCompleted || currentCount >= currentGoal) : false;

    // Advance to next non-completed exercise
    const advanceToNext = () => {
        // Find next non-completed exercise in queue after current
        for (let offset = 1; offset <= queue.length; offset++) {
            const nextIdx = (currentIdx + offset) % queue.length;
            const nextId = queue[nextIdx];
            const ex = exerciseInfo.find(e => e.id === nextId);
            if (ex && !ex.done) {
                setCurrentIdx(nextIdx);
                return;
            }
        }
        // All done
        setPhase('done');
    };

    // ── CONFIG PHASE ────────────────────────────────────────────
    if (phase === 'config') {
        return (
            <div className="fade-in" style={{
                position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.97)',
                zIndex: 1000, display: 'flex', flexDirection: 'column',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: 'var(--spacing-md)'
                }}>
                    <h2 style={{
                        margin: 0, fontSize: '1.5rem', fontWeight: '800',
                        background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Nouvelle séance
                    </h2>
                    <button onClick={onClose} className="hover-lift" style={{
                        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                        width: '40px', height: '40px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'white', cursor: 'pointer'
                    }}>
                        <X size={22} />
                    </button>
                </div>

                <div style={{
                    flex: 1, overflowY: 'auto', padding: '0 var(--spacing-md)',
                    display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'
                }}>
                    {/* Exercise selection */}
                    <div style={{
                        fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px',
                        color: 'var(--text-secondary)', fontWeight: '600'
                    }}>
                        Choisis l'ordre des exercices
                    </div>

                    {/* Selected order */}
                    {queue.length > 0 && (
                        <div style={{
                            display: 'flex', gap: '6px', flexWrap: 'wrap',
                            padding: '10px', borderRadius: 'var(--radius-md)',
                            background: 'rgba(129,140,248,0.06)',
                            border: '1px solid rgba(129,140,248,0.12)'
                        }}>
                            {queue.map((id, i) => {
                                const ex = EXERCISES.find(e => e.id === id);
                                if (!ex) return null;
                                const Icon = ICON_MAP[ex.icon] || Dumbbell;
                                return (
                                    <div key={id} style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        padding: '4px 10px', borderRadius: '16px',
                                        background: `${ex.color}20`, border: `1px solid ${ex.color}40`
                                    }}>
                                        <span style={{
                                            fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-secondary)',
                                            width: '14px', textAlign: 'center'
                                        }}>{i + 1}</span>
                                        <Icon size={14} color={ex.color} />
                                        <span style={{
                                            fontSize: '0.7rem', fontWeight: '600', color: ex.color
                                        }}>{ex.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Exercise grid */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '8px'
                    }}>
                        {exerciseInfo.map(ex => {
                            const Icon = ICON_MAP[ex.icon] || Dumbbell;
                            const selected = queue.includes(ex.id);
                            const orderNum = selected ? queue.indexOf(ex.id) + 1 : null;
                            return (
                                <button
                                    key={ex.id}
                                    onClick={() => !ex.done && toggleExercise(ex.id)}
                                    disabled={ex.done}
                                    style={{
                                        padding: '14px 10px', borderRadius: 'var(--radius-md)',
                                        background: ex.done
                                            ? 'rgba(255,255,255,0.03)'
                                            : selected
                                                ? `linear-gradient(135deg, ${ex.color}25, ${ex.color}12)`
                                                : 'rgba(255,255,255,0.05)',
                                        border: selected
                                            ? `2px solid ${ex.color}80`
                                            : '2px solid rgba(255,255,255,0.08)',
                                        color: ex.done ? '#555' : selected ? ex.color : 'var(--text-secondary)',
                                        cursor: ex.done ? 'default' : 'pointer',
                                        opacity: ex.done ? 0.4 : 1,
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', gap: '6px',
                                        transition: 'all 0.2s ease',
                                        position: 'relative'
                                    }}
                                >
                                    {ex.done && (
                                        <div style={{
                                            position: 'absolute', top: '6px', right: '6px',
                                            background: '#10b981', borderRadius: '50%',
                                            width: '16px', height: '16px', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Check size={10} color="white" />
                                        </div>
                                    )}
                                    {orderNum && (
                                        <div style={{
                                            position: 'absolute', top: '6px', left: '6px',
                                            background: ex.color, borderRadius: '50%',
                                            width: '18px', height: '18px', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.6rem', fontWeight: '800', color: 'white'
                                        }}>
                                            {orderNum}
                                        </div>
                                    )}
                                    <Icon size={24} />
                                    <span style={{
                                        fontSize: '0.75rem', fontWeight: '600'
                                    }}>{ex.label}</span>
                                    <span style={{
                                        fontSize: '0.6rem', opacity: 0.6
                                    }}>
                                        {ex.done ? 'Complété ✓' : `${ex.goal - ex.count} restantes`}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Launch button */}
                <div style={{ padding: 'var(--spacing-md)' }}>
                    <button
                        onClick={startSession}
                        disabled={queue.length < 1}
                        className="hover-lift"
                        style={{
                            width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)',
                            background: queue.length >= 1
                                ? 'linear-gradient(135deg, #818cf8, #6366f1)'
                                : 'rgba(255,255,255,0.05)',
                            border: 'none', color: 'white',
                            fontSize: '1rem', fontWeight: '700',
                            cursor: queue.length >= 1 ? 'pointer' : 'default',
                            opacity: queue.length >= 1 ? 1 : 0.4,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '8px', transition: 'all 0.2s ease'
                        }}
                    >
                        <Play size={20} />
                        Lancer ({queue.length} exercice{queue.length > 1 ? 's' : ''})
                    </button>
                </div>
            </div>
        );
    }

    // ── RUNNING PHASE = render Counter or Timer ─────────────────
    if (phase === 'running' && currentEx) {
        const isTimer = currentExId === 'planche';

        const Component = isTimer ? Timer : Counter;

        return (
            <Component
                exerciseConfig={currentEx}
                onClose={onClose}
                dailyGoal={currentGoal}
                currentCount={currentCount}
                onUpdateCount={(newCount) => updateExerciseCount(today, currentExId, newCount, currentGoal)}
                isCompleted={currentDone}
                dayNumber={dayNumber}
                onNext={advanceToNext}
            />
        );
    }

    // ── DONE PHASE ──────────────────────────────────────────────
    if (phase === 'done') {
        return (
            <div className="fade-in" style={{
                position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.97)',
                zIndex: 1000, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: 'var(--spacing-lg)', gap: '20px',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}>
                <CSSConfetti
                    active={true}
                    colors={['#818cf8', '#fbbf24', '#10b981', '#ec4899', '#22d3ee']}
                    onDone={() => {}}
                />

                <Trophy size={56} color="#fbbf24" />

                <div style={{
                    fontSize: '1.6rem', fontWeight: '800',
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent', textAlign: 'center'
                }}>
                    Séance terminée !
                </div>

                <div style={{
                    fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center'
                }}>
                    Tous les exercices sont complétés 💪
                </div>

                {/* Recap */}
                <div style={{
                    width: '100%', maxWidth: '300px',
                    display: 'flex', flexDirection: 'column', gap: '6px'
                }}>
                    {queue.map(id => {
                        const ex = exerciseInfo.find(e => e.id === id);
                        if (!ex) return null;
                        const Icon = ICON_MAP[ex.icon] || Dumbbell;
                        return (
                            <div key={id} style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '10px 12px', borderRadius: 'var(--radius-md)',
                                background: `${ex.color}08`
                            }}>
                                <Icon size={16} color={ex.color} />
                                <span style={{
                                    flex: 1, fontSize: '0.8rem', fontWeight: '600', color: ex.color
                                }}>{ex.label}</span>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                    <Check size={14} color="#10b981" />
                                    <span style={{
                                        fontSize: '0.75rem', fontWeight: '700', color: '#10b981'
                                    }}>{ex.goal} reps</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={onClose}
                    className="hover-lift"
                    style={{
                        marginTop: '8px', padding: '14px 40px', borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                        border: 'none', color: 'white', fontSize: '1rem', fontWeight: '700',
                        cursor: 'pointer'
                    }}
                >
                    Fermer
                </button>
            </div>
        );
    }

    return null;
}
