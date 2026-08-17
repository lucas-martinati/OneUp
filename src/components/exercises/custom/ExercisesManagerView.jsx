import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, Check, Settings2, Star, Dumbbell, Activity, CUSTOM_EXERCISE_ICONS } from '@utils/icons';
import { Button, Input, ConfirmDialog, ColorPicker, Slider, Stack, ListActionRow } from '@components/ui';
import { useBackHandler } from '@hooks/useBackHandler';
import { MAX_EXERCISES_PER_CATEGORY } from '@store/useExercisesStore';
import { PRESET_COLORS } from './customDataConstants';

export function ExercisesManagerView({ customExercisesHook, customCategoriesHook, computedStats, categoryId, initialView = 'list' }) {
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
    return false;
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
    <div className="tab-view-content">
      <div style={{ flex: 1, overflow: confirmDeleteEx ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {view === 'list' && (
          <Stack style={{ width: '100%', maxWidth: '440px' }}>
            <Stack gap="xs" style={{ width: '100%' }}>
              {customExercises.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px' }}>
                  <Settings2 size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                  <p>{t('customExercises.empty')}</p>
                </div>
              ) : (
                customExercises.map(ex => {
                  const IconComponent = CUSTOM_EXERCISE_ICONS[ex.icon] || Star;
                  return (
                    <ListActionRow
                      key={ex.id}
                      renderActions={() => (
                        <>
                          <Button iconOnly icon={Edit2} onClick={(e) => { e.stopPropagation(); handleEdit(ex); }} variant="ghost" size="sm" aria-label={t('common.edit')} />
                          <Button iconOnly icon={Trash2} onClick={(e) => { e.stopPropagation(); handleDelete(ex); }} variant="danger-ghost" size="sm" aria-label={t('common.delete')} />
                        </>
                      )}
                      style={{
                        padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)',
                        background: 'var(--surface-muted)', border: '1px solid var(--border-default)'
                      }}
                    >
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
                    </ListActionRow>
                  );
                })
              )}
            </Stack>

            {customExercises.length < maxCustomExercises && (
              <Button
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
          </Stack>
        )}

        {view === 'create' && (
          <Stack gap="md" className="fade-in" style={{ width: '100%', maxWidth: '440px' }}>
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
                    <Button
                      variant="ghost"
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
                    </Button>
                  );
                })}
              </div>
            </div>
            {/* NAME */}
            <div>
              <Input
                ref={nameInputRef}
                label={t('customExercises.nameLabel')}
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
                    <button type="button" key={name} onClick={() => setIconName(name)} className={isSelected ? 'hover-lift' : ''} style={{
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
                <Button
                  variant="ghost"
                  onClick={() => setType('counter')}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
                    background: type === 'counter' ? `${color}20` : 'transparent',
                    border: 'none', color: type === 'counter' ? color : 'var(--text-secondary)',
                    fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <Dumbbell size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} /> {t('customExercises.typeReps')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setType('timer')}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
                    background: type === 'timer' ? `${color}20` : 'transparent',
                    border: 'none', color: type === 'timer' ? color : 'var(--text-secondary)',
                    fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <Activity size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} /> {t('customExercises.typeTime')}
                </Button>
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
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        destructive
        open={!!confirmDeleteEx}
        confirmLabel={t('common.delete')}
        title={t('customExercises.deleteTitle')}
        message={t('customExercises.deleteConfirm', { name: confirmDeleteEx?.label })}
        warning={confirmDeleteEx && computedStats?.exerciseReps?.[confirmDeleteEx.id] > 0 ? t('customExercises.deleteWarning', { count: computedStats.exerciseReps[confirmDeleteEx.id].toLocaleString(i18n.language), unit: confirmDeleteEx.type === 'timer' ? t('customExercises.seconds') : t('customExercises.repetitions') }) : undefined}
        onConfirm={() => {
          deleteCustomExercise(confirmDeleteEx.id);
          setConfirmDeleteEx(null);
        }}
        onCancel={() => setConfirmDeleteEx(null)}
      />
    </div>
  );
}
