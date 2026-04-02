import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X, Play, Check, Trophy, Save, FolderOpen, Trash2, GripVertical, Pencil,
    Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints,
    Flame, Square, MoveDown, MoveDiagonal, Shuffle
} from 'lucide-react';
import { EXERCISES, getDailyGoal } from '../../config/exercises';
import { WEIGHT_EXERCISES } from '../../config/weights';
import { Counter } from './Counter';
import { Z_INDEX } from '../../utils/zIndex';
import { Timer } from './Timer';
import { SessionSummary } from './SessionSummary';
import { registerBackHandler } from '../../utils/backHandler';
import { canAccessFeature, FEATURES } from '../../utils/entitlements';
import ICON_MAP from '../../utils/iconMap';
import { addSession, getSessionHistory } from '../../features/share/services/sessionHistoryService';
import { getExerciseLabel, getExerciseCategory } from '../../utils/exerciseLabel';

// ── Exercise grid item ──────────────────────────────────────────────────
function ExerciseGridItem({ ex, selected, orderNum, onToggle, t }) {
    const Icon = ICON_MAP[ex.icon] || Dumbbell;
    return (
        <button
            onClick={() => !ex.done && onToggle(ex.id)}
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
            <span style={{ fontSize: '0.75rem', fontWeight: '600', textAlign: 'center' }}>
                {getExerciseLabel(ex, t)}
            </span>
            <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>
                {ex.done ? t('workout.completed') : (ex.type === 'timer' ? `${ex.goal - ex.count}s` : t('workout.remaining', { count: ex.goal - ex.count }))}
            </span>
        </button>
    );
}

export function WorkoutSession({
    onClose, today, dayNumber, getExerciseCount, updateExerciseCount, completions, settings,
    routines = [], saveRoutine, deleteRoutine, updateRoutine, maxRoutines = 10,
    isPro, activeSlide, customExercises = [], computedStats = {}
}) {
    const { t } = useTranslation();
    const [phase, setPhase] = useState('config'); // 'config' | 'running' | 'done'
    const [queue, setQueue] = useState([]); // ordered list of exercise IDs
    const [currentIdx, setCurrentIdx] = useState(0);
    const [showSaveRoutine, setShowSaveRoutine] = useState(false);
    const [routineName, setRoutineName] = useState('');
    const [showRoutineList, setShowRoutineList] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [editingRoutineId, setEditingRoutineId] = useState(null);

    // Drag & drop state
    const [dragIdx, setDragIdx] = useState(null);
    const [dragOverIdx, setDragOverIdx] = useState(null);
    const touchStartY = useRef(null);
    const touchStartIdx = useRef(null);
    const queueListRef = useRef(null);
    const itemRefs = useRef({});

    // Back handler
    const sessionStartTime = useRef(null);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [savedSession, setSavedSession] = useState(null);
    const [sessionName, setSessionName] = useState('');

    useEffect(() => {
        const unreg = registerBackHandler(() => {
            if (showSaveRoutine) {
                setShowSaveRoutine(false);
                return true;
            }
            if (showRoutineList) {
                setShowRoutineList(false);
                return true;
            }
            if (phase === 'running') {
                setPhase('config');
                return true;
            }
            onClose();
            return true;
        });
        return unreg;
    }, [phase, onClose, showSaveRoutine, showRoutineList]);

    const localExercises = useMemo(() => {
        if (activeSlide === 0) return EXERCISES;
        if (activeSlide === 1) return WEIGHT_EXERCISES;
        if (activeSlide === 2) return customExercises;
        return EXERCISES;
    }, [activeSlide, customExercises]);

    const allExercises = useMemo(() => {
        return [...EXERCISES, ...WEIGHT_EXERCISES, ...customExercises];
    }, [customExercises]);

    const allowedExercises = useMemo(() => {
        return isPro ? allExercises : EXERCISES;
    }, [isPro, allExercises]);

    const [showAll, setShowAll] = useState(false);
    const canMixDashboards = canAccessFeature(FEATURES.INTER_DASHBOARD, { isPro });
    const availableExercises = canMixDashboards && showAll ? allExercises : localExercises;

    // Exercise info with current state
    const exerciseInfo = useMemo(() => {
        return availableExercises.map(ex => {
            const goal = getDailyGoal(ex, dayNumber, settings?.difficultyMultiplier);
            const count = getExerciseCount(today, ex.id);
            const done = completions[today]?.[ex.id]?.isCompleted || count >= goal;
            
            let category = 'custom';
            if (EXERCISES.some(e => e.id === ex.id)) category = 'bodyweight';
            else if (WEIGHT_EXERCISES.some(e => e.id === ex.id)) category = 'weights';

            return { ...ex, goal, count, done, category };
        });
    }, [availableExercises, dayNumber, today, completions, getExerciseCount, settings?.difficultyMultiplier]);

    // Toggle in queue
    const toggleExercise = (id) => {
        setQueue(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);

            // Check pro access for non-bodyweight exercises
            const cat = getExerciseCategory(id);
            if (cat !== 'bodyweight' && !isPro) return prev;

            // If exercise is from a different category, auto-enable showAll
            const currentCat = activeSlide === 0 ? 'bodyweight' : activeSlide === 1 ? 'weights' : 'custom';
            if (cat !== currentCat && canMixDashboards && !showAll) {
                setShowAll(true);
            }

            return [...prev, id];
        });
    };

    // Shuffle queue (Fisher-Yates)
    const shuffleQueue = () => {
        setQueue(prev => {
            const shuffled = [...prev];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        });
    };

    // Start session
    const startSession = () => {
        if (queue.length < 1) return;
        setCurrentIdx(0);
        sessionStartTime.current = Date.now();
        setPhase('running');
    };

    // Load a routine into the queue
    const loadRoutine = (routine) => {
        const WEIGHT_IDS = ['biceps_curl','hammer_curl','bench_press','overhead_press','squat_weights','deadlift','barbell_row'];
        // Filter out exercises that don't exist anymore, aren't allowed, or are already completed
        const validIds = routine.exerciseIds.filter(id => {
            const ex = allowedExercises.find(e => e.id === id);
            if (!ex) return false;
            const goal = getDailyGoal(ex, dayNumber, settings?.difficultyMultiplier);
            const count = getExerciseCount(today, ex.id);
            const done = completions[today]?.[ex.id]?.isCompleted || count >= goal;
            return !done;
        });
        setQueue(validIds);
        setSessionName(routine.name);
        setShowRoutineList(false);

        // If routine mixes exercise types, enable showAll so all are available
        const hasWeights = routine.exerciseIds.some(id => WEIGHT_IDS.includes(id));
        const hasBodyweight = routine.exerciseIds.some(id => !WEIGHT_IDS.includes(id) && !id.startsWith('custom_'));
        const hasCustom = routine.exerciseIds.some(id => id.startsWith('custom_'));
        const isMixed = (hasWeights && hasBodyweight) || hasCustom;
        if (isMixed && canMixDashboards) {
            setShowAll(true);
        }

        // Auto-activate showWeights in share options if routine mixes categories
        if (isMixed) {
            try {
                const raw = localStorage.getItem('oneup_share_options');
                const opts = raw ? JSON.parse(raw) : {};
                if (!opts.showWeights) {
                    localStorage.setItem('oneup_share_options', JSON.stringify({ ...opts, showWeights: true }));
                }
            } catch { /* ignore */ }
        }
    };

    // Save current queue as routine (new or update)
    const handleSaveRoutine = () => {
        if (!routineName.trim() || queue.length < 1) return;
        if (editingRoutineId) {
            updateRoutine?.(editingRoutineId, routineName, queue);
            setEditingRoutineId(null);
        } else {
            saveRoutine?.(routineName, queue);
        }
        setShowSaveRoutine(false);
        setRoutineName('');
    };

    // Edit a routine: load it into queue and open save form
    const editRoutine = (routine) => {
        const validIds = routine.exerciseIds.filter(id => {
            const ex = allowedExercises.find(e => e.id === id);
            if (!ex) return false;
            const goal = getDailyGoal(ex, dayNumber, settings?.difficultyMultiplier);
            const count = getExerciseCount(today, ex.id);
            const done = completions[today]?.[ex.id]?.isCompleted || count >= goal;
            return !done;
        });
        setQueue(validIds);
        setRoutineName(routine.name);
        setEditingRoutineId(routine.id);
        setShowSaveRoutine(true);
        setShowRoutineList(false);
    };

    // ── Drag & Drop handlers (touch-based for mobile) ──
    const handleDragStart = useCallback((idx) => {
        setDragIdx(idx);
    }, []);

    const handleDragOver = useCallback((idx) => {
        if (dragIdx === null || dragIdx === idx) return;
        setDragOverIdx(idx);
    }, [dragIdx]);

    const handleDragEnd = useCallback(() => {
        if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
            setQueue(prev => {
                const newQueue = [...prev];
                const [removed] = newQueue.splice(dragIdx, 1);
                newQueue.splice(dragOverIdx, 0, removed);
                return newQueue;
            });
        }
        setDragIdx(null);
        setDragOverIdx(null);
    }, [dragIdx, dragOverIdx]);

    // Touch handlers for mobile drag & drop
    const handleTouchStart = useCallback((e, idx) => {
        touchStartY.current = e.touches[0].clientY;
        touchStartIdx.current = idx;
        setDragIdx(idx);
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (touchStartIdx.current === null || !queueListRef.current) return;
        const currentY = e.touches[0].clientY;

        // Determine which item we're hovering over based on Y position
        const items = Object.entries(itemRefs.current);
        for (const [idxStr, el] of items) {
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            if (currentY >= rect.top && currentY <= rect.bottom) {
                const overIdx = parseInt(idxStr, 10);
                if (overIdx !== touchStartIdx.current) {
                    setDragOverIdx(overIdx);
                }
                break;
            }
        }
    }, []);

    const handleTouchEnd = useCallback(() => {
        handleDragEnd();
        touchStartY.current = null;
        touchStartIdx.current = null;
    }, [handleDragEnd]);

    // ── Running phase ──
    const currentExId = queue[currentIdx];
    const currentEx = currentExId ? allExercises.find(e => e.id === currentExId) : null;
    const currentGoal = currentEx ? getDailyGoal(currentEx, dayNumber, settings?.difficultyMultiplier) : 0;
    const currentCount = currentEx ? getExerciseCount(today, currentExId) : 0;
    const currentDone = currentEx ? (completions[today]?.[currentExId]?.isCompleted || currentCount >= currentGoal) : false;

    const advanceToNext = () => {
        for (let offset = 1; offset <= queue.length; offset++) {
            const nextIdx = (currentIdx + offset) % queue.length;
            const nextId = queue[nextIdx];
            const ex = exerciseInfo.find(e => e.id === nextId);
            if (ex && !ex.done) {
                setCurrentIdx(nextIdx);
                return;
            }
        }
        // Session complete — compute duration and save to history
        const duration = sessionStartTime.current
            ? Math.round((Date.now() - sessionStartTime.current) / 1000)
            : 0;
        setSessionDuration(duration);

        const completedExercises = queue.map(id => {
            const ex = exerciseInfo.find(e => e.id === id);
            if (!ex) return null;
            const label = getExerciseLabel(ex, t);
            return { id: ex.id, label, reps: ex.goal, color: ex.color, icon: ex.icon, type: ex.type };
        }).filter(Boolean);

        // Detect routine: if queue matches a saved routine (same exercises, same order)
        let detectedName = sessionName;
        if (!detectedName && routines?.length > 0) {
            for (const routine of routines) {
                if (routine.exerciseIds.length === queue.length &&
                    routine.exerciseIds.every((id, i) => id === queue[i])) {
                    detectedName = routine.name;
                    break;
                }
            }
        }

        const session = addSession({
            date: new Date().toISOString(),
            duration,
            name: detectedName,
            type: activeSlide === 1 ? 'weights' : activeSlide === 2 ? 'custom' : 'bodyweight',
            exercises: completedExercises,
        });
        setSavedSession(session);
        setPhase('done');
    };

    // ── CONFIG PHASE ────────────────────────────────────────────
    if (phase === 'config') {
        return (
            <div className="fade-in" style={{
                position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.97)',
                zIndex: Z_INDEX.TOAST, display: 'flex', flexDirection: 'column',
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
                        {t('workout.newSession')}
                    </h2>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {/* Load Routine button */}
                        <button
                            onClick={() => setShowRoutineList(!showRoutineList)}
                            className="hover-lift"
                            style={{
                                background: showRoutineList ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.1)',
                                border: showRoutineList ? '1px solid rgba(245,158,11,0.4)' : 'none',
                                borderRadius: '20px', height: '40px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '5px', padding: '0 14px',
                                color: showRoutineList ? '#f59e0b' : 'white', cursor: 'pointer',
                                fontSize: '0.75rem', fontWeight: '600'
                            }}
                        >
                            <FolderOpen size={16} />
                            {t('routines.title')}
                        </button>
                        <button onClick={onClose} className="hover-lift" style={{
                            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                            width: '40px', height: '40px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'white', cursor: 'pointer'
                        }}>
                            <X size={22} />
                        </button>
                    </div>
                </div>

                <div style={{
                    flex: 1, overflowY: 'auto', padding: '0 var(--spacing-md)',
                    display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)'
                }}>
                    {/* ── Routine list (collapsible) ── */}
                    {showRoutineList && (
                        <div style={{
                            background: 'rgba(245,158,11,0.05)',
                            border: '1px solid rgba(245,158,11,0.15)',
                            borderRadius: 'var(--radius-lg)',
                            padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px'
                        }}>
                            {routines.length === 0 ? (
                                <div style={{
                                    textAlign: 'center', color: 'var(--text-secondary)',
                                    fontSize: '0.8rem', padding: '12px'
                                }}>
                                    {t('routines.empty')}
                                </div>
                            ) : (
                                routines.map(routine => (
                                    <div key={routine.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        padding: '10px 12px', borderRadius: 'var(--radius-md)',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.06)'
                                    }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                            }}>{routine.name}</div>
                                            <div style={{
                                                display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '4px'
                                            }}>
                                                {routine.exerciseIds.map(exId => {
                                                    const ex = allExercises.find(e => e.id === exId);
                                                    if (!ex) return null;
                                                    const Icon = ICON_MAP[ex.icon] || Dumbbell;
                                                    return <Icon key={exId} size={12} color={ex.color} />;
                                                })}
                                            </div>
                                        </div>
                                        {confirmDeleteId === routine.id ? (
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button onClick={() => { deleteRoutine?.(routine.id); setConfirmDeleteId(null); }}
                                                    style={{
                                                        width: '30px', height: '30px', borderRadius: '50%',
                                                        background: '#ef4444', border: 'none', color: 'white',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer'
                                                    }}><Check size={14} /></button>
                                                <button onClick={() => setConfirmDeleteId(null)}
                                                    style={{
                                                        width: '30px', height: '30px', borderRadius: '50%',
                                                        background: 'rgba(255,255,255,0.08)', border: 'none',
                                                        color: 'var(--text-secondary)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer'
                                                    }}><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button onClick={() => setConfirmDeleteId(routine.id)}
                                                    style={{
                                                        width: '30px', height: '30px', borderRadius: '50%',
                                                        background: 'rgba(239,68,68,0.08)', border: 'none',
                                                        color: '#ef4444',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer'
                                                    }}><Trash2 size={12} /></button>
                                                <button onClick={() => editRoutine(routine)}
                                                    style={{
                                                        width: '30px', height: '30px', borderRadius: '50%',
                                                        background: 'rgba(245,158,11,0.1)', border: 'none',
                                                        color: '#f59e0b',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer'
                                                    }}><Pencil size={12} /></button>
                                                <button onClick={() => loadRoutine(routine)}
                                                    className="hover-lift"
                                                    style={{
                                                        height: '30px', borderRadius: '16px',
                                                        background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                                                        border: 'none', color: 'white',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        gap: '4px', padding: '0 12px', cursor: 'pointer',
                                                        fontSize: '0.7rem', fontWeight: '700'
                                                    }}>
                                                    <Play size={12} />
                                                    {t('routines.load')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Inter-Dashboard Toggle for Pro Users */}
                    {canMixDashboards && (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'rgba(139, 92, 246, 0.1)', padding: '12px',
                            borderRadius: 'var(--radius-md)', border: '1px solid rgba(139, 92, 246, 0.2)'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                                    {t('workout.interDashboard')}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                    {t('workout.interDashboardDesc')}
                                </div>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
                                <span className="slider"></span>
                            </label>
                            <style>{`
                            .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
                            .toggle-switch input { opacity: 0; width: 0; height: 0; }
                            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.1); transition: .4s; border-radius: 24px; }
                            .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
                            input:checked + .slider { background-color: #8b5cf6; }
                            input:checked + .slider:before { transform: translateX(20px); }
                            `}</style>
                        </div>
                    )}

                    {/* Exercise selection label */}
                    <div style={{
                        fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px',
                        color: 'var(--text-secondary)', fontWeight: '600'
                    }}>
                        {t('workout.chooseOrder')}
                    </div>

                    {/* ── Selected order (drag & drop) ── */}
                    {queue.length > 0 && (
                        <>
                            {queue.length >= 2 && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={shuffleQueue}
                                        className="hover-lift"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                            padding: '6px 12px', borderRadius: '20px',
                                            background: 'rgba(139,92,246,0.12)',
                                            border: '1px solid rgba(139,92,246,0.25)',
                                            color: '#a78bfa', cursor: 'pointer',
                                            fontSize: '0.7rem', fontWeight: '600'
                                        }}
                                    >
                                        <Shuffle size={13} />
                                        {t('workout.shuffle')}
                                    </button>
                                </div>
                            )}
                        <div
                            ref={queueListRef}
                            style={{
                                display: 'flex', flexDirection: 'column', gap: '4px',
                                padding: '8px', borderRadius: 'var(--radius-md)',
                                background: 'rgba(129,140,248,0.06)',
                                border: '1px solid rgba(129,140,248,0.12)'
                            }}
                        >
                            {queue.map((id, i) => {
                                const ex = allExercises.find(e => e.id === id);
                                if (!ex) return null;
                                const Icon = ICON_MAP[ex.icon] || Dumbbell;
                                const isDragging = dragIdx === i;
                                const isDragOver = dragOverIdx === i;
                                return (
                                    <div
                                        key={id}
                                        ref={el => itemRefs.current[i] = el}
                                        draggable
                                        onDragStart={() => handleDragStart(i)}
                                        onDragOver={(e) => { e.preventDefault(); handleDragOver(i); }}
                                        onDragEnd={handleDragEnd}
                                        onTouchStart={(e) => handleTouchStart(e, i)}
                                        onTouchMove={handleTouchMove}
                                        onTouchEnd={handleTouchEnd}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '8px 10px', borderRadius: '12px',
                                            background: isDragging ? `${ex.color}20` : isDragOver ? 'rgba(129,140,248,0.15)' : `${ex.color}08`,
                                            border: isDragOver ? '1.5px dashed rgba(129,140,248,0.4)' : `1px solid ${ex.color}20`,
                                            cursor: 'grab', userSelect: 'none',
                                            opacity: isDragging ? 0.6 : 1,
                                            transition: isDragging ? 'none' : 'all 0.15s ease',
                                            touchAction: 'none'
                                        }}
                                    >
                                        <GripVertical size={14} color="var(--text-secondary)" style={{ opacity: 0.4, flexShrink: 0 }} />
                                        <span style={{
                                            fontSize: '0.65rem', fontWeight: '800', color: ex.color,
                                            width: '16px', textAlign: 'center', flexShrink: 0
                                        }}>{i + 1}</span>
                                        <Icon size={14} color={ex.color} />
                                        <span style={{
                                            fontSize: '0.75rem', fontWeight: '600', color: ex.color, flex: 1
                                        }}>{getExerciseLabel(ex, t)}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleExercise(id); }}
                                            style={{
                                                width: '22px', height: '22px', borderRadius: '50%',
                                                background: 'rgba(255,255,255,0.06)', border: 'none',
                                                color: 'var(--text-secondary)', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
                                            }}
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                );
                            })
                            // If an exercise from another dashboard is queued but we are not showing all, still render it!
                            // (Because allExercises always contains all).
                            }
                        </div>
                        </>
                    )}

                    {/* Exercise grid */}
                    {showAll ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {['bodyweight', 'weights', 'custom'].map(cat => {
                                const catExercises = exerciseInfo.filter(ex => ex.category === cat);
                                if (catExercises.length === 0) return null;
                                const catTitle = cat === 'bodyweight' 
                                    ? t('common.global_classic')
                                    : cat === 'weights' 
                                        ? t('common.global_weights')
                                        : t('workout.custom');

                                return (
                                    <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{
                                            fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)',
                                            textTransform: 'uppercase', letterSpacing: '1px', paddingLeft: '4px'
                                        }}>
                                            {catTitle}
                                        </div>
                                        <div style={{
                                            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px'
                                        }}>
                                            {catExercises.map(ex => {
                                                const selected = queue.includes(ex.id);
                                                const orderNum = selected ? queue.indexOf(ex.id) + 1 : null;
                                                return <ExerciseGridItem key={ex.id} ex={ex} selected={selected} orderNum={orderNum} onToggle={toggleExercise} t={t} />;
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '8px'
                        }}>
                            {exerciseInfo.map(ex => {
                                const selected = queue.includes(ex.id);
                                const orderNum = selected ? queue.indexOf(ex.id) + 1 : null;
                                return <ExerciseGridItem key={ex.id} ex={ex} selected={selected} orderNum={orderNum} onToggle={toggleExercise} t={t} />;
                            })}
                        </div>
                    )}
                </div>

                {/* ── Save routine inline form ── */}
                {showSaveRoutine && (
                    <div style={{
                        padding: '12px var(--spacing-md)', background: 'rgba(245,158,11,0.05)',
                        borderTop: '1px solid rgba(245,158,11,0.15)',
                        display: 'flex', gap: '8px', alignItems: 'center'
                    }}>
                        <input
                            value={routineName}
                            onChange={e => setRoutineName(e.target.value.slice(0, 30))}
                            placeholder={t('routines.namePlaceholder')}
                            autoFocus
                            style={{
                                flex: 1, padding: '10px 14px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1.5px solid rgba(245,158,11,0.3)',
                                borderRadius: 'var(--radius-md)',
                                color: 'white', fontSize: '0.85rem', fontWeight: '600',
                                outline: 'none', boxSizing: 'border-box'
                            }}
                            onKeyDown={e => e.key === 'Enter' && handleSaveRoutine()}
                            maxLength={30}
                        />
                        <button
                            onClick={handleSaveRoutine}
                            disabled={!routineName.trim()}
                            style={{
                                padding: '10px 16px', borderRadius: 'var(--radius-md)',
                                background: routineName.trim() ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.05)',
                                border: 'none', color: 'white', fontWeight: '700',
                                cursor: routineName.trim() ? 'pointer' : 'default',
                                opacity: routineName.trim() ? 1 : 0.4,
                                fontSize: '0.8rem'
                            }}
                        >
                            <Check size={18} />
                        </button>
                        <button
                            onClick={() => { setShowSaveRoutine(false); setRoutineName(''); }}
                            style={{
                                padding: '10px', borderRadius: 'var(--radius-md)',
                                background: 'rgba(255,255,255,0.06)', border: 'none',
                                color: 'var(--text-secondary)', cursor: 'pointer'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Bottom buttons */}
                <div style={{
                    padding: 'var(--spacing-md)', display: 'flex', gap: '8px'
                }}>
                    {/* Save as routine */}
                    {!showSaveRoutine && queue.length >= 1 && (
                        <button
                            onClick={() => {
                                if (routines.length >= maxRoutines) return;
                                setShowSaveRoutine(true);
                            }}
                            className="hover-lift"
                            disabled={routines.length >= maxRoutines}
                            style={{
                                padding: '14px', borderRadius: 'var(--radius-lg)',
                                background: routines.length >= maxRoutines
                                    ? 'rgba(255,255,255,0.05)'
                                    : 'rgba(245,158,11,0.15)',
                                border: routines.length >= maxRoutines ? 'none' : '1px solid rgba(245,158,11,0.3)',
                                color: routines.length >= maxRoutines ? 'var(--text-secondary)' : '#f59e0b',
                                cursor: routines.length >= maxRoutines ? 'default' : 'pointer',
                                opacity: routines.length >= maxRoutines ? 0.4 : 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Save size={20} />
                        </button>
                    )}

                    {/* Launch button */}
                    <button
                        onClick={startSession}
                        disabled={queue.length < 1}
                        className="hover-lift"
                        style={{
                            flex: 1, padding: '14px', borderRadius: 'var(--radius-lg)',
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
                        {t('workout.launch', { count: queue.length, plural: queue.length > 1 ? 's' : '' })}
                    </button>
                </div>
            </div>
        );
    }

    // ── RUNNING PHASE = render Counter or Timer ─────────────────
    if (phase === 'running' && currentEx) {
        const isTimer = currentEx.type === 'timer';
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

    // ── DONE PHASE ───────────────────────────────────────────────
    if (phase === 'done') {
        const completedExercises = queue.map(id => {
            const ex = exerciseInfo.find(e => e.id === id);
            return ex ? { id: ex.id, label: getExerciseLabel(ex, t), reps: ex.goal, color: ex.color, icon: ex.icon, type: ex.type } : null;
        }).filter(Boolean);

        return (
            <SessionSummary
                queue={queue}
                exerciseInfo={exerciseInfo}
                onClose={onClose}
                sessionData={savedSession || {
                    date: new Date().toISOString(),
                    exercises: completedExercises,
                    duration: sessionDuration,
                    name: sessionName,
                    type: activeSlide === 1 ? 'weights' : activeSlide === 2 ? 'custom' : 'bodyweight',
                }}
                stats={computedStats}
                sessionHistory={getSessionHistory()}
                isPro={isPro}
                defaultSessionName={sessionName}
            />
        );
    }

    return null;
}
