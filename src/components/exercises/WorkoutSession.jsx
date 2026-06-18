import { X, Play, Check, Save, FolderOpen, Trash2, GripVertical, Pencil, Shuffle, ChevronUp, ChevronDown, DynamicIcon } from '../../utils/icons';
import { IconButton } from '../ui';
import { WEIGHT_EXERCISES_MAP } from '../../config/weights';
import { Z_INDEX } from '../../utils/zIndex';
import { SessionSummary } from './SessionSummary';
import { ExercisePanel } from './ExercisePanel';
import { getSessionHistory } from '../../features/share/services/sessionHistoryService';
import { getExerciseLabel } from '../../utils/exerciseLabel';
import { CATEGORIES, CATEGORY_ORDER, isUserCategory } from '../../config/categories';
import { useWorkoutSession } from '../../hooks/useWorkoutSession';
import { getLocalDateStr } from '../../utils/dateUtils';

// ── Exercise grid item ──────────────────────────────────────────────────
function ExerciseGridItem({ ex, selected, orderNum, onToggle, t }) {
    let backgroundStyle = 'rgba(255,255,255,0.05)';
    if (ex.done) {
        backgroundStyle = 'rgba(255,255,255,0.03)';
    } else if (selected) {
        backgroundStyle = `linear-gradient(135deg, ${ex.color}25, ${ex.color}12)`;
    }

    let colorStyle = 'var(--text-secondary)';
    if (ex.done) {
        colorStyle = '#555';
    } else if (selected) {
        colorStyle = ex.color;
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
            style={{
                padding: '14px 10px', borderRadius: 'var(--radius-md)',
                background: backgroundStyle,
                border: selected
                    ? `2px solid ${ex.color}80`
                    : '2px solid rgba(255,255,255,0.08)',
                color: colorStyle,
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
            <DynamicIcon icon={ex.icon} size={24} />
            <span style={{ fontSize: '0.75rem', fontWeight: '600', textAlign: 'center' }}>
                {getExerciseLabel(ex, t)}
            </span>
            <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>
                {remainingLabel}
            </span>
        </button>
    );
}

export function WorkoutSession(props) {
    const ws = useWorkoutSession(props);
    const {
        phase, queue, setQueue, showSaveRoutine, setShowSaveRoutine,
        routineName, setRoutineName, showRoutineList, setShowRoutineList,
        confirmDeleteId, setConfirmDeleteId,
        dragIdx, dragOverIdx, queueListRef, itemRefs,
        sessionDuration, savedSession, sessionName,
        hasAnimatedFirstPanel, showAll, setShowAll,
        t, computedStats, isPro, fullCategoryOrder, fullCategoryColors,
        routines, deleteRoutine, maxRoutines, customCategories, localExercises,
        exerciseInfo, allExercises, canMixDashboards,
        currentEx, currentExId, currentGoal, currentCount, currentDone,
        currentDifficulty, hasNextAvailableExercise,
        updateExerciseCount, getConfig,
        toggleExercise, shuffleQueue, startSession, loadRoutine,
        handleSaveRoutine, editRoutine, advanceToNext,
        moveItem, clearQueue,
        handleDragStart, handleDragOver, handleDragEnd,
        handleTouchStart, handleTouchMove, handleTouchEnd,
        today, dayNumber, activeSlide, onClose,
    } = ws;


    if (phase === 'config') {
        return (
            <div className="fade-in modal-overlay" style={{ zIndex: Z_INDEX.TOAST }}>
                <div className="modal-content">
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 'var(--spacing-sm)',
                }}>
                    <h2 className="panel-title" style={{ 
                        margin: 0, 
                        textAlign: 'left',
                        background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        {t('dashboard.session')}
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
                        <IconButton icon={X} variant="glass" onClick={onClose} className="hover-lift" aria-label="Close" style={{ flexShrink: 0 }} />
                    </div>
                </div>

                <div style={{
                    flex: 1, overflowY: 'auto',
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
                                                    return <DynamicIcon key={exId} icon={ex.icon} size={12} color={ex.color} />;
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
                                <input 
                                    type="checkbox" 
                                    checked={showAll} 
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setShowAll(checked);
                                        if (!checked) {
                                            const localIds = new Set(localExercises.map(ex => ex.id));
                                            setQueue(prev => prev.filter(id => localIds.has(id)));
                                        }
                                    }} 
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    )}

                    {/* ── Exercise selection grid (stable position — above queue) ── */}
                    <div style={{
                        fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px',
                        color: 'var(--text-secondary)', fontWeight: '600'
                    }}>
                        {t('workout.selectExercises')}
                    </div>

                    {showAll ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                                    <div key={catId} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{
                                            fontSize: '0.8rem', fontWeight: '700', color: fullCategoryColors[catId] || 'var(--text-secondary)',
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

                    {/* ── Selected order (drag & drop) — below grid ── */}
                    {queue.length > 0 && (
                        <>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div style={{
                                    fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px',
                                    color: 'var(--text-secondary)', fontWeight: '600'
                                }}>
                                    {t('workout.yourOrder')} ({queue.length})
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {queue.length >= 2 && (
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
                                    )}
                                    <button
                                        onClick={clearQueue}
                                        className="hover-lift"
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                            padding: '6px 12px', borderRadius: '20px',
                                            background: 'rgba(239,68,68,0.08)',
                                            border: '1px solid rgba(239,68,68,0.2)',
                                            color: '#f87171', cursor: 'pointer',
                                            fontSize: '0.7rem', fontWeight: '600'
                                        }}
                                    >
                                        <Trash2 size={12} />
                                        {t('workout.clearAll')}
                                    </button>
                                </div>
                            </div>
                        <div
                            ref={queueListRef}
                            style={{
                                display: 'flex', flexDirection: 'column', gap: '5px',
                                padding: '10px', borderRadius: '16px',
                                background: 'linear-gradient(180deg, rgba(129,140,248,0.06), rgba(139,92,246,0.04))',
                                border: '1px solid rgba(129,140,248,0.12)'
                            }}
                        >
                            {queue.map((id, i) => {
                                const ex = allExercises.find(e => e.id === id);
                                if (!ex) return null;
                                const isDragging = dragIdx === i;
                                const isDragOver = dragOverIdx === i;
                                const isFirst = i === 0;
                                const isLast = i === queue.length - 1;

                                let itemBg = `linear-gradient(135deg, ${ex.color}0a, ${ex.color}05)`;
                                if (isDragging) {
                                    itemBg = `${ex.color}20`;
                                } else if (isDragOver) {
                                    itemBg = 'rgba(129,140,248,0.18)';
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
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '10px 8px', borderRadius: '14px',
                                            background: itemBg,
                                            border: isDragOver
                                                ? '1.5px dashed rgba(129,140,248,0.5)'
                                                : `1px solid ${ex.color}18`,
                                            cursor: 'grab', userSelect: 'none',
                                            opacity: isDragging ? 0.5 : 1,
                                            transform: isDragging ? 'scale(0.97)' : 'scale(1)',
                                            transition: isDragging ? 'none' : 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                            touchAction: 'none'
                                        }}
                                    >
                                        {/* Drag handle */}
                                        <GripVertical size={14} color="var(--text-secondary)" style={{ opacity: 0.3, flexShrink: 0 }} />

                                        {/* Number badge */}
                                        <div style={{
                                            width: '22px', height: '22px', borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${ex.color}, ${ex.color}cc)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.6rem', fontWeight: '800', color: 'white',
                                            flexShrink: 0,
                                            boxShadow: `0 2px 6px ${ex.color}40`
                                        }}>
                                            {i + 1}
                                        </div>

                                        {/* Icon + name */}
                                        <DynamicIcon icon={ex.icon} size={16} color={ex.color} />
                                        <span style={{
                                            fontSize: '0.78rem', fontWeight: '600', color: ex.color, flex: 1,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                        }}>{getExerciseLabel(ex, t)}</span>

                                        {/* Weight badge */}
                                        {WEIGHT_EXERCISES_MAP[id] && (
                                            <span style={{
                                                fontSize: '0.6rem', fontWeight: '700',
                                                color: 'var(--text-secondary)',
                                                background: `${ex.color}12`,
                                                padding: '2px 7px', borderRadius: '10px',
                                                border: `1px solid ${ex.color}18`
                                            }}>
                                                {getConfig(id)?.weight || 0} {t('weight.kg')}
                                            </span>
                                        )}

                                        {/* Arrow buttons for reorder */}
                                        <div style={{
                                            display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0
                                        }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); moveItem(i, i - 1); }}
                                                disabled={isFirst}
                                                aria-label="Move up"
                                                style={{
                                                    width: '20px', height: '16px', borderRadius: '6px 6px 2px 2px',
                                                    background: isFirst ? 'transparent' : 'rgba(255,255,255,0.06)',
                                                    border: 'none',
                                                    color: isFirst ? 'rgba(255,255,255,0.1)' : 'var(--text-secondary)',
                                                    cursor: isFirst ? 'default' : 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    padding: 0, transition: 'all 0.15s'
                                                }}
                                            >
                                                <ChevronUp size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); moveItem(i, i + 1); }}
                                                disabled={isLast}
                                                aria-label="Move down"
                                                style={{
                                                    width: '20px', height: '16px', borderRadius: '2px 2px 6px 6px',
                                                    background: isLast ? 'transparent' : 'rgba(255,255,255,0.06)',
                                                    border: 'none',
                                                    color: isLast ? 'rgba(255,255,255,0.1)' : 'var(--text-secondary)',
                                                    cursor: isLast ? 'default' : 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    padding: 0, transition: 'all 0.15s'
                                                }}
                                            >
                                                <ChevronDown size={12} />
                                            </button>
                                        </div>

                                        {/* Remove button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleExercise(id); }}
                                            style={{
                                                width: '22px', height: '22px', borderRadius: '50%',
                                                background: 'rgba(239,68,68,0.08)', border: 'none',
                                                color: '#f87171', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0, transition: 'all 0.15s'
                                            }}
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Reorder hint */}
                        {queue.length >= 2 && (
                            <div style={{
                                textAlign: 'center', fontSize: '0.65rem',
                                color: 'var(--text-secondary)', opacity: 0.5,
                                fontStyle: 'italic'
                            }}>
                                {t('workout.reorderHint')}
                            </div>
                        )}
                        </>
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
                    display: 'flex', gap: '8px', paddingTop: 'var(--spacing-sm)'
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
                        const { weight } = getConfig(currentExId);
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
