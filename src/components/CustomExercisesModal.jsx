import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Plus, Settings2, Trash2, 
  Dumbbell, Activity, Flame, Heart, Zap, Star, Target, Trophy, Swords
} from 'lucide-react';

const ICONS = {
  Dumbbell, Activity, Flame, Heart, Zap, Star, Target, Trophy, Swords
};

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

export function CustomExercisesModal({ onClose, customExercisesHook }) {
  const { t } = useTranslation();
  const { customExercises, saveCustomExercise, deleteCustomExercise, maxCustomExercises } = customExercisesHook;
  
  const [view, setView] = useState('list'); // 'list' | 'create'
  const [label, setLabel] = useState('');
  const [iconName, setIconName] = useState('Star');
  const [color, setColor] = useState('#8b5cf6');
  const [type, setType] = useState('counter');
  const [multiplier, setMultiplier] = useState(1);
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!label.trim()) {
      setError(t('common.required', { field: 'Nom' }) || 'Le nom est requis');
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
      setError("Limite d'exercices atteinte ou erreur.");
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Supprimer cet exercice personnalisé ? Vos statistiques passées seront conservées en mémoire.")) {
      deleteCustomExercise(id);
    }
  };

  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.92)',
      zIndex: 1000, display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      <div style={{ padding: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
          Exercices Personnalisés
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
                <p>Vous n'avez pas encore créé d'exercices personnalisés.</p>
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
                            {ex.type === 'timer' ? 'Chronomètre' : 'Compteur'} • Multiplicateur: x{ex.multiplier}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(ex.id)} style={{
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
              <button onClick={() => setView('create')} className="hover-lift" style={{
                width: '100%', padding: '16px', borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', border: 'none', color: 'white',
                fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
                <Plus size={20} /> Créer un exercice
              </button>
            )}
            {customExercises.length >= maxCustomExercises && (
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Limite de {maxCustomExercises} exercices atteinte.
              </p>
            )}
          </div>
        )}

        {view === 'create' && (
          <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Nom de l'exercice</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="Ex: Gainage chaise, Corde à sauter..."
                style={{
                  width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)', background: 'var(--surface-muted)',
                  color: 'white', fontSize: '1rem', outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Icône</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.keys(ICONS).map(name => {
                  const IconComp = ICONS[name];
                  const isSelected = iconName === name;
                  return (
                    <button key={name} onClick={() => setIconName(name)} style={{
                      width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(139,92,246,0.2)' : 'var(--surface-muted)',
                      border: isSelected ? '2px solid #8b5cf6' : '1px solid var(--border-subtle)',
                      color: isSelected ? '#8b5cf6' : 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                      <IconComp size={24} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Type de suivi</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setType('counter')}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
                    background: type === 'counter' ? 'rgba(139,92,246,0.2)' : 'var(--surface-muted)',
                    border: type === 'counter' ? '2px solid #8b5cf6' : '1px solid var(--border-subtle)',
                    color: type === 'counter' ? '#8b5cf6' : 'var(--text-secondary)',
                    fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  Compteur (Reps)
                </button>
                <button
                  onClick={() => setType('timer')}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 'var(--radius-md)',
                    background: type === 'timer' ? 'rgba(139,92,246,0.2)' : 'var(--surface-muted)',
                    border: type === 'timer' ? '2px solid #8b5cf6' : '1px solid var(--border-subtle)',
                    color: type === 'timer' ? '#8b5cf6' : 'var(--text-secondary)',
                    fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  Chronomètre (Secondes)
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Couleur</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: c, border: color === c ? '3px solid white' : 'none',
                    boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }} />
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Multiplicateur d'objectif
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', marginTop: 0 }}>
                Définit la difficulté. L'objectif {type === 'timer' ? 'en secondes' : 'de répétitions'} = Jour x Multiplicateur.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <input
                  type="range"
                  min="0.1" max="5" step="0.1"
                  value={multiplier}
                  onChange={e => setMultiplier(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: '#8b5cf6' }}
                />
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#8b5cf6', width: '40px', textAlign: 'right' }}>
                  x{multiplier.toFixed(1)}
                </div>
              </div>
            </div>

            {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button onClick={() => setView('list')} style={{
                flex: 1, padding: '14px', borderRadius: 'var(--radius-md)',
                background: 'var(--surface-muted)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '600'
              }}>Annuler</button>
              
              <button onClick={handleCreate} style={{
                flex: 1, padding: '14px', borderRadius: 'var(--radius-md)',
                background: '#8b5cf6', border: 'none',
                color: 'white', fontSize: '1rem', fontWeight: '700'
              }}>Sauvegarder</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
