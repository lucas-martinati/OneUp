import { useRef, useEffect } from 'react';
import { X, Play, Check, Save, Trash2, GripVertical, Pencil, Shuffle, ChevronUp, ChevronDown, DynamicIcon } from '@utils/icons';
import { Button, IconButton, ToggleSwitch } from '@components/ui';
import { WEIGHT_EXERCISES_MAP } from '@config/weights';
import { Z_INDEX } from '@utils/zIndex';
import { SessionSummary } from './SessionSummary';
import { ExercisePanel } from './ExercisePanel';
import { getSessionHistory } from '@features/share/services/sessionHistoryService';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { CATEGORIES, CATEGORY_ORDER, isUserCategory } from '@config/categories';
import { useWorkoutSession } from '@hooks/useWorkoutSession';
import { getLocalDateStr } from '@shared/dateUtils';
import styles from '@styles/WorkoutSession.module.css';

const MAX_ICON_DOTS = 5;

// Lets mouse users scroll the horizontal routines strip with the wheel.
// Native non-passive listener: React registers onWheel as passive, so
// preventDefault() (needed to stop the page scrolling too) would be ignored.
function useHorizontalWheelScroll(ref, enabled) {
    useEffect(() => {
        const el = ref.current;
        if (!enabled || !el) return undefined;
        const onWheel = (e) => {
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            if (el.scrollWidth <= el.clientWidth) return;
            e.preventDefault();
            el.scrollLeft += e.deltaY;
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, [ref, enabled]);
}

// ── Routine card ────────────────────────────────────────────────────────
// The whole card loads the routine; edit/delete are small secondary
// actions and the delete confirmation swaps in over the card itself.
function RoutineCard({ routine, index, allExercisesMap, confirming, onLoad, onEdit, onDelete, onCancelDelete, onAskDelete, t }) {
    const exercises = routine.exerciseIds
        .map(exId => allExercisesMap[exId])
        .filter(Boolean);
    // Max 5 dots in total: when overflowing, the "+N" dot takes the 5th slot.
    const shown = exercises.length > MAX_ICON_DOTS
        ? exercises.slice(0, MAX_ICON_DOTS - 1)
        : exercises;
    const extra = exercises.length - shown.length;

    return (
        <div
            className={styles.routineCard}
            style={{ '--i': index }}
            onClick={() => !confirming && onLoad(routine)}
        >
            <div className={styles.routineTop}>
                <div className={styles.routineName}>{routine.name}</div>
                <button
                    className={styles.cardActionBtn}
                    onClick={(e) => { e.stopPropagation(); onEdit(routine); }}
                    aria-label={t('routines.edit')}
                >
                    <Pencil size={14} />
                </button>
                <button
                    className={`${styles.cardActionBtn} ${styles.cardActionBtnDanger}`}
                    onClick={(e) => { e.stopPropagation(); onAskDelete(routine.id); }}
                    aria-label={t('common.delete')}
                >
                    <Trash2 size={14} />
                </button>
            </div>
            <div className={styles.routineMeta}>
                {t('common.exerciseCount', { count: exercises.length })}
            </div>
            <div className={styles.routineIcons}>
                {shown.map(ex => (
                    <span
                        key={ex.id}
                        className={styles.iconDot}
                        style={{ background: `color-mix(in srgb, ${ex.color} 15%, transparent)`, color: ex.color }}
                    >
                        <DynamicIcon icon={ex.icon} size={14} color={ex.color} />
                    </span>
                ))}
                {extra > 0 && (
                    <span className={`${styles.iconDot} ${styles.iconDotMore}`}>+{extra}</span>
                )}
            </div>
            <Button size="sm" fullWidth icon={Play} className={styles.loadBtn} onClick={(e) => { e.stopPropagation(); onLoad(routine); }}>
                {t('routines.load')}
            </Button>

            {confirming && (
                <div className={styles.confirmOverlay} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.confirmLabel}>{t('common.delete')} ?</div>
                    <div className={styles.confirmActions}>
                        <IconButton icon={Check} variant="danger" size="sm" onClick={() => onDelete(routine.id)} aria-label={t('common.confirm')} />
                        <IconButton icon={X} variant="surface" size="sm" onClick={onCancelDelete} aria-label={t('common.cancel')} />
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Exercise grid item ──────────────────────────────────────────────────
function ExerciseGridItem({ ex, selected, orderNum, onToggle, t }) {
    const dynamicStyle = {};
    if (!ex.done && selected) {
        dynamicStyle.background = `linear-gradient(135deg, color-mix(in srgb, ${ex.color} 15%, transparent), color-mix(in srgb, ${ex.color} 7%, transparent))`;
        dynamicStyle.borderColor = `color-mix(in srgb, ${ex.color} 50%, transparent)`;
        dynamicStyle.color = ex.color;
    }

    let remainingLabel = '';
    if (ex.done) {
        remainingLabel = t('common.completed');
    } else if (ex.type === 'timer') {
        remainingLabel = `${ex.goal - ex.count}s`;
    } else {
        remainingLabel = t('common.remaining', { count: ex.goal - ex.count });
    }

    return (
        <button
            onClick={() => !ex.done && onToggle(ex.id)}
            disabled={ex.done}
            className={ex.done ? `${styles.gridItem} ${styles.gridItemDone}` : styles.gridItem}
            style={dynamicStyle}
        >
            {ex.done && (
                <div className={styles.doneBadge}>
                    <Check size={10} color="white" />
                </div>
            )}
            {orderNum && (
                <div className={styles.orderBadge} style={{ background: ex.color }}>
                    {orderNum}
                </div>
            )}
            <DynamicIcon icon={ex.icon} size={24} />
            <span className={styles.gridItemName}>{getExerciseLabel(ex, t)}</span>
            <span className={styles.gridItemRemaining}>{remainingLabel}</span>
        </button>
    );
}

export function WorkoutSession(props) {
    const ws = useWorkoutSession(props);
    const {
        phase, queue, setQueue, showSaveRoutine, setShowSaveRoutine,
        routineName, setRoutineName,
        confirmDeleteId, setConfirmDeleteId,
        dragIdx, dragOverIdx, queueListRef, itemRefs,
        sessionDuration, savedSession, sessionName,
        hasAnimatedFirstPanel, showAll, setShowAll,
        t, computedStats, isPro, fullCategoryOrder, fullCategoryColors,
        routines, deleteRoutine, maxRoutines, customCategories, localExercises,
        exerciseInfo, allExercisesMap, canMixDashboards,
        currentEx, currentExId, currentGoal, currentCount, currentDone,
        currentDifficulty, hasNextAvailableExercise,
        updateExerciseCount, getConfig,
        toggleExercise, shuffleQueue, startSession, loadRoutine,
        handleSaveRoutine, editRoutine, advanceToNext,
        moveItem, clearQueue,
        handleDragStart, handleDragOver, handleDragEnd,
        handleTouchStart, handleTouchMove, handleTouchEnd,
        today, dayNumber, activeSlide, onClose, isStarted,
    } = ws;

    const routinesStripRef = useRef(null);
    useHorizontalWheelScroll(routinesStripRef, phase === 'config' && routines.length > 0);


    if (phase === 'config') {
        return (
            <div className="fade-in modal-overlay" style={{ zIndex: Z_INDEX.TOAST }}>
                <div className="modal-content">
                {/* Header */}
                <div className={styles.header}>
                    <h2 className="panel-title" style={{ margin: 0, textAlign: 'left' }}>
                        {isStarted ? t('dashboard.editSession') : t('dashboard.session')}
                    </h2>
                    <IconButton icon={X} variant="glass" onClick={onClose} className="hover-lift" aria-label={t('common.close')} />
                </div>

                <div className={styles.body}>
                    {/* ── Routines: always visible, one tap to load ── */}
                    {routines.length > 0 && (
                        <div className="flex-col gap-8">
                            <div className="section-label" style={{ margin: 0 }}>
                                {t('routines.title')}
                            </div>
                            <div ref={routinesStripRef} className={styles.routinesStrip}>
                                {routines.map((routine, i) => (
                                    <RoutineCard
                                        key={routine.id}
                                        routine={routine}
                                        index={i}
                                        allExercisesMap={allExercisesMap}
                                        confirming={confirmDeleteId === routine.id}
                                        onLoad={loadRoutine}
                                        onEdit={editRoutine}
                                        onAskDelete={setConfirmDeleteId}
                                        onDelete={(id) => { deleteRoutine?.(id); setConfirmDeleteId(null); }}
                                        onCancelDelete={() => setConfirmDeleteId(null)}
                                        t={t}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Inter-Dashboard Toggle for Pro Users */}
                    {canMixDashboards && (
                        <div className={styles.mixRow}>
                            <div>
                                <div className={styles.mixTitle}>{t('workout.interDashboard')}</div>
                                <div className="hint-text">{t('workout.interDashboardDesc')}</div>
                            </div>
                            <ToggleSwitch
                                enabled={showAll}
                                onClick={() => {
                                    const checked = !showAll;
                                    setShowAll(checked);
                                    if (!checked) {
                                        const localIds = new Set(localExercises.map(ex => ex.id));
                                        setQueue(prev => prev.filter(id => localIds.has(id)));
                                    }
                                }}
                            />
                        </div>
                    )}

                    {/* ── Exercise selection grid ── */}
                    <div className="flex-col gap-8">
                        <div className="section-label" style={{ margin: 0 }}>
                            {t('workout.selectExercises')}
                        </div>

                        {showAll ? (
                            <div className="flex-col" style={{ gap: '16px' }}>
                                {fullCategoryOrder.map(catId => {
                                    if (catId === CATEGORIES.CARDIO) return null;
                                    const categoryMap = {
                                        [CATEGORIES.CUSTOM]: 'custom',
                                        [CATEGORIES.BODYWEIGHT]: 'bodyweight',
                                        [CATEGORIES.WEIGHTS]: 'weights'
                                    };
                                    const targetCategory = categoryMap[catId] || catId;
                                    const catExercises = exerciseInfo.filter(ex => ex.category === targetCategory);
                                    if (catExercises.length === 0) return null;

                                    let catTitle;
                                    if (isUserCategory(catId)) {
                                        const catDef = customCategories.find(c => c.id === catId);
                                        catTitle = catDef?.name || catId;
                                    } else {
                                        const catDef = customCategories.find(c => c.id === catId);
                                        let fallbackTitle = t('workout.custom');
                                        if (catId === CATEGORIES.BODYWEIGHT) {
                                            fallbackTitle = t('common.bodyweight');
                                        } else if (catId === CATEGORIES.WEIGHTS) {
                                            fallbackTitle = t('common.weights');
                                        }
                                        catTitle = catDef?.name || fallbackTitle;
                                    }

                                    return (
                                        <div key={catId} className="flex-col gap-8">
                                            <div
                                                className={styles.categoryTitle}
                                                style={{ color: fullCategoryColors[catId] || 'var(--text-secondary)' }}
                                            >
                                                {catTitle}
                                            </div>
                                            <div className={styles.grid}>
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
                            <div className={styles.grid}>
                                {exerciseInfo.map(ex => {
                                    const selected = queue.includes(ex.id);
                                    const orderNum = selected ? queue.indexOf(ex.id) + 1 : null;
                                    return <ExerciseGridItem key={ex.id} ex={ex} selected={selected} orderNum={orderNum} onToggle={toggleExercise} t={t} />;
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Selected order (drag & drop) — below grid ── */}
                    {queue.length > 0 && (
                        <div className="flex-col gap-8">
                            <div className={styles.queueHeader}>
                                <div className="section-label" style={{ margin: 0 }}>
                                    {t('workout.yourOrder')} ({queue.length})
                                </div>
                                <div className="row gap-4">
                                    {queue.length >= 2 && (
                                        <Button size="sm" variant="ghost" icon={Shuffle} onClick={shuffleQueue}>
                                            {t('workout.shuffle')}
                                        </Button>
                                    )}
                                    <Button size="sm" variant="danger-ghost" icon={Trash2} onClick={clearQueue}>
                                        {t('workout.clearAll')}
                                    </Button>
                                </div>
                            </div>
                            <div ref={queueListRef} className={styles.queuePanel}>
                                {queue.map((id, i) => {
                                    const ex = allExercisesMap[id];
                                    if (!ex) return null;
                                    const isDragging = dragIdx === i;
                                    const isDragOver = dragOverIdx === i;
                                    const isFirst = i === 0;
                                    const isLast = i === queue.length - 1;

                                    let itemBg = `color-mix(in srgb, ${ex.color} 5%, transparent)`;
                                    if (isDragging) {
                                        itemBg = `color-mix(in srgb, ${ex.color} 14%, transparent)`;
                                    } else if (isDragOver) {
                                        itemBg = 'color-mix(in srgb, var(--accent-glow) 18%, transparent)';
                                    }

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
                                            className={styles.queueItem}
                                            style={{
                                                background: itemBg,
                                                border: isDragOver
                                                    ? '1.5px dashed color-mix(in srgb, var(--accent-glow) 50%, transparent)'
                                                    : `1px solid color-mix(in srgb, ${ex.color} 12%, transparent)`,
                                                opacity: isDragging ? 0.5 : 1,
                                                transform: isDragging ? 'scale(0.97)' : undefined,
                                            }}
                                        >
                                            <GripVertical size={14} color="var(--text-secondary)" style={{ opacity: 0.3, flexShrink: 0 }} />

                                            <div className={styles.numBadge} style={{ background: ex.color }}>
                                                {i + 1}
                                            </div>

                                            <DynamicIcon icon={ex.icon} size={16} color={ex.color} />
                                            <span className={styles.queueItemName} style={{ color: ex.color }}>
                                                {getExerciseLabel(ex, t)}
                                            </span>

                                            {WEIGHT_EXERCISES_MAP[id] && (
                                                <span
                                                    className={styles.weightChip}
                                                    style={{
                                                        background: `color-mix(in srgb, ${ex.color} 8%, transparent)`,
                                                        border: `1px solid color-mix(in srgb, ${ex.color} 12%, transparent)`
                                                    }}
                                                >
                                                    {getConfig(id)?.weight || 0} {t('weight.kg')}
                                                </span>
                                            )}

                                            <div className={styles.arrowCol}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveItem(i, i - 1); }}
                                                    disabled={isFirst}
                                                    aria-label="Move up"
                                                    className={styles.arrowBtn}
                                                >
                                                    <ChevronUp size={12} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); moveItem(i, i + 1); }}
                                                    disabled={isLast}
                                                    aria-label="Move down"
                                                    className={styles.arrowBtn}
                                                >
                                                    <ChevronDown size={12} />
                                                </button>
                                            </div>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleExercise(id); }}
                                                className={styles.removeBtn}
                                                aria-label={t('common.delete')}
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {queue.length >= 2 && (
                                <div className={styles.reorderHint}>{t('workout.reorderHint')}</div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Save routine inline form ── */}
                {showSaveRoutine && (
                    <div className={styles.saveForm}>
                        <input
                            value={routineName}
                            onChange={e => setRoutineName(e.target.value.slice(0, 30))}
                            placeholder={t('routines.namePlaceholder')}
                            autoFocus
                            className={styles.saveInput}
                            onKeyDown={e => e.key === 'Enter' && handleSaveRoutine()}
                            maxLength={30}
                        />
                        <Button variant="success" icon={Check} onClick={handleSaveRoutine} disabled={!routineName.trim()} aria-label={t('common.save')} />
                        <IconButton
                            icon={X}
                            variant="ghost"
                            onClick={() => { setShowSaveRoutine(false); setRoutineName(''); }}
                            aria-label={t('common.cancel')}
                        />
                    </div>
                )}

                {/* Bottom buttons */}
                <div className={styles.footer}>
                    {!showSaveRoutine && queue.length >= 1 && (
                        <Button
                            variant="secondary"
                            icon={Save}
                            disabled={routines.length >= maxRoutines}
                            onClick={() => {
                                if (routines.length >= maxRoutines) return;
                                setShowSaveRoutine(true);
                            }}
                            aria-label={t('common.save')}
                        />
                    )}

                    <Button
                        size="lg"
                        icon={Play}
                        onClick={startSession}
                        disabled={queue.length < 1}
                        style={{ flex: 1 }}
                    >
                        {t('workout.launch', { count: queue.length })}
                    </Button>
                </div>
                </div>
            </div>
        );
    }

    // ── RUNNING PHASE = render current exercise panel ─────────────────
    if (phase === 'running' && currentEx) {
        return (
            <div className="fade-in modal-overlay" style={{ zIndex: Z_INDEX.TOAST }}>
                <ExercisePanel
                    exerciseConfig={currentEx}
                    onClose={onClose}
                    dailyGoal={currentGoal}
                    currentCount={currentCount}
                    onUpdateCount={(newCount) => {
                        // Use `today` so an already-completed exercise keeps its locked
                        // completion-day weight (currentDifficulty is already date-aware).
                        const { weight } = getConfig(currentExId, today);
                        updateExerciseCount(today, currentExId, newCount, currentGoal, weight, currentDifficulty);
                    }}
                    isCompleted={currentDone}
                    dayNumber={dayNumber}
                    onNext={advanceToNext}
                    hideNextButton={!hasNextAvailableExercise}
                    isSession={true}
                    fadeIn={!hasAnimatedFirstPanel}
                />
            </div>
        );
    }

    // ── DONE PHASE ───────────────────────────────────────────────
    if (phase === 'done') {
        const completedExercises = queue.map(id => {
            const ex = exerciseInfo.find(e => e.id === id);
            const conf = getConfig(id, getLocalDateStr(new Date()));
            const w = conf ? conf.weight : null;
            const diff = conf ? conf.difficulty : 1.0;
            return ex ? { id: ex.id, label: getExerciseLabel(ex, t), reps: ex.goal, color: ex.color, icon: ex.icon, type: ex.type, weight: w, difficulty: diff } : null;
        }).filter(Boolean);

        const currentCategory = CATEGORY_ORDER[activeSlide];
        let sessionType = 'bodyweight';
        if (currentCategory === CATEGORIES.WEIGHTS) {
            sessionType = 'weights';
        } else if (currentCategory === CATEGORIES.CUSTOM) {
            sessionType = 'custom';
        } else if (currentCategory === CATEGORIES.CARDIO) {
            sessionType = 'cardio';
        }

        return (
            <SessionSummary
                queue={queue}
                exerciseInfo={exerciseInfo}
                onClose={onClose}
                sessionData={savedSession || {
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    exercises: completedExercises,
                    duration: sessionDuration,
                    name: sessionName,
                    type: sessionType,
                }}
                stats={computedStats}
                sessionHistory={getSessionHistory()}
                isPro={isPro}
                defaultSessionName={savedSession?.name || sessionName}

            />
        );
    }

    return null;
}
