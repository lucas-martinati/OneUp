import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Plus, Settings2, Trash2, 
  Dumbbell, Activity, Flame, Heart, Zap, Star, Target, Trophy, Swords
} from 'lucide-react';
import { Z_INDEX } from '../../utils/zIndex';

const ICONS = {
  Dumbbell, Activity, Flame, Heart, Zap, Star, Target, Trophy, Swords
};

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f43f5e', '#6366f1', '#14b8a6', '#64748b'
];

export function CustomExercisesModal({ onClose, customExercisesHook, computedStats }) {
  const { t, i18n } = useTranslation();
  const { customExercises, saveCustomExercise, deleteCustomExercise, maxCustomExercises } = customExercisesHook;
  
  const [confirmDeleteEx, setConfirmDeleteEx] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'create'
  const [label, setLabel] = useState('');
  const [iconName, setIconName] = useState('Star');
  const [color, setColor] = useState('#8b5cf6');
  const [type, setType] = useState('counter');
  const [multiplier, setMultiplier] = useState(1);
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!label.trim()) {
      setError(t('customExercises.errorNameRequired'));
      return;
    }
    
    // Auto-generate gradient based on selected color (simplified)
    const gradient = [color, color]; // We could use a slightly darker shade for the first one
    
    const success = saveCustomExercise({
      label: label.trim(),
      icon: iconName,
      color,
      type,
      gradient,
      multiplier
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
  };

  const handleDelete = (ex) => {
    setConfirmDeleteEx(ex);
  };

  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.92)',
      zIndex: Z_INDEX.TOAST, display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      <div style={{ padding: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
          {t('customExercises.title')}
        </h2>
        <button onClick={onClose} className="glass hover-lift" style={{
          width: '40px', height: '40px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-secondary)'
        }}><X size={20} /></button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 var(--spacing-md) var(--spacing-md)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {view === 'list' && (
          <div style={{ width: '100%', maxWidth: '400px' }}>
            {customExercises.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px' }}>
                <Settings2 size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                <p>{t('customExercises.empty')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {customExercises.map(ex => {
                  const IconComponent = ICONS[ex.icon] || Star;
                  return (
                    <div key={ex.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px', borderRadius: 'var(--radius-lg)',
                      background: 'var(--surface-muted)', border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                      <button onClick={() => handleDelete(ex)} style={{
                        background: 'transparent', border: 'none', color: '#ef4444',
                        padding: '8px', cursor: 'pointer', opacity: 0.8
                      }}>
                        <Trash2 size={20} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {customExercises.length < maxCustomExercises && (
              <button onClick={() => {
                setLabel('');
                const iconKeys = Object.keys(ICONS);
                setIconName(iconKeys[Math.floor(Math.random() * iconKeys.length)]);
                setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
                setType('counter');
                setMultiplier(1.0);
                setError('');
                setView('create');
              }} className="hover-lift" style={{
                width: '100%', padding: '16px', borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', border: 'none', color: 'white',
                fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
                <Plus size={20} /> {t('customExercises.create')}
              </button>
            )}
            {customExercises.length >= maxCustomExercises && (
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {t('customExercises.limitReached', { count: maxCustomExercises })}
              </p>
            )}
          </div>
        )}

        {view === 'create' && (
          <div className="fade-in" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* NAME */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {t('customExercises.nameLabel')}
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: color }}>
                  {(() => { const SelectedIcon = ICONS[iconName] || Star; return <SelectedIcon size={20} />; })()}
                </div>
                <input
                  type="text"
                  maxLength={20}
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder={t('customExercises.namePlaceholder')}
                  style={{
                    width: '100%', padding: '16px 16px 16px 44px', borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${label ? color + '50' : 'var(--border-subtle)'}`,
                    background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '1.05rem', fontWeight: '600',
                    outline: 'none', boxSizing: 'border-box', transition: 'all 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = color}
                  onBlur={(e) => e.target.style.borderColor = label ? color + '50' : 'var(--border-subtle)'}
                />
              </div>
            </div>

            {/* COLOR */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {t('customExercises.colorLabel')}
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

            {/* ICON */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {t('customExercises.iconLabel')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {Object.keys(ICONS).map(name => {
                  const IconComp = ICONS[name];
                  const isSelected = iconName === name;
                  return (
                    <button key={name} onClick={() => setIconName(name)} className={isSelected ? 'hover-lift' : ''} style={{
                      aspectRatio: '1', borderRadius: 'var(--radius-md)',
                      background: isSelected ? `${color}20` : 'rgba(255,255,255,0.03)',
                      border: isSelected ? `2px solid ${color}` : '1px solid transparent',
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
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {t('customExercises.typeLabel')}
              </label>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', padding: '4px' }}>
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
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {t('customExercises.multiplierLabel')}
                </label>
                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: color }}>
                  x{multiplier.toFixed(1)}
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px', marginTop: 0, lineHeight: 1.4 }}>
                {t('customExercises.multiplierHint', { value: multiplier.toFixed(1), unit: type === 'timer' ? `(${t('customExercises.seconds')})` : `(${t('customExercises.repetitions')})` })}
              </p>
              <input
                type="range"
                min="0.1" max="5" step="0.1"
                value={multiplier}
                onChange={e => setMultiplier(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: color }}
              />
            </div>

            {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button onClick={() => setView('list')} style={{
                flex: 1, padding: '14px', borderRadius: 'var(--radius-md)',
                background: 'var(--surface-muted)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '600'
              }}>{t('customExercises.cancel')}</button>
              
              <button onClick={handleCreate} style={{
                flex: 1, padding: '14px', borderRadius: 'var(--radius-md)',
                background: '#8b5cf6', border: 'none',
                color: 'white', fontSize: '1rem', fontWeight: '700'
              }}>{t('customExercises.save')}</button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteEx && (
        <div className="fade-in" style={{
          position: 'absolute', inset: 0, background: 'rgba(5,5,5,0.92)',
          zIndex: 1010, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-md)'
        }}>
          <div style={{
            background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)', padding: '24px', width: '100%', maxWidth: '340px',
            textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)',
              color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto'
            }}>
              <Trash2 size={32} />
            </div>
            
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '800' }}>
              {t('customExercises.deleteTitle')}
            </h3>
            
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {t('customExercises.deleteConfirm', { name: confirmDeleteEx.label })}
              {computedStats?.exerciseReps?.[confirmDeleteEx.id] > 0 && (
                <span style={{ display: 'block', marginTop: '12px', color: '#fbbf24', fontSize: '0.85rem', fontWeight: '700', padding: '8px', background: 'rgba(251,191,36,0.1)', borderRadius: '8px' }}>
                  {t('customExercises.deleteWarning', { count: computedStats.exerciseReps[confirmDeleteEx.id].toLocaleString(i18n.language), unit: confirmDeleteEx.type === 'timer' ? t('customExercises.seconds') : t('customExercises.repetitions') })}
                </span>
              )}
            </p>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                onClick={() => setConfirmDeleteEx(null)}
                className="hover-lift"
                style={{
                  flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-muted)', border: '1px solid var(--border-subtle)',
                  color: 'white', fontWeight: '700'
                }}
              >
                {t('customExercises.cancel')}
              </button>
              <button 
                onClick={() => {
                  deleteCustomExercise(confirmDeleteEx.id);
                  setConfirmDeleteEx(null);
                }}
                className="hover-lift"
                style={{
                  flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
                  background: '#ef4444', border: 'none', color: 'white', fontWeight: '700'
                }}
              >
                {t('customExercises.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
