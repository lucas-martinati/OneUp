import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Check, ChevronRight } from '@utils/icons';
import { DynamicIcon } from '@utils/icons';
import { Button, Stack } from '@components/ui';

export function CategoryMigrationView({
  deletingCat,
  deletingExercises,
  selectedExercises,
  exerciseTargets,
  targetCategories,
  availableSlots,
  selectedCount,
  onToggleExercise,
  onSetExerciseTarget,
  onCancel,
  onRequestDelete
}) {
  const { t } = useTranslation();

  if (!deletingCat) return null;

  return (
    <Stack className="fade-in" style={{ width: '100%', maxWidth: '440px' }}>
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
                onClick={() => onToggleExercise(ex.id)}
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
                      <Button
                        variant="ghost"
                        key={tc.id}
                        onClick={() => { if (!isDisabled) onSetExerciseTarget(ex.id, tc.id); }}
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
                      </Button>
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
          fullWidth
          onClick={onCancel}
        >
          {t('common.cancel')}
        </Button>
        <Button
          variant="danger"
          fullWidth
          onClick={onRequestDelete}
        >
          {t('common.delete')}
        </Button>
      </div>
    </Stack>
  );
}
