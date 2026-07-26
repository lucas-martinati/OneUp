import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, Check, ChevronRight, ChevronUp, ChevronDown } from '@utils/icons';
import { IconButton, Button, Input, ModalHeader } from '@components/ui';
import { useBackHandler } from '@hooks/useBackHandler';
import { Z_INDEX } from '@utils/zIndex';
import { DynamicIcon } from '@utils/icons';
import { MAX_EXERCISES_PER_CATEGORY } from '@store/useExercisesStore';

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

  // Available target categories for exercise migration
  const targetCategories = useMemo(() => {
    const customOverride = customCategories.find(c => c.id === 'custom');
    const otherUserCats = customCategories.filter(c => c.id !== 'custom');

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

  // Compute base exercise count per target category
  const baseCountPerCategory = useMemo(() => {
    const counts = { custom: defaultCustomExercises.length };
    customCategories.filter(c => c.id !== 'custom').forEach(cat => {
      if (!deletingCat || cat.id !== deletingCat.id) {
        counts[cat.id] = (exercisesByUserCategory?.[cat.id] || []).length;
      }
    });
    return counts;
  }, [customCategories, exercisesByUserCategory, defaultCustomExercises, deletingCat]);

  // Compute how many exercises are being moved TO each target
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

    const otherUserCats = customCategories.filter(c => c.id !== 'custom' && c.id !== cat.id);
    const availableTargets = [
      { id: 'custom', count: defaultCustomExercises.length },
      ...otherUserCats.map(c => ({ 
        id: c.id, 
        count: (exercisesByUserCategory?.[c.id] || []).length 
      }))
    ];

    const remainingSlots = {};
    availableTargets.forEach(tc => {
      remainingSlots[tc.id] = MAX_EXERCISES_PER_CATEGORY - tc.count;
    });

    const sel = {};
    const targets = {};
    exercises.forEach(ex => {
      const targetWithSpace = availableTargets.find(tc => remainingSlots[tc.id] > 0);
      if (targetWithSpace) {
        sel[ex.id] = true;
        targets[ex.id] = targetWithSpace.id;
        remainingSlots[targetWithSpace.id]--;
      } else {
        sel[ex.id] = false;
        targets[ex.id] = 'custom';
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
        return { ...prev, [exId]: false };
      }
      const firstWithSpace = targetCategories.find(tc => availableSlots[tc.id] > 0);
      if (!firstWithSpace) return prev;
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
        <ModalHeader
          title={view === 'delete' ? t('customCategories.deleteTitle') : t('customCategories.title')}
          onClose={onClose}
        />

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* ═══════ LIST VIEW ═══════ */}
          {view === 'list' && (
            <div style={{ width: '100%', maxWidth: '440px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                {[
                  { id: 'custom', name: t('common.custom'), color: '#34d399', ...customCategories.find(c => c.id === 'custom') },
                  ...customCategories.filter(c => c.id !== 'custom')
                ].map(cat => {
                  const isBuiltIn = cat.id === 'custom';
                  const exerciseCount = isBuiltIn ? defaultCustomExercises.length : (exercisesByUserCategory?.[cat.id]?.length || 0);
                  return (
                    <div key={cat.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                      background: 'var(--surface-muted)', border: `1px solid ${cat.color}30`
                    }}>
                      <div className="row gap-12" style={{ alignItems: 'center' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
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
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {!isBuiltIn && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '4px' }}>
                            {(() => {
                              const userCatsOnly = customCategories.filter(c => c.id !== 'custom');
                              const userIndex = userCatsOnly.findIndex(c => c.id === cat.id);
                              return (
                                <>
                                  <IconButton
                                    icon={ChevronUp}
                                    onClick={() => moveCategory(cat.id, 'up')}
                                    disabled={userIndex === 0}
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Monter"
                                  />
                                  <IconButton
                                    icon={ChevronDown}
                                    onClick={() => moveCategory(cat.id, 'down')}
                                    disabled={userIndex === userCatsOnly.length - 1}
                                    variant="ghost"
                                    size="sm"
                                    aria-label="Descendre"
                                  />
                                </>
                              );
                            })()}
                          </div>
                        )}
                        <IconButton icon={Edit2} onClick={() => handleEdit(cat)} variant="ghost" size="sm" aria-label="Modifier" />
                        {!isBuiltIn && (
                          <IconButton icon={Trash2} onClick={() => handleStartDelete(cat)} variant="danger-ghost" size="sm" aria-label="Supprimer" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {customCategories.filter(c => c.id !== 'custom').length < maxCustomCategories && (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={Plus}
                  onClick={() => {
                    setEditingId(null);
                    setName('');
                    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
                    setError('');
                    setView('create');
                  }}
                >
                  {t('customCategories.create')}
                </Button>
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
            <div className="fade-in" style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              {/* NAME */}
              <div>
                <Input
                  label={t('customCategories.nameLabel')}
                  type="text"
                  maxLength={20}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('customCategories.namePlaceholder')}
                  autoFocus
                  error={error}
                />
              </div>

              {/* COLOR */}
              <div>
                <label className="input-label" style={{ marginBottom: 'var(--space-2)' }}>
                  {t('customCategories.colorLabel')}
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between' }}>
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
                  padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                  background: `${color}10`, border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
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
                      {t('common.preview')}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--space-3)' }}>
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() => {
                    setEditingId(null);
                    setView('list');
                  }}
                >
                  {t('common.cancel')}
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={handleSave}
                >
                  {t('common.save')}
                </Button>
              </div>
            </div>
          )}

          {/* ═══════ DELETE VIEW — Exercise Migration ═══════ */}
          {view === 'delete' && deletingCat && (
            <div className="fade-in" style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

              {/* Header: category being deleted */}
              <div style={{
                padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                background: 'color-mix(in srgb, var(--error) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--error) 30%, transparent)',
                display: 'flex', alignItems: 'center', gap: '12px'
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                  background: `${deletingCat.color}20`, border: `2px solid ${deletingCat.color}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Trash2 size={20} color="var(--error)" />
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: 'var(--error)', fontSize: '0.95rem' }}>
                    {t('customCategories.deleteConfirm', { name: deletingCat.name })}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {t('customCategories.deleteSelectExercises')}
                  </div>
                </div>
              </div>

              {/* Exercise list with checkboxes and target selector */}
              <div className="flex-col gap-8">
                {deletingExercises.map(ex => {
                  const isSelected = selectedExercises[ex.id];
                  const targetCatId = exerciseTargets[ex.id] || 'custom';
                  const targetCat = targetCategories.find(c => c.id === targetCatId);

                  return (
                    <div key={ex.id} style={{
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--surface-muted)' : 'transparent',
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
                          width: '24px', height: '24px', borderRadius: 'var(--radius-xs)',
                          background: isSelected ? 'var(--success)' : 'transparent',
                          border: isSelected ? '2px solid var(--success)' : '2px solid var(--border-default)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s', flexShrink: 0
                        }}>
                          {isSelected && <Check size={14} color="white" />}
                        </div>

                        <div style={{
                          width: '32px', height: '32px', borderRadius: 'var(--radius-xs)',
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
                                  background: isCurrentTarget ? `${tc.color}30` : 'var(--surface-subtle)',
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
                background: 'color-mix(in srgb, var(--warning) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)',
                fontSize: '0.8rem', color: 'var(--warning)', fontWeight: '600', textAlign: 'center'
              }}>
                {selectedCount > 0
                  ? t('customCategories.deleteSummaryKeep', { keep: selectedCount, del: deletingExercises.length - selectedCount })
                  : t('customCategories.deleteSummaryAll', { count: deletingExercises.length })
                }
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={() => { setView('list'); setDeletingCat(null); }}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  fullWidth
                  onClick={handleConfirmDelete}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

