import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, Check, ChevronRight, ChevronUp, ChevronDown, GripVertical, Settings2, Star, Dumbbell, Activity, CUSTOM_EXERCISE_ICONS } from '@utils/icons';
import { Button, Input, ModalHeader, DeleteConfirmOverlay, ColorPicker, Slider } from '@components/ui';
import { useBackHandler } from '@hooks/useBackHandler';
import { Z_INDEX } from '@utils/zIndex';
import { DynamicIcon } from '@utils/icons';
import { MAX_EXERCISES_PER_CATEGORY } from '@store/useExercisesStore';

export function CustomDataManagerModal({ 
  onClose, 
  initialTab = 'categories', 
  initialView = 'list', 
  customCategoriesHook, 
  customExercisesHook,
  exercisesByUserCategory,
  defaultCustomExercises,
  computedStats,
  categoryId
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="fade-in modal-overlay" style={{ zIndex: Z_INDEX.TOAST }}>
      <div className="modal-content" style={{ display: 'flex', flexDirection: 'column' }}>
        <ModalHeader title={t('settings.customContent', 'Gestionnaire personnalisé')} onClose={onClose} />
        
        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 var(--space-4)', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
          <button 
            onClick={() => setActiveTab('categories')}
            style={{ 
              flex: 1, 
              padding: '12px', 
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'categories' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'categories' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'categories' ? '700' : '500',
              cursor: 'pointer'
            }}
          >
            {t('common.categories')}
          </button>
          <button 
            onClick={() => setActiveTab('exercises')}
            style={{ 
              flex: 1, 
              padding: '12px', 
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'exercises' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'exercises' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'exercises' ? '700' : '500',
              cursor: 'pointer'
            }}
          >
            {t('common.exercises')}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'categories' ? (
          <CategoryManagerView 
            onClose={onClose}
            customCategoriesHook={customCategoriesHook}
            exercisesByUserCategory={exercisesByUserCategory}
            defaultCustomExercises={defaultCustomExercises}
            computedStats={computedStats}
          />
        ) : (
          <ExercisesManagerView 
            onClose={onClose}
            customExercisesHook={customExercisesHook}
            customCategoriesHook={customCategoriesHook}
            computedStats={computedStats}
            categoryId={categoryId}
            initialView={initialView}
          />
        )}
      </div>
    </div>
  );
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f43f5e', '#6366f1', '#14b8a6', '#64748b'
];

function CategoryManagerView({ onClose, customCategoriesHook, exercisesByUserCategory, defaultCustomExercises = [], computedStats }) {
  const { t, i18n } = useTranslation();
  const { customCategories, addCategory, updateCategory, deleteCategory, moveCategory, reorderCategories, maxCustomCategories } = customCategoriesHook;

  const [view, setView] = useState('list'); // 'list' | 'create' | 'delete'
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
      <div className="tab-view-content" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* ═══════ LIST VIEW ═══════ */}
          {view === 'list' && (
            <div
              ref={listContainerRef}
              style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
            >
              {[
                { id: 'custom', name: t('common.custom'), color: '#34d399', ...customCategories.find(c => c.id === 'custom') },
                ...customCategories.filter(c => c.id !== 'custom')
              ].map((cat, index) => {
                const isBuiltIn = cat.id === 'custom';
                const exerciseCount = isBuiltIn ? defaultCustomExercises.length : (exercisesByUserCategory?.[cat.id]?.length || 0);
                const isDragging = draggedIndex === index;

                return (
                  <div
                    key={cat.id}
                    data-cat-id={cat.id}
                    draggable={!isBuiltIn}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)',
                      background: isDragging ? 'rgba(139, 92, 246, 0.15)' : 'var(--surface-muted)',
                      border: `1px solid ${cat.color}${isDragging ? '80' : '30'}`,
                      opacity: isDragging ? 0.6 : 1,
                      cursor: !isBuiltIn ? 'grab' : 'default',
                      userSelect: 'none',
                      transition: 'transform 0.15s ease, background-color 0.15s ease, opacity 0.15s ease'
                    }}
                  >
                    <div className="flex-align-center gap-12" style={{ alignItems: 'center' }}>
                      {!isBuiltIn && (
                        <div
                          onTouchStart={() => handleTouchStart(index)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          title="Glisser pour réordonner"
                          aria-label="Glisser pour réordonner"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'rgba(255, 255, 255, 0.35)',
                            cursor: 'grab', touchAction: 'none', paddingRight: '2px'
                          }}
                        >
                          <GripVertical size={18} />
                        </div>
                      )}
                      <div style={{
                        width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                        background: `${cat.color}20`, border: `2px solid ${cat.color}50`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
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
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {!isBuiltIn && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 'var(--radius-md)',
                          padding: '2px',
                          marginRight: '4px'
                        }}>
                          {(() => {
                            const userCatsOnly = customCategories.filter(c => c.id !== 'custom');
                            const userIndex = userCatsOnly.findIndex(c => c.id === cat.id);
                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => moveCategory(cat.id, 'up')}
                                  disabled={userIndex === 0}
                                  aria-label="Monter"
                                  style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    background: 'transparent',
                                    color: userIndex === 0 ? 'var(--text-disabled)' : 'var(--text-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: userIndex === 0 ? 'default' : 'pointer',
                                    opacity: userIndex === 0 ? 0.35 : 1,
                                    transition: 'background-color 0.2s'
                                  }}
                                >
                                  <ChevronUp size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveCategory(cat.id, 'down')}
                                  disabled={userIndex === userCatsOnly.length - 1}
                                  aria-label="Descendre"
                                  style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: 'none',
                                    background: 'transparent',
                                    color: userIndex === userCatsOnly.length - 1 ? 'var(--text-disabled)' : 'var(--text-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: userIndex === userCatsOnly.length - 1 ? 'default' : 'pointer',
                                    opacity: userIndex === userCatsOnly.length - 1 ? 0.35 : 1,
                                    transition: 'background-color 0.2s'
                                  }}
                                >
                                  <ChevronDown size={15} />
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      )}
                      <Button iconOnly icon={Edit2} onClick={() => handleEdit(cat)} variant="ghost" size="sm" aria-label="Modifier" />
                      {!isBuiltIn && (
                        <Button iconOnly icon={Trash2} onClick={() => handleStartDelete(cat)} variant="danger-ghost" size="sm" aria-label="Supprimer" />
                      )}
                    </div>
                  </div>
                );
              })}

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
                      border: `1px solid ${isSelected ? (targetCat?.color || '#34d399') + '30' : 'var(--border-default)'}`,
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
                          width: '24px', height: '24px', borderRadius: 'var(--radius-sm)',
                          background: isSelected ? 'var(--success)' : 'transparent',
                          border: isSelected ? '2px solid var(--success)' : '2px solid var(--border-default)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.2s', flexShrink: 0
                        }}>
                          {isSelected && <Check size={14} color="white" />}
                        </div>

                        <div style={{
                          width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
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
                  onClick={() => setShowConfirmDelete(true)}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmOverlay
        open={showConfirmDelete}
        title={t('customCategories.deleteTitle')}
        message={t('customCategories.deleteConfirm', { name: deletingCat?.name })}
        warningMessage={repsToLose > 0 ? t('customExercises.deleteWarning', { count: repsToLose.toLocaleString(i18n.language), unit: t('customExercises.repetitions') }) : undefined}
        loading={false}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowConfirmDelete(false);
          setDeletingCat(null);
        }}
      />
    </>
  );
}

function ExercisesManagerView({ onClose, customExercisesHook, customCategoriesHook, computedStats, categoryId, initialView = 'list' }) {
  const { t, i18n } = useTranslation();
  const { 
    customExercises: allCustomExercises, 
    saveCustomExercise, 
    updateCustomExercise, 
    deleteCustomExercise, 
    maxCustomExercises 
  } = customExercisesHook;

  const { customCategories } = customCategoriesHook;

  const effectiveCatId = categoryId || 'custom';
  const customExercises = allCustomExercises.filter(ex => (ex.categoryId || 'custom') === effectiveCatId);
  
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteEx, setConfirmDeleteEx] = useState(null);
  const [view, setView] = useState(initialView); // 'list' | 'create'
  const [label, setLabel] = useState('');
  const [iconName, setIconName] = useState('Star');
  const [color, setColor] = useState('#8b5cf6');
  const [type, setType] = useState('counter');
  const [multiplier, setMultiplier] = useState(1);
  const [selectedCatId, setSelectedCatId] = useState(effectiveCatId);
  const [error, setError] = useState('');
  const nameInputRef = useRef(null);

  useBackHandler(() => {
    if (confirmDeleteEx) {
      setConfirmDeleteEx(null);
      return true;
    }
    if (view === 'create') {
      setView('list');
      setEditingId(null);
      setSelectedCatId(effectiveCatId);
      return true;
    }
    onClose();
    return true;
  }, true);

  const handleSave = () => {
    if (!label.trim()) {
      setError(t('customExercises.errorNameRequired'));
      return;
    }
    
    const gradient = [color, color];
    const targetCatCount = allCustomExercises.filter(ex => (ex.categoryId || 'custom') === selectedCatId).length;
    
    if (editingId) {
      const currentEx = allCustomExercises.find(ex => ex.id === editingId);
      const isChangingCat = (currentEx.categoryId || 'custom') !== selectedCatId;
      
      if (isChangingCat && targetCatCount >= MAX_EXERCISES_PER_CATEGORY) {
        setError(t('customExercises.errorLimit'));
        return;
      }

      updateCustomExercise(editingId, {
        label: label.trim(),
        icon: iconName,
        color,
        type,
        gradient,
        multiplier,
        categoryId: selectedCatId
      });
      setLabel('');
      setIconName('Star');
      setColor('#8b5cf6');
      setType('counter');
      setMultiplier(1);
      setError('');
      setEditingId(null);
      setView('list');
    } else {
      if (targetCatCount >= MAX_EXERCISES_PER_CATEGORY) {
        setError(t('customExercises.errorLimit'));
        return;
      }

      const success = saveCustomExercise({
        label: label.trim(),
        icon: iconName,
        color,
        type,
        gradient,
        multiplier,
        categoryId: selectedCatId
      });

      if (success) {
        setLabel('');
        setIconName('Star');
        setColor('#8b5cf6');
        setType('counter');
        setMultiplier(1);
        setError('');
        setView('list');
      } else {
        setError(t('customExercises.errorLimit'));
      }
    }
  };

  const handleEdit = (ex) => {
    setEditingId(ex.id);
    setLabel(ex.label);
    setIconName(ex.icon);
    setColor(ex.color);
    setType(ex.type);
    setMultiplier(ex.multiplier);
    setSelectedCatId(ex.categoryId || 'custom');
    setError('');
    setView('create');
  };

  const handleDelete = (ex) => {
    setConfirmDeleteEx(ex);
  };

  return (
    <div className="tab-view-content" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>

      <div style={{ flex: 1, overflow: confirmDeleteEx ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {view === 'list' && (
          <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {customExercises.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px' }}>
                <Settings2 size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                <p>{t('customExercises.empty')}</p>
              </div>
            ) : (
              customExercises.map(ex => {
                const IconComponent = CUSTOM_EXERCISE_ICONS[ex.icon] || Star;
                return (
                  <div key={ex.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                    background: 'var(--surface-muted)', border: '1px solid var(--border-default)'
                  }}>
                    <div className="flex-align-center gap-12" style={{ alignItems: 'center' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: `${ex.color}20`, color: ex.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{ex.label}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {ex.type === 'timer' ? t('customExercises.typeTimer') : t('customExercises.typeCounter')} • {t('customExercises.multiplierShort')}: x{ex.multiplier}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <Button iconOnly icon={Edit2} onClick={() => handleEdit(ex)} variant="ghost" size="sm" aria-label="Modifier" />
                      <Button iconOnly icon={Trash2} onClick={() => handleDelete(ex)} variant="danger-ghost" size="sm" aria-label="Supprimer" />
                    </div>
                  </div>
                );
              })
            )}

            {customExercises.length < maxCustomExercises && (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                icon={Plus}
                onClick={() => {
                  setEditingId(null);
                  setLabel('');
                  const iconKeys = Object.keys(CUSTOM_EXERCISE_ICONS);
                  setIconName(iconKeys[Math.floor(Math.random() * iconKeys.length)]);
                  setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
                  setType('counter');
                  setMultiplier(1.0);
                  setError('');
                  setView('create');
                }}
              >
                {t('customExercises.create')}
              </Button>
            )}
            {customExercises.length >= maxCustomExercises && (
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {t('customExercises.limitReached', { count: maxCustomExercises })}
              </p>
            )}
          </div>
        )}

        {view === 'create' && (
          <div className="fade-in" style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* CATEGORY SELECTOR */}
            <div>
              <label className="input-label" style={{ marginBottom: 'var(--space-2)' }}>
                {t('common.category')}
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { id: 'custom', name: customCategories.find(c => c.id === 'custom')?.name || t('common.custom'), color: customCategories.find(c => c.id === 'custom')?.color || '#34d399' },
                  ...customCategories.filter(c => c.id !== 'custom')
                ].map(cat => {
                  const isSelected = selectedCatId === cat.id;
                  const catExs = allCustomExercises.filter(ex => 
                    (ex.categoryId || 'custom') === cat.id && ex.id !== editingId
                  );
                  const isFull = catExs.length >= MAX_EXERCISES_PER_CATEGORY;
                  
                  const borderStyle = isSelected ? cat.color : 'var(--border-default)';
                  let colorStyle = 'var(--text-primary)';
                  if (isSelected) {
                    colorStyle = cat.color;
                  } else if (isFull) {
                    colorStyle = 'var(--text-disabled)';
                  }

                  return (
                    <button
                      key={cat.id}
                      disabled={isFull}
                      onClick={() => setSelectedCatId(cat.id)}
                      style={{
                        padding: '8px 12px', borderRadius: 'var(--radius-md)',
                        background: isSelected ? `${cat.color}20` : 'var(--surface-muted)',
                        border: `1px solid ${borderStyle}`,
                        color: colorStyle,
                        fontSize: '0.85rem', fontWeight: '700', cursor: isFull ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px', opacity: isFull ? 0.4 : 1,
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                      {cat.name}
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* NAME */}
            <div>
              <Input
                ref={nameInputRef}
                label={t('customExercises.nameLabel')}
                type="text"
                maxLength={20}
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder={t('customExercises.namePlaceholder')}
                icon={CUSTOM_EXERCISE_ICONS[iconName] || Star}
                error={error}
              />
            </div>

            {/* COLOR */}
            <div>
              <label className="input-label" style={{ marginBottom: 'var(--space-2)' }}>
                {t('customExercises.colorLabel')}
              </label>
              <ColorPicker 
                colors={PRESET_COLORS}
                selectedColor={color}
                onChange={setColor}
              />
            </div>

            {/* ICON */}
            <div>
              <label className="input-label" style={{ marginBottom: 'var(--space-2)' }}>
                {t('customExercises.iconLabel')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', maxHeight: '240px', overflowY: 'auto', padding: '4px', paddingRight: '8px' }}>
                {Object.keys(CUSTOM_EXERCISE_ICONS).map(name => {
                  const IconComp = CUSTOM_EXERCISE_ICONS[name];
                  const isSelected = iconName === name;
                  return (
                    <button key={name} onClick={() => setIconName(name)} className={isSelected ? 'hover-lift' : ''} style={{
                      aspectRatio: '1', borderRadius: 'var(--radius-md)',
                      background: isSelected ? `${color}20` : 'var(--surface-muted)',
                      border: isSelected ? `2px solid ${color}` : '1px solid var(--border-default)',
                      color: isSelected ? color : 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.2s', padding: 0
                    }}>
                      <IconComp size={24} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TYPE */}
            <div>
              <label className="input-label" style={{ marginBottom: 'var(--space-2)' }}>
                {t('customExercises.typeLabel')}
              </label>
              <div style={{ display: 'flex', background: 'var(--surface-muted)', borderRadius: 'var(--radius-lg)', padding: '4px' }}>
                <button
                  onClick={() => setType('counter')}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
                    background: type === 'counter' ? `${color}20` : 'transparent',
                    border: 'none', color: type === 'counter' ? color : 'var(--text-secondary)',
                    fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <Dumbbell size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} /> {t('customExercises.typeReps')}
                </button>
                <button
                  onClick={() => setType('timer')}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
                    background: type === 'timer' ? `${color}20` : 'transparent',
                    border: 'none', color: type === 'timer' ? color : 'var(--text-secondary)',
                    fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <Activity size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} /> {t('customExercises.typeTime')}
                </button>
              </div>
            </div>

            {/* MULTIPLIER */}
            {!editingId && (
              <div style={{ background: 'var(--surface-muted)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {t('customExercises.multiplierLabel')}
                  </label>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: color }}>
                    x{multiplier.toFixed(1)}
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '16px', marginTop: 0, lineHeight: 1.4 }}>
                  {t('customExercises.multiplierHint', { value: multiplier.toFixed(1), unit: type === 'timer' ? `(${t('customExercises.seconds')})` : `(${t('customExercises.repetitions')})` })}
                </p>
                <Slider
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={multiplier}
                  color={color}
                  onChange={setMultiplier}
                  onPointerUp={() => nameInputRef.current?.blur()}
                  style={{ width: '100%' }}
                />
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
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmOverlay
        open={!!confirmDeleteEx}
        title={t('customExercises.deleteTitle')}
        message={t('customExercises.deleteConfirm', { name: confirmDeleteEx?.label })}
        warningMessage={confirmDeleteEx && computedStats?.exerciseReps?.[confirmDeleteEx.id] > 0 ? t('customExercises.deleteWarning', { count: computedStats.exerciseReps[confirmDeleteEx.id].toLocaleString(i18n.language), unit: confirmDeleteEx.type === 'timer' ? t('customExercises.seconds') : t('customExercises.repetitions') }) : undefined}
        onConfirm={() => {
          deleteCustomExercise(confirmDeleteEx.id);
          setConfirmDeleteEx(null);
        }}
        onCancel={() => setConfirmDeleteEx(null)}
      />
      </div>
  );
}
