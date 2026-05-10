import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { EXERCISES, getDailyGoal } from '../config/exercises';
import { WEIGHT_EXERCISES } from '../config/weights';
import { CATEGORIES, buildFullCategoryOrder, isUserCategory, buildFullCategoryColors } from '../config/categories';
import { canAccessFeature, FEATURES } from '../utils/entitlements';
import { addSession } from '../features/share/services/sessionHistoryService';
import { getExerciseLabel, isCustomExercise } from '../utils/exerciseLabel';
import { useProgressStore } from '../store/useProgressStore';
import { useComputedStatsStore } from '../store/useComputedStatsStore';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useExercises } from '../contexts/ExercisesContext';
import { useExerciseConfig } from './useExerciseConfig';
import { useBackHandler } from './useBackHandler';
import { getLocalDateStr } from '../utils/dateUtils';
import { generateSessionName } from '../utils/sessionNameGenerator';

/**
 * Extracts all state management and business logic from WorkoutSession,
 * leaving the component as a pure render function.
 */
export function useWorkoutSession({ onClose, today, dayNumber, activeSlide }) {
    // ── Store consumption ──
    const getExerciseCount = useProgressStore(s => s.getExerciseCount);
    const updateExerciseCount = useProgressStore(s => s.updateExerciseCount);
    const completions = useProgressStore(s => s.completions);
    const computedStats = useComputedStatsStore(s => s.stats);
    const { getConfig } = useExerciseConfig();
    const { isPro } = useSubscription();
    const {
        routines, saveRoutine, deleteRoutine, updateRoutine, maxRoutines,
        customExercises, customCategories,
        exercisesByUserCategory, defaultCustomExercises
    } = useExercises();
    const fullCategoryOrder = useMemo(() => buildFullCategoryOrder(customCategories), [customCategories]);
    const fullCategoryColors = useMemo(() => buildFullCategoryColors(customCategories), [customCategories]);
    const { t } = useTranslation();

    // ── Phase & queue state ──
    const [phase, setPhase] = useState('config'); // 'config' | 'running' | 'done'
    const [queue, setQueue] = useState([]);
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

    // Session tracking
    const sessionStartTime = useRef(null);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [savedSession, setSavedSession] = useState(null);
    const [sessionName, setSessionName] = useState('');
    const [hasAnimatedFirstPanel, setHasAnimatedFirstPanel] = useState(false);

    // ── Back handler ──
    useBackHandler(() => {
        if (showSaveRoutine) { setShowSaveRoutine(false); return true; }
        if (showRoutineList) { setShowRoutineList(false); return true; }
        if (phase === 'running') { setPhase('config'); return true; }
        onClose();
        return true;
    }, true);

    // ── Exercise lists ──
    const localExercises = useMemo(() => {
        const currentCatKey = fullCategoryOrder[activeSlide];
        if (currentCatKey === CATEGORIES.BODYWEIGHT) return EXERCISES;
        if (currentCatKey === CATEGORIES.WEIGHTS) return WEIGHT_EXERCISES;
        if (currentCatKey === CATEGORIES.CUSTOM) return defaultCustomExercises;
        if (isUserCategory(currentCatKey)) return exercisesByUserCategory[currentCatKey] || [];
        return EXERCISES;
    }, [activeSlide, defaultCustomExercises, fullCategoryOrder, exercisesByUserCategory]);

    const allExercises = useMemo(() => {
        return [...EXERCISES, ...WEIGHT_EXERCISES, ...customExercises];
    }, [customExercises]);

    const allowedExercises = useMemo(() => {
        return isPro ? allExercises : EXERCISES;
    }, [isPro, allExercises]);

    const [showAll, setShowAll] = useState(false);
    const canMixDashboards = canAccessFeature(FEATURES.INTER_DASHBOARD, { isPro });
    const availableExercises = canMixDashboards && showAll ? allExercises : localExercises;

    // ── Exercise info with current state ──
    const exerciseInfo = useMemo(() => {
        return availableExercises.map(ex => {
            const currentDiff = getConfig(ex.id, today).difficulty;
            const goal = getDailyGoal(ex, dayNumber, currentDiff);
            const count = getExerciseCount(today, ex.id);
            const done = completions[today]?.[ex.id]?.isCompleted || count >= goal;

            let category = 'custom';
            if (EXERCISES.some(e => e.id === ex.id)) category = 'bodyweight';
            else if (WEIGHT_EXERCISES.some(e => e.id === ex.id)) category = 'weights';
            else {
                for (const catId in exercisesByUserCategory) {
                    if (exercisesByUserCategory[catId].some(e => e.id === ex.id)) {
                        category = catId;
                        break;
                    }
                }
            }

            return { ...ex, goal, count, done, category };
        });
    }, [availableExercises, dayNumber, today, completions, getExerciseCount, getConfig, exercisesByUserCategory]);

    // ── Toggle exercise in queue ──
    const toggleExercise = (id) => {
        setQueue(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);

            const isBW = EXERCISES.some(e => e.id === id);
            if (!isBW && !isPro) return prev;

            return [...prev, id];
        });
    };

    // ── Shuffle queue (Fisher-Yates) ──
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

    // ── Start session ──
    const startSession = () => {
        if (queue.length < 1) return;
        const filteredQueue = queue.filter(id => {
            const ex = allExercises.find(e => e.id === id);
            if (!ex) return false;
            const currentDiff = getConfig(ex.id, today).difficulty;
            const goal = getDailyGoal(ex, dayNumber, currentDiff);
            const count = getExerciseCount(today, id);
            const done = completions[today]?.[id]?.isCompleted || count >= goal;
            return !done;
        });
        if (filteredQueue.length < 1) return;
        setQueue(filteredQueue);
        setCurrentIdx(0);
        setHasAnimatedFirstPanel(false);
        sessionStartTime.current = Date.now();
        setPhase('running');
    };

    // ── Load routine ──
    const loadRoutine = (routine) => {
        const routineExercises = routine.exerciseIds
            .map(id => allExercises.find(e => e.id === id))
            .filter(ex => {
                if (!ex) return false;
                const isWeight = WEIGHT_EXERCISES.some(e => e.id === ex.id);
                const isCustom = isCustomExercise(ex.id);
                if (!isPro && (isWeight || isCustom)) return false;
                return true;
            });

        const validExercises = routineExercises.filter(ex => {
            const currentDiff = getConfig(ex.id, today).difficulty;
            const goal = getDailyGoal(ex, dayNumber, currentDiff);
            const count = getExerciseCount(today, ex.id);
            const done = completions[today]?.[ex.id]?.isCompleted || count >= goal;
            return !done;
        });

        const validIds = validExercises.map(ex => ex.id);
        setQueue(validIds);
        setSessionName(routine.name);
        setShowRoutineList(false);

        // Detect exercise categories using the same priority as the grid
        const getExCategory = (ex) => {
            if (EXERCISES.some(e => e.id === ex.id)) return CATEGORIES.BODYWEIGHT;
            if (WEIGHT_EXERCISES.some(e => e.id === ex.id)) return CATEGORIES.WEIGHTS;
            for (const catId in exercisesByUserCategory) {
                if (exercisesByUserCategory[catId].some(e => e.id === ex.id)) return catId;
            }
            return CATEGORIES.CUSTOM;
        };

        const categoriesInRoutine = new Set(validExercises.map(getExCategory));
        const currentCat = fullCategoryOrder[activeSlide];

        // Only enable showAll if the routine has exercises from a category different from the current slide
        const hasDifferentCategory = [...categoriesInRoutine].some(cat => cat !== currentCat);
        if (hasDifferentCategory && canMixDashboards) {
            setShowAll(true);
        }

        if (categoriesInRoutine.size > 1) {
            try {
                const raw = localStorage.getItem('oneup_share_options');
                const opts = raw ? JSON.parse(raw) : {};
                if (!opts.showWeights) {
                    localStorage.setItem('oneup_share_options', JSON.stringify({ ...opts, showWeights: true }));
                }
            } catch { /* ignore */ }
        }
    };

    // ── Save/edit routine ──
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

    const editRoutine = (routine) => {
        const validIds = routine.exerciseIds.filter(id => {
            const ex = allowedExercises.find(e => e.id === id);
            if (!ex) return false;
            const currentDiff = getConfig(ex.id, today).difficulty;
            const goal = getDailyGoal(ex, dayNumber, currentDiff);
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

    // ── Drag & Drop handlers ──
    const handleDragStart = useCallback((idx) => { setDragIdx(idx); }, []);

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

    const handleTouchStart = useCallback((e, idx) => {
        touchStartY.current = e.touches[0].clientY;
        touchStartIdx.current = idx;
        setDragIdx(idx);
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (touchStartIdx.current === null || !queueListRef.current) return;
        const currentY = e.touches[0].clientY;
        const items = Object.entries(itemRefs.current);
        for (const [idxStr, el] of items) {
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            if (currentY >= rect.top && currentY <= rect.bottom) {
                const overIdx = parseInt(idxStr, 10);
                if (overIdx !== touchStartIdx.current) setDragOverIdx(overIdx);
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
    const currentDifficulty = getConfig(currentEx?.id, today).difficulty;
    const currentGoal = currentEx ? getDailyGoal(currentEx, dayNumber, currentDifficulty) : 0;
    const currentCount = currentEx ? getExerciseCount(today, currentExId) : 0;
    const currentDone = currentEx ? (completions[today]?.[currentExId]?.isCompleted || currentCount >= currentGoal) : false;

    const hasNextAvailableExercise = useMemo(() => {
        return queue.some((id, idx) => {
            if (idx === currentIdx) return false;
            const ex = allExercises.find(item => item.id === id);
            if (!ex) return false;
            const difficulty = getConfig(ex.id, today).difficulty;
            const goal = getDailyGoal(ex, dayNumber, difficulty);
            const count = getExerciseCount(today, id);
            return !(completions[today]?.[id]?.isCompleted || count >= goal);
        });
    }, [allExercises, completions, currentIdx, dayNumber, getConfig, getExerciseCount, queue, today]);

    useEffect(() => {
        if (phase !== 'running' || !currentEx || hasAnimatedFirstPanel) return undefined;
        const timer = setTimeout(() => setHasAnimatedFirstPanel(true), 550);
        return () => clearTimeout(timer);
    }, [phase, currentEx, hasAnimatedFirstPanel]);

    const advanceToNext = () => {
        setHasAnimatedFirstPanel(true);
        for (let offset = 1; offset <= queue.length; offset++) {
            const nextIdx = (currentIdx + offset) % queue.length;
            const nextId = queue[nextIdx];
            const ex = exerciseInfo.find(e => e.id === nextId);
            if (ex && !ex.done) {
                setCurrentIdx(nextIdx);
                return;
            }
        }
        // Session complete
        const duration = sessionStartTime.current
            ? Math.round((Date.now() - sessionStartTime.current) / 1000)
            : 0;
        setSessionDuration(duration);

        const completedExercises = queue.map(id => {
            const ex = exerciseInfo.find(e => e.id === id);
            if (!ex) return null;
            const label = getExerciseLabel(ex, t);
            const conf = getConfig(id, getLocalDateStr(new Date()));
            const w = conf ? conf.weight : null;
            const diff = conf ? conf.difficulty : 1.0;
            return { id: ex.id, label, reps: ex.goal, color: ex.color, icon: ex.icon, type: ex.type, weight: w, difficulty: diff };
        }).filter(Boolean);

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
        if (!detectedName) {
            const totalReps = completedExercises.reduce((sum, ex) => sum + (ex.reps || 0), 0);
            detectedName = generateSessionName(t, {
                date: new Date().toISOString(),
                totalReps,
                exerciseCount: completedExercises.length,
                isPerfectDay: false
            });
        }

        const session = addSession({
            date: new Date().toISOString(),
            duration,
            name: detectedName,
            type: fullCategoryOrder[activeSlide] === CATEGORIES.WEIGHTS ? 'weights' : fullCategoryOrder[activeSlide] === CATEGORIES.CUSTOM ? 'custom' : isUserCategory(fullCategoryOrder[activeSlide]) ? fullCategoryOrder[activeSlide] : (fullCategoryOrder[activeSlide] === CATEGORIES.CARDIO ? 'cardio' : 'bodyweight'),
            exercises: completedExercises,
        });
        setSavedSession(session);
        setPhase('done');
    };

    return {
        // State
        phase, setPhase, queue, setQueue, currentIdx, showSaveRoutine, setShowSaveRoutine,
        routineName, setRoutineName, showRoutineList, setShowRoutineList,
        confirmDeleteId, setConfirmDeleteId, editingRoutineId,
        dragIdx, dragOverIdx, queueListRef, itemRefs,
        sessionDuration, savedSession, sessionName, setSessionName,
        hasAnimatedFirstPanel,
        showAll, setShowAll,

        // Derived
        t, computedStats, isPro, fullCategoryOrder, fullCategoryColors,
        routines, deleteRoutine, maxRoutines, customCategories, localExercises,
        exerciseInfo, allExercises, canMixDashboards,
        currentEx, currentExId, currentGoal, currentCount, currentDone,
        currentDifficulty, hasNextAvailableExercise,

        // Store actions
        getExerciseCount, updateExerciseCount, getConfig,

        // Actions
        toggleExercise, shuffleQueue, startSession, loadRoutine,
        handleSaveRoutine, editRoutine, advanceToNext,
        handleDragStart, handleDragOver, handleDragEnd,
        handleTouchStart, handleTouchMove, handleTouchEnd,

        // Context
        today, dayNumber, activeSlide, onClose,
    };
}
