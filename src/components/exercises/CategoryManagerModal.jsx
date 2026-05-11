import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Trash2, Edit2, FolderPlus, Check, ChevronRight, Lock, ChevronUp, ChevronDown } from '../../utils/icons';
import { useBackHandler } from '../../hooks/useBackHandler';
import { Z_INDEX } from '../../utils/zIndex';
import { DynamicIcon } from '../../utils/icons';
import { MAX_EXERCISES_PER_CATEGORY } from '../../hooks/useCustomExercises';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f43f5e', '#6366f1', '#14b8a6', '#64748b'
];

export function CategoryManagerModal({ onClose, customCategoriesHook, exercisesByUserCategory, defaultCustomExercises = [] }) {
  const { t } = useTranslation();
  const { customCategories, addCategory, updateCategory, deleteCategory, moveCategory, maxCustomCategories } = customCategoriesHook;

  const [view, setView] = useState('list'); // 'list' | 'create' | 'delete'
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [error, setError] = useState('');

  // Delete flow state
  const [deletingCat, setDeletingCat] = useState(null);
  const [selectedExercises, setSelectedExercises] = useState({}); // { exId: true/false }
  const [exerciseTargets, setExerciseTargets] = useState({}); // { exId: targetCatId }

  // Available target categories for exercise migration (built-in custom + other user categories)
  const targetCategories = useMemo(() => {
    // 1. Get custom override
    const customOverride = customCategories.find(c => c.id === 'custom');
    
    // 2. Filter other user categories (preserving their array order)
    const otherUserCats = customCategories.filter(c => c.id !== 'custom');

    // 3. Build ordered targets list
    const targets = [{ 
      id: 'custom', 
      name: customOverride?.name || t('common.custom'), 
      color: customOverride?.color || '#34d399' 
    }];

    otherUserCats.forEach(cat => {
      if (!deletingCat || cat.id !== deletingCat.id) {
        targets.push(cat);
      }
    });
    return targets;
  }, [customCategories, deletingCat, t]);

  // Compute base exercise count per target category (before any moves)
  const baseCountPerCategory = useMemo(() => {
    const counts = { custom: defaultCustomExercises.length };
    customCategories.filter(c => c.id !== 'custom').forEach(cat => {
      if (!deletingCat || cat.id !== deletingCat.id) {
        counts[cat.id] = (exercisesByUserCategory?.[cat.id] || []).length;
      }
    });
    return counts;
  }, [customCategories, exercisesByUserCategory, defaultCustomExercises, deletingCat]);

  // Compute how many exercises are being moved TO each target (dynamically)
  const movesPerTarget = useMemo(() => {
    const counts = {};
    Object.entries(selectedExercises).forEach(([exId, isSelected]) => {
      if (isSelected) {
        const target = exerciseTargets[exId] || 'custom';
        counts[target] = (counts[target] || 0) + 1;
      }
    });
    return counts;
  }, [selectedExercises, exerciseTargets]);

  // Available slots per target category
  const availableSlots = useMemo(() => {
    const slots = {};
    targetCategories.forEach(tc => {
      const base = baseCountPerCategory[tc.id] || 0;
      const incoming = movesPerTarget[tc.id] || 0;
      slots[tc.id] = MAX_EXERCISES_PER_CATEGORY - base - incoming;
    });
    return slots;
  }, [targetCategories, baseCountPerCategory, movesPerTarget]);

  useBackHandler(() => {
    if (view === 'delete') {
      setView('list');
      setDeletingCat(null);
      return true;
    }
    if (view === 'create') {
      setView('list');
      setEditingId(null);
      return true;
    }
    onClose();
    return true;
  }, true);

  const handleSave = () => {
    // Allow empty name for built-in 'custom' category (it will fallback to default translation)
    if (!name.trim() && editingId !== 'custom') {
      setError(t('customCategories.errorNameRequired'));
      return;
    }

    if (editingId) {
      updateCategory(editingId, { name: name.trim(), color });
      setEditingId(null);
    } else {
      const success = addCategory(name.trim(), color);
      if (!success) {
        setError(t('customCategories.limitReached', { count: maxCustomCategories }));
        return;
      }
    }

    setName('');
    setColor('#8b5cf6');
    setError('');
    setView('list');
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);
    setColor(cat.color);
    setError('');
    setView('create');
  };

  const handleStartDelete = (cat) => {
    const exercises = exercisesByUserCategory?.[cat.id] || [];
    if (exercises.length === 0) {
      deleteCategory(cat.id, {}, []);
      return;
    }

    // Build available target list in order: Custom first, then others in their current order
    const otherUserCats = customCategories.filter(c => c.id !== 'custom' && c.id !== cat.id);

    const availableTargets = [
      { id: 'custom', count: defaultCustomExercises.length },
      ...otherUserCats.map(c => ({ 
        id: c.id, 
        count: (exercisesByUserCategory?.[c.id] || []).length 
      }))
    ];

    // Track remaining slots per target as we assign exercises
    const remainingSlots = {};
    availableTargets.forEach(tc => {
      remainingSlots[tc.id] = MAX_EXERCISES_PER_CATEGORY - tc.count;
    });

    // Assign each exercise to the first target with space, or uncheck it
    const sel = {};
    const targets = {};
    exercises.forEach(ex => {
      const targetWithSpace = availableTargets.find(tc => remainingSlots[tc.id] > 0);
      if (targetWithSpace) {
        sel[ex.id] = true;
        targets[ex.id] = targetWithSpace.id;
        remainingSlots[targetWithSpace.id]--;
      } else {
        sel[ex.id] = false; // No space anywhere — will be deleted
        targets[ex.id] = 'custom'; // Default fallback (won't matter since unchecked)
      }
    });

    setSelectedExercises(sel);
    setExerciseTargets(targets);
    setDeletingCat(cat);
    setView('delete');
  };

  const handleConfirmDelete = () => {
    const exercises = exercisesByUserCategory?.[deletingCat.id] || [];
    const exerciseMoves = {};
    const exercisesToDelete = [];

    exercises.forEach(ex => {
      if (selectedExercises[ex.id]) {
        exerciseMoves[ex.id] = exerciseTargets[ex.id] || 'custom';
      } else {
        exercisesToDelete.push(ex.id);
      }
    });

    deleteCategory(deletingCat.id, exerciseMoves, exercisesToDelete);
    setDeletingCat(null);
    setView('list');
  };

  const toggleExercise = (exId) => {
    setSelectedExercises(prev => {
      const wasSelected = prev[exId];
      if (wasSelected) {
        // Unchecking — always allowed
        return { ...prev, [exId]: false };
      }
      // Checking — find a target with space
      const firstWithSpace = targetCategories.find(tc => availableSlots[tc.id] > 0);
      if (!firstWithSpace) return prev; // No space anywhere — can't check
      setExerciseTargets(p => ({ ...p, [exId]: firstWithSpace.id }));
      return { ...prev, [exId]: true };
    });
  };

  const setExerciseTarget = (exId, targetCatId) => {
    setExerciseTargets(prev => ({ ...prev, [exId]: targetCatId }));
  };

  const deletingExercises = deletingCat ? (exercisesByUserCategory?.[deletingCat.id] || []) : [];
  const selectedCount = Object.values(selectedExercises).filter(Boolean).length;

  return (
    <div className="fade-in modal-overlay" style={{ zIndex: Z_INDEX.TOAST }}>
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 className="panel-title" style={{ margin: 0, textAlign: 'left' }}>
            {view === 'delete' ? t('customCategories.deleteTitle') : t('customCategories.title')}
          </h2>
          <button onClick={onClose} className="glass hover-lift" style={{
            width: '40px', height: '40px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-secondary)'
          }}><X size={20} /></button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* ═══════ LIST VIEW ═══════ */}
          {view === 'list' && (
            <div style={{ width: '100%', maxWidth: '400px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {[
                  { id: 'custom', name: t('common.custom'), color: '#34d399', ...customCategories.find(c => c.id === 'custom') },
                  ...customCategories.filter(c => c.id !== 'custom')
                ].map(cat => {
                  const isBuiltIn = cat.id === 'custom';
                  const exerciseCount = isBuiltIn ? defaultCustomExercises.length : (exercisesByUserCategory?.[cat.id]?.length || 0);
                  return (
                    <div key={cat.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px', borderRadius: 'var(--radius-lg)',
                      background: 'var(--surface-muted)', border: `1px solid ${cat.color}30`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '12px',
                          background: `${cat.color}20`, border: `2px solid ${cat.color}50`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <div style={{
                            width: '16px', height: '16px', borderRadius: '50%',
                            background: cat.color,
                            boxShadow: `0 0 8px ${cat.color}66`
                          }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{cat.name || (isBuiltIn ? t('common.custom') : '')}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {t('common.exerciseCount', { count: exerciseCount })}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {!isBuiltIn && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '4px' }}>
                            {(() => {
                              const userCatsOnly = customCategories.filter(c => c.id !== 'custom');
                              const userIndex = userCatsOnly.findIndex(c => c.id === cat.id);
                              return (
                                <>
                                  <button 
                                    onClick={() => moveCategory(cat.id, 'up')}
                                    disabled={userIndex === 0}
                                    style={{
                                      background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                                      padding: '2px', cursor: userIndex === 0 ? 'default' : 'pointer', 
                                      opacity: userIndex === 0 ? 0.2 : 0.5, height: '18px'
                                    }}
                                  >
                                    <ChevronUp size={16} />
                                  </button>
                                  <button 
                                    onClick={() => moveCategory(cat.id, 'down')}
                                    disabled={userIndex === userCatsOnly.length - 1}
                                    style={{
                                      background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                                      padding: '2px', cursor: (userIndex === userCatsOnly.length - 1) ? 'default' : 'pointer', 
                                      opacity: (userIndex === userCatsOnly.length - 1) ? 0.2 : 0.5, height: '18px'
                                    }}
                                  >
                                    <ChevronDown size={16} />
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        )}
                        <button onClick={() => handleEdit(cat)} style={{
                          background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                          padding: '8px', cursor: 'pointer', opacity: 0.8
                        }}>
                          <Edit2 size={20} />
                        </button>
                        {!isBuiltIn && (
                          <button onClick={() => handleStartDelete(cat)} style={{
                            background: 'transparent', border: 'none', color: '#ef4444',
                            padding: '8px', cursor: 'pointer', opacity: 0.8
                          }}>
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {customCategories.filter(c => c.id !== 'custom').length < maxCustomCategories && (
                <button onClick={() => {
                  setEditingId(null);
                  setName('');
                  setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
                  setError('');
                  setView('create');
                }} className="hover-lift" style={{
                  width: '100%', padding: '16px', borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', border: 'none', color: 'white',
                  fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}>
                  <Plus size={20} /> {t('customCategories.create')}
                </button>
              )}
              {customCategories.filter(c => c.id !== 'custom').length >= maxCustomCategories && (
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {t('customCategories.limitReached', { count: maxCustomCategories })}
                </p>
              )}
            </div>
          )}

          {/* ═══════ CREATE / EDIT VIEW ═══════ */}
          {view === 'create' && (
            <div className="fade-in" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* NAME */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {t('customCategories.nameLabel')}
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('customCategories.namePlaceholder')}
                  autoFocus
                  style={{
                    width: '100%', padding: '16px', borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${name ? color + '50' : 'var(--border-subtle)'}`,
                    background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '1.05rem', fontWeight: '600',
                    outline: 'none', boxSizing: 'border-box', transition: 'all 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = color}
                  onBlur={(e) => e.target.style.borderColor = name ? color + '50' : 'var(--border-subtle)'}
                />
              </div>

              {/* COLOR */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {t('customCategories.colorLabel')}
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'space-between' }}>
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setColor(c)} className="hover-lift" style={{
                      width: '38px', height: '38px', borderRadius: '50%',
                      background: c, border: color === c ? '3px solid white' : 'none',
                      boxShadow: color === c ? `0 0 0 3px ${c}50` : 'none',
                      cursor: 'pointer', transition: 'all 0.2s', padding: 0
                    }} />
                  ))}
                </div>
              </div>

              {/* PREVIEW */}
              {name.trim() && (
                <div style={{
                  padding: '16px', borderRadius: 'var(--radius-lg)',
                  background: `${color}10`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: `${color}20`, border: `2px solid ${color}50`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      background: color, boxShadow: `0 0 8px ${color}66`
                    }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', color, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {name.trim()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {t('customCategories.preview')}
                    </div>
                  </div>
                </div>
              )}

              {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button onClick={() => {
                  setEditingId(null);
                  setView('list');
                }} style={{
                  flex: 1, padding: '14px', borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-muted)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '600'
                }}>{t('common.cancel')}</button>

                <button onClick={handleSave} style={{
                  flex: 1, padding: '14px', borderRadius: 'var(--radius-md)',
                  background: color, border: 'none',
                  color: 'white', fontSize: '1rem', fontWeight: '700'
                }}>{t('common.save')}</button>
              </div>
            </div>
          )}

          {/* ═══════ DELETE VIEW — Exercise Migration ═══════ */}
          {view === 'delete' && deletingCat && (
            <div className="fade-in" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Header: category being deleted */}
              <div style={{
                padding: '16px', borderRadius: 'var(--radius-lg)',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: `${deletingCat.color}20`, border: `2px solid ${deletingCat.color}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Trash2 size={20} color="#ef4444" />
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: '#ef4444', fontSize: '0.95rem' }}>
                    {t('customCategories.deleteConfirm', { name: deletingCat.name })}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {t('customCategories.deleteSelectExercises')}
                  </div>
                </div>
              </div>

              {/* Exercise list with checkboxes and target selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {deletingExercises.map(ex => {
                  const isSelected = selectedExercises[ex.id];
                  const targetCatId = exerciseTargets[ex.id] || 'custom';
                  const targetCat = targetCategories.find(c => c.id === targetCatId);

                  return (
                    <div key={ex.id} style={{
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--surface-muted)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected ? (targetCat?.color || '#34d399') + '30' : 'var(--border-subtle)'}`,
                      overflow: 'hidden', transition: 'all 0.2s'
                    }}>
                      {/* Exercise row: checkbox + name */}
                      <div
                        onClick={() => toggleExercise(ex.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 16px', cursor: 'pointer'
                        }}
                      >
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '6px',
                          background: isSelected ? '#10b981' : 'transparent',
                          border: isSelected ? '2px solid #10b981' : '2px solid var(--border-subtle)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s', flexShrink: 0
                        }}>
                          {isSelected && <Check size={14} color="white" />}
                        </div>

                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          background: `${ex.color || '#8b5cf6'}15`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <DynamicIcon icon={ex.icon} size={16} color={ex.color || '#8b5cf6'} />
                        </div>

                        <div style={{
                          flex: 1, fontWeight: '600', fontSize: '0.9rem',
                          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                          textDecoration: isSelected ? 'none' : 'line-through',
                          opacity: isSelected ? 1 : 0.5,
                          transition: 'all 0.2s'
                        }}>
                          {ex.label}
                        </div>
                      </div>

                      {/* Target category selector — only visible when exercise is selected */}
                      {isSelected && (
                        <div style={{
                          padding: '0 16px 12px 52px',
                          display: 'flex', alignItems: 'center', gap: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <ChevronRight size={14} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                          {targetCategories.map(tc => {
                            const isCurrentTarget = targetCatId === tc.id;
                            // Available slots: for the currently selected target, this exercise is already counted in movesPerTarget, so add 1 back
                            const slotsLeft = (availableSlots[tc.id] || 0) + (isCurrentTarget ? 1 : 0);
                            const isFull = slotsLeft <= 0;
                            const isDisabled = isFull && !isCurrentTarget;

                            return (
                              <button
                                key={tc.id}
                                onClick={() => { if (!isDisabled) setExerciseTarget(ex.id, tc.id); }}
                                disabled={isDisabled}
                                style={{
                                  padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem',
                                  fontWeight: '700', border: 'none',
                                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                                  opacity: isDisabled ? 0.35 : 1,
                                  background: isCurrentTarget ? `${tc.color}30` : 'rgba(255,255,255,0.05)',
                                  color: isCurrentTarget ? tc.color : 'var(--text-secondary)',
                                  outline: isCurrentTarget ? `1.5px solid ${tc.color}50` : 'none',
                                  transition: 'all 0.15s',
                                  display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                              >
                                {tc.name}
                                <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>
                                  {isFull ? '🔒' : `(${slotsLeft})`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div style={{
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
                fontSize: '0.8rem', color: '#fbbf24', fontWeight: '600', textAlign: 'center'
              }}>
                {selectedCount > 0
                  ? t('customCategories.deleteSummaryKeep', { keep: selectedCount, del: deletingExercises.length - selectedCount })
                  : t('customCategories.deleteSummaryAll', { count: deletingExercises.length })
                }
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button
                  onClick={() => { setView('list'); setDeletingCat(null); }}
                  style={{
                    flex: 1, padding: '14px', borderRadius: 'var(--radius-md)',
                    background: 'var(--surface-muted)', border: '1px solid var(--border-subtle)',
                    color: 'white', fontWeight: '700', fontSize: '0.95rem'
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="hover-lift"
                  style={{
                    flex: 1, padding: '14px', borderRadius: 'var(--radius-md)',
                    background: '#ef4444', border: 'none', color: 'white',
                    fontWeight: '700', fontSize: '0.95rem'
                  }}
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
