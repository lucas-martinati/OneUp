import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Settings2, Trash2, Edit2, Star, Dumbbell, Activity, CUSTOM_EXERCISE_ICONS, Check } from '@utils/icons';
import { Button, IconButton, Slider, Input, ModalHeader } from '@components/ui';
import { useBackHandler } from '@hooks/useBackHandler';
import { Z_INDEX } from '@utils/zIndex';
import { MAX_EXERCISES_PER_CATEGORY } from '@store/useExercisesStore';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f43f5e', '#6366f1', '#14b8a6', '#64748b'
];

export function CustomExercisesModal({ onClose, customExercisesHook, customCategoriesHook, computedStats, categoryId }) {
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
  const [view, setView] = useState('list'); // 'list' | 'create'
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
    <div className="fade-in modal-overlay" style={{ zIndex: Z_INDEX.TOAST }}>
      <div className="modal-content">
        <ModalHeader title={t('customExercises.title')} onClose={onClose} />

      <div style={{ flex: 1, overflow: confirmDeleteEx ? 'hidden' : 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {view === 'list' && (
          <div style={{ width: '100%', maxWidth: '440px' }}>
            {customExercises.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px' }}>
                <Settings2 size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                <p>{t('customExercises.empty')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {customExercises.map(ex => {
                  const IconComponent = CUSTOM_EXERCISE_ICONS[ex.icon] || Star;
                  return (
                    <div key={ex.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                      background: 'var(--surface-muted)', border: '1px solid var(--border-default)'
                    }}>
                      <div className="row gap-12" style={{ alignItems: 'center' }}>
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
                        <IconButton icon={Edit2} onClick={() => handleEdit(ex)} variant="ghost" size="sm" aria-label="Modifier" />
                        <IconButton icon={Trash2} onClick={() => handleDelete(ex)} variant="danger-ghost" size="sm" aria-label="Supprimer" />
                      </div>
                    </div>
                  );
                })}
              </div>
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
                  
                  const borderStyle = isSelected ? cat.color : 'var(--border-subtle)';
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
                      border: isSelected ? `2px solid ${color}` : '1px solid var(--border-subtle)',
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
              <div style={{ background: 'var(--surface-muted)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
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
      {confirmDeleteEx && (
        <div className="fade-in" style={{
          position: 'fixed', inset: 0, background: 'var(--overlay-bg-heavy)',
          zIndex: Z_INDEX.DELETE_MODAL, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-md)',
          overflow: 'hidden', touchAction: 'none', overscrollBehavior: 'none'
        }}
          onTouchMove={(e) => e.preventDefault()}
        >
          <div style={{
            background: 'var(--sheet-bg)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)', padding: '24px', width: '100%', maxWidth: '340px',
            textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', background: 'color-mix(in srgb, var(--error) 15%, transparent)',
              color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto'
            }}>
              <Trash2 size={32} />
            </div>
            
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '800' }}>
              {t('customExercises.deleteTitle')}
            </h3>
            
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {t('customExercises.deleteConfirm', { name: confirmDeleteEx.label })}
              {computedStats?.exerciseReps?.[confirmDeleteEx.id] > 0 && (
                <span style={{ display: 'block', marginTop: '12px', color: 'var(--warning)', fontSize: '0.85rem', fontWeight: '700', padding: '8px', background: 'color-mix(in srgb, var(--warning) 15%, transparent)', borderRadius: '8px' }}>
                  {t('customExercises.deleteWarning', { count: computedStats.exerciseReps[confirmDeleteEx.id].toLocaleString(i18n.language), unit: confirmDeleteEx.type === 'timer' ? t('customExercises.seconds') : t('customExercises.repetitions') })}
                </span>
              )}
            </p>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <Button 
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setConfirmDeleteEx(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                variant="danger"
                size="md"
                fullWidth
                onClick={() => {
                  deleteCustomExercise(confirmDeleteEx.id);
                  setConfirmDeleteEx(null);
                }}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

