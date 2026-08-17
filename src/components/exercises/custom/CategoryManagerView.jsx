import React, { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2 } from '@utils/icons';
import { Button, Input, ConfirmDialog, ColorPicker, Stack, ListActionRow } from '@components/ui';
import { useBackHandler } from '@hooks/useBackHandler';
import { MAX_EXERCISES_PER_CATEGORY } from '@store/useExercisesStore';
import { PRESET_COLORS } from './customDataConstants';
import { CategoryMigrationView } from './CategoryMigrationView';

export function CategoryManagerView({ customCategoriesHook, exercisesByUserCategory, defaultCustomExercises = [], computedStats }) {
  const { t, i18n } = useTranslation();
  const { customCategories, addCategory, updateCategory, deleteCategory, reorderCategories, maxCustomCategories } = customCategoriesHook;

  const [view, setView] = useState('list'); // list | create | delete

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [error, setError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Drag & Drop reorder state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const listContainerRef = useRef(null);
  const touchRef = useRef({ startIndex: null, currentIndex: null });

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    }
  };

  const handleDragOver = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex || targetIndex === 0 || draggedIndex === 0) return;

    const userCats = customCategories.filter(c => c.id !== 'custom');
    const fromIndex = draggedIndex - 1;
    const toIndex = targetIndex - 1;

    if (fromIndex < 0 || toIndex < 0) return;

    const newArr = [...userCats];
    const [moved] = newArr.splice(fromIndex, 1);
    newArr.splice(toIndex, 0, moved);

    const customCat = customCategories.find(c => c.id === 'custom');
    const updatedAll = customCat ? [customCat, ...newArr] : newArr;

    setDraggedIndex(targetIndex);
    if (typeof reorderCategories === 'function') {
      reorderCategories(updatedAll);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleTouchStart = (index) => {
    if (index === 0) return;
    touchRef.current = { startIndex: index, currentIndex: index };
    setDraggedIndex(index);
  };

  const handleTouchMove = (e) => {
    if (touchRef.current.startIndex === null) return;
    const touch = e.touches[0];
    if (!touch) return;

    const container = listContainerRef.current;
    if (!container) return;

    const children = Array.from(container.children).filter(child => child.dataset.catId);
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        const targetIndex = i;
        if (targetIndex !== touchRef.current.currentIndex && targetIndex !== 0) {
          handleDragOver(e, targetIndex);
          touchRef.current.currentIndex = targetIndex;
        }
        break;
      }
    }
  };

  const handleTouchEnd = () => {
    touchRef.current = { startIndex: null, currentIndex: null };
    setDraggedIndex(null);
  };

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
    if (showConfirmDelete) {
      setShowConfirmDelete(false);
      return true;
    }
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
    return false;
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

  const initiateCategoryDelete = (cat) => {
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
    setShowConfirmDelete(false);
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

  const deletingExercises = useMemo(() => {
    return deletingCat ? (exercisesByUserCategory?.[deletingCat.id] || []) : [];
  }, [deletingCat, exercisesByUserCategory]);
  const selectedCount = Object.values(selectedExercises).filter(Boolean).length;

  const repsToLose = useMemo(() => {
    if (!deletingCat || !computedStats) return 0;
    return deletingExercises.reduce((total, ex) => {
      if (!selectedExercises[ex.id]) {
        return total + (computedStats?.exerciseReps?.[ex.id] || 0);
      }
      return total;
    }, 0);
  }, [deletingExercises, selectedExercises, computedStats, deletingCat]);

  return (
    <>
      <div className="tab-view-content">
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* ═══════ LIST VIEW ═══════ */}
          {view === 'list' && (
            <Stack style={{ width: '100%', maxWidth: '440px' }}>
              <Stack
                ref={listContainerRef}
                gap="xs"
                style={{ width: '100%' }}
              >
                {[
                  { id: 'custom', name: t('common.custom'), color: '#34d399', ...customCategories.find(c => c.id === 'custom') },
                  ...customCategories.filter(c => c.id !== 'custom')
                ].map((cat, index) => {
                  const isBuiltIn = cat.id === 'custom';
                  const exerciseCount = isBuiltIn ? defaultCustomExercises.length : (exercisesByUserCategory?.[cat.id]?.length || 0);
                  const isDragging = draggedIndex === index;

                  return (
                    <ListActionRow
                      key={cat.id}
                      isDraggable={!isBuiltIn}
                      dragProps={{
                        onDragStart: (e) => handleDragStart(e, index),
                        onDragOver: (e) => handleDragOver(e, index),
                        onDragEnd: handleDragEnd
                      }}
                      dragHandleProps={{
                        onTouchStart: () => handleTouchStart(index),
                        onTouchMove: handleTouchMove,
                        onTouchEnd: handleTouchEnd
                      }}
                      renderActions={() => !isBuiltIn && (
                        <>
                          <Button iconOnly icon={Edit2} onClick={(e) => { e.stopPropagation(); setEditingId(cat.id); setName(cat.name); setColor(cat.color || '#8b5cf6'); setError(''); setView('create'); }} variant="ghost" size="sm" aria-label={t('common.edit')} />
                          <Button iconOnly icon={Trash2} onClick={(e) => { e.stopPropagation(); initiateCategoryDelete(cat); }} variant="danger-ghost" size="sm" aria-label={t('common.delete')} />
                        </>
                      )}
                      style={{
                        padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)',
                        background: isDragging ? 'rgba(139, 92, 246, 0.15)' : 'var(--surface-muted)',
                        border: `1px solid ${cat.color}${isDragging ? '80' : '30'}`,
                        opacity: isDragging ? 0.6 : 1,
                        transition: 'transform 0.15s ease, background-color 0.15s ease, opacity 0.15s ease'
                      }}
                    >
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: `${cat.color}20`, flexShrink: 0
                        }}>
                          <div style={{
                            width: '14px', height: '14px', borderRadius: '50%',
                            background: cat.color,
                            boxShadow: `0 0 8px ${cat.color}66`
                          }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{cat.name || (isBuiltIn ? t('common.custom') : '')}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {t('common.exerciseCount', { count: exerciseCount })}
                          </div>
                        </div>
                    </ListActionRow>
                  );
                })}
              </Stack>

              {customCategories.filter(c => c.id !== 'custom').length < maxCustomCategories && (
                <Button
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
            </Stack>
          )}

          {/* ═══════ CREATE / EDIT VIEW ═══════ */}
          {view === 'create' && (
            <Stack gap="md" className="fade-in" style={{ width: '100%', maxWidth: '440px' }}>
              {/* NAME */}
              <div>
                <Input
                  label={t('customCategories.nameLabel')}
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
                <ColorPicker 
                  colors={PRESET_COLORS}
                  selectedColor={color}
                  onChange={setColor}
                />
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
                  fullWidth
                  onClick={() => {
                    setEditingId(null);
                    setView('list');
                  }}
                >
                  {t('common.cancel')}
                </Button>

                <Button
                  fullWidth
                  onClick={handleSave}
                >
                  {t('common.save')}
                </Button>
              </div>
            </Stack>
          )}

          {/* ═══════ DELETE VIEW — Exercise Migration ═══════ */}
          {view === 'delete' && (
            <CategoryMigrationView
              deletingCat={deletingCat}
              deletingExercises={deletingExercises}
              selectedExercises={selectedExercises}
              exerciseTargets={exerciseTargets}
              targetCategories={targetCategories}
              availableSlots={availableSlots}
              selectedCount={selectedCount}
              onToggleExercise={toggleExercise}
              onSetExerciseTarget={setExerciseTarget}
              onCancel={() => { setView('list'); setDeletingCat(null); }}
              onRequestDelete={() => setShowConfirmDelete(true)}
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showConfirmDelete}
        title={t('customCategories.deleteTitle')}
        message={t('customCategories.deleteConfirm', { name: deletingCat?.name })}
        warning={repsToLose > 0 ? t('customExercises.deleteWarning', { count: repsToLose.toLocaleString(i18n.language), unit: t('customExercises.repetitions') }) : undefined}
        loading={false}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowConfirmDelete(false);
        }}
      />
    </>
  );
}
