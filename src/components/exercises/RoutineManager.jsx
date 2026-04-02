import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X, Plus, Play, Trash2, Edit3, Check, Save,
    Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints,
    Flame, Square, MoveDown, MoveDiagonal, FolderOpen
} from 'lucide-react';
import { EXERCISES } from '../../config/exercises';
import { registerBackHandler } from '../../utils/backHandler';
import ICON_MAP from '../../utils/iconMap';
import { Z_INDEX } from '../../utils/zIndex';
import { getExerciseLabel } from '../../utils/exerciseLabel';

export function RoutineManager({
    onClose, routines, saveRoutine, deleteRoutine, updateRoutine, maxRoutines, onLaunchRoutine
}) {
    const { t } = useTranslation();
    const [mode, setMode] = useState('list'); // 'list' | 'create' | 'edit'
    const [editId, setEditId] = useState(null);
    const [name, setName] = useState('');
    const [selectedExercises, setSelectedExercises] = useState([]);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    // Back handler
    useEffect(() => {
        const unreg = registerBackHandler(() => {
            if (mode === 'create' || mode === 'edit') {
                setMode('list');
                resetForm();
                return true;
            }
            onClose();
            return true;
        });
        return unreg;
    }, [mode, onClose]);

    const resetForm = () => {
        setName('');
        setSelectedExercises([]);
        setEditId(null);
    };

    const handleCreate = () => {
        if (routines.length >= maxRoutines) return;
        setMode('create');
        resetForm();
    };

    const handleEdit = (routine) => {
        setMode('edit');
        setEditId(routine.id);
        setName(routine.name);
        setSelectedExercises([...routine.exerciseIds]);
    };

    const handleSave = () => {
        if (!name.trim() || selectedExercises.length < 1) return;
        if (mode === 'edit' && editId) {
            updateRoutine(editId, name, selectedExercises);
        } else {
            saveRoutine(name, selectedExercises);
        }
        setMode('list');
        resetForm();
    };

    const handleDelete = (id) => {
        deleteRoutine(id);
        setConfirmDeleteId(null);
    };

    const toggleExercise = (id) => {
        setSelectedExercises(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // ── LIST MODE ──
    if (mode === 'list') {
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
                        background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        {t('routines.title')}
                    </h2>
                    <button onClick={onClose} className="hover-lift" style={{
                        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                        width: '40px', height: '40px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'white', cursor: 'pointer'
                    }}>
                        <X size={22} />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    flex: 1, overflowY: 'auto', padding: '0 var(--spacing-md)',
                    display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                    {routines.length === 0 ? (
                        <div style={{
                            flex: 1, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: '12px',
                            color: 'var(--text-secondary)', textAlign: 'center',
                            padding: 'var(--spacing-xl)'
                        }}>
                            <FolderOpen size={48} color="rgba(245,158,11,0.3)" />
                            <p style={{ fontSize: '1rem', fontWeight: '600' }}>
                                {t('routines.empty')}
                            </p>
                            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                                {t('routines.emptyHint')}
                            </p>
                        </div>
                    ) : (
                        routines.map(routine => {
                            const isDeleting = confirmDeleteId === routine.id;
                            return (
                                <div key={routine.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '14px', borderRadius: 'var(--radius-lg)',
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    transition: 'all 0.2s ease'
                                }}>
                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)',
                                            marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {routine.name}
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {routine.exerciseIds.map((exId, i) => {
                                                const ex = EXERCISES.find(e => e.id === exId);
                                                if (!ex) return null;
                                                const Icon = ICON_MAP[ex.icon] || Dumbbell;
                                                return (
                                                    <div key={exId} style={{
                                                        display: 'flex', alignItems: 'center', gap: '3px',
                                                        padding: '2px 8px', borderRadius: '12px',
                                                        background: `${ex.color}15`,
                                                        border: `1px solid ${ex.color}25`
                                                    }}>
                                                        <span style={{
                                                            fontSize: '0.55rem', fontWeight: '800',
                                                            color: 'var(--text-secondary)', width: '10px', textAlign: 'center'
                                                        }}>{i + 1}</span>
                                                        <Icon size={12} color={ex.color} />
                                                        <span style={{
                                                            fontSize: '0.65rem', fontWeight: '600', color: ex.color
                                                        }}>{getExerciseLabel(ex, t)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                        {isDeleting ? (
                                            <>
                                                <button
                                                    onClick={() => handleDelete(routine.id)}
                                                    className="hover-lift"
                                                    style={{
                                                        width: '36px', height: '36px', borderRadius: '50%',
                                                        background: '#ef4444', border: 'none', color: 'white',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(null)}
                                                    className="hover-lift"
                                                    style={{
                                                        width: '36px', height: '36px', borderRadius: '50%',
                                                        background: 'rgba(255,255,255,0.1)', border: 'none',
                                                        color: 'var(--text-secondary)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleEdit(routine)}
                                                    className="hover-lift"
                                                    style={{
                                                        width: '36px', height: '36px', borderRadius: '50%',
                                                        background: 'rgba(255,255,255,0.06)', border: 'none',
                                                        color: 'var(--text-secondary)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(routine.id)}
                                                    className="hover-lift"
                                                    style={{
                                                        width: '36px', height: '36px', borderRadius: '50%',
                                                        background: 'rgba(239,68,68,0.08)', border: 'none',
                                                        color: '#ef4444',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => onLaunchRoutine(routine.exerciseIds)}
                                                    className="hover-lift"
                                                    style={{
                                                        width: '36px', height: '36px', borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                                                        border: 'none', color: 'white',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
                                                    }}
                                                >
                                                    <Play size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Create button */}
                <div style={{ padding: 'var(--spacing-md)' }}>
                    <button
                        onClick={handleCreate}
                        disabled={routines.length >= maxRoutines}
                        className="hover-lift"
                        style={{
                            width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)',
                            background: routines.length >= maxRoutines
                                ? 'rgba(255,255,255,0.05)'
                                : 'linear-gradient(135deg, #f59e0b, #d97706)',
                            border: 'none', color: 'white',
                            fontSize: '1rem', fontWeight: '700',
                            cursor: routines.length >= maxRoutines ? 'default' : 'pointer',
                            opacity: routines.length >= maxRoutines ? 0.4 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '8px', transition: 'all 0.2s ease'
                        }}
                    >
                        <Plus size={20} />
                        {routines.length >= maxRoutines
                            ? t('routines.maxReached')
                            : t('routines.newRoutine')
                        }
                    </button>
                </div>
            </div>
        );
    }

    // ── CREATE / EDIT MODE ──
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
                    background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    {mode === 'edit' ? t('routines.editRoutine') : t('routines.newRoutine')}
                </h2>
                <button onClick={() => { setMode('list'); resetForm(); }} className="hover-lift" style={{
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
                {/* Name input */}
                <div>
                    <label style={{
                        fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px',
                        color: 'var(--text-secondary)', fontWeight: '600', display: 'block',
                        marginBottom: '8px'
                    }}>
                        {t('routines.routineName')}
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value.slice(0, 30))}
                        placeholder={t('routines.namePlaceholder')}
                        style={{
                            width: '100%', padding: '14px 16px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1.5px solid rgba(255,255,255,0.12)',
                            borderRadius: 'var(--radius-md)',
                            color: 'white', fontSize: '1rem', fontWeight: '600',
                            outline: 'none',
                            transition: 'border-color 0.2s ease',
                            boxSizing: 'border-box'
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                        maxLength={30}
                        autoFocus
                    />
                </div>

                {/* Exercise selection */}
                <div>
                    <label style={{
                        fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px',
                        color: 'var(--text-secondary)', fontWeight: '600', display: 'block',
                        marginBottom: '8px'
                    }}>
                        {t('routines.selectExercises')}
                    </label>

                    {/* Selected order preview */}
                    {selectedExercises.length > 0 && (
                        <div style={{
                            display: 'flex', gap: '6px', flexWrap: 'wrap',
                            padding: '10px', borderRadius: 'var(--radius-md)',
                            background: 'rgba(245,158,11,0.06)',
                            border: '1px solid rgba(245,158,11,0.12)',
                            marginBottom: '10px'
                        }}>
                            {selectedExercises.map((id, i) => {
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
                                        }}>{getExerciseLabel(ex, t)}</span>
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
                        {EXERCISES.map(ex => {
                            const Icon = ICON_MAP[ex.icon] || Dumbbell;
                            const selected = selectedExercises.includes(ex.id);
                            const orderNum = selected ? selectedExercises.indexOf(ex.id) + 1 : null;
                            return (
                                <button
                                    key={ex.id}
                                    onClick={() => toggleExercise(ex.id)}
                                    style={{
                                        padding: '14px 10px', borderRadius: 'var(--radius-md)',
                                        background: selected
                                            ? `linear-gradient(135deg, ${ex.color}25, ${ex.color}12)`
                                            : 'rgba(255,255,255,0.05)',
                                        border: selected
                                            ? `2px solid ${ex.color}80`
                                            : '2px solid rgba(255,255,255,0.08)',
                                        color: selected ? ex.color : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', gap: '6px',
                                        transition: 'all 0.2s ease',
                                        position: 'relative'
                                    }}
                                >
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
                                    }}>{getExerciseLabel(ex, t)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Save button */}
            <div style={{ padding: 'var(--spacing-md)' }}>
                <button
                    onClick={handleSave}
                    disabled={!name.trim() || selectedExercises.length < 1}
                    className="hover-lift"
                    style={{
                        width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)',
                        background: name.trim() && selectedExercises.length >= 1
                            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                            : 'rgba(255,255,255,0.05)',
                        border: 'none', color: 'white',
                        fontSize: '1rem', fontWeight: '700',
                        cursor: name.trim() && selectedExercises.length >= 1 ? 'pointer' : 'default',
                        opacity: name.trim() && selectedExercises.length >= 1 ? 1 : 0.4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '8px', transition: 'all 0.2s ease'
                    }}
                >
                    <Save size={20} />
                    {t('routines.save')}
                </button>
            </div>
        </div>
    );
}
