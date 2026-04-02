import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Clock, Zap, Dumbbell, Check } from 'lucide-react';
import ICON_MAP from '../../../utils/iconMap';
import { Z_INDEX } from '../../../utils/zIndex';

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0min';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? String(m).padStart(2, '0') : ''}`;
  return `${m}min`;
}

function formatDateTime(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function SessionDetailModal({ session, onClose }) {
  const { t } = useTranslation();
  if (!session) return null;

  const exercises = session.exercises || [];
  const totalReps = exercises.reduce((sum, ex) => sum + (ex.reps || 0), 0);

  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0,
      background: 'rgba(5,5,5,0.97)',
      zIndex: Z_INDEX.TOAST + 1,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      overflowY: 'auto',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <div style={{
        width: '100%', maxWidth: '400px',
        padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <h2 style={{
          margin: 0, fontSize: '1.3rem', fontWeight: 800,
          background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {t('share.sessionDetail', 'D\u00e9tail de la s\u00e9ance')}
        </h2>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none',
          borderRadius: '50%', width: '36px', height: '36px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', cursor: 'pointer',
        }}>
          <X size={20} />
        </button>
      </div>

      <div style={{
        width: '100%', maxWidth: '400px',
        padding: '0 20px 24px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        {/* Date & name */}
        <div style={{
          padding: '16px', borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(129,140,248,0.1), rgba(139,92,246,0.06))',
          border: '1px solid rgba(129,140,248,0.15)',
        }}>
          <div style={{
            fontSize: '0.65rem', color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px',
          }}>
            {formatDateTime(session.date)}
          </div>
          <div style={{
            fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)',
          }}>
            {session.name || t('share.session', 'S\u00e9ance')}
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex', gap: '8px',
        }}>
          <div style={{
            flex: 1, padding: '14px', borderRadius: '14px',
            background: 'rgba(129,140,248,0.08)',
            border: '1px solid rgba(129,140,248,0.12)',
            textAlign: 'center',
          }}>
            <Clock size={18} color="#818cf8" style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#818cf8' }}>
              {formatDuration(session.duration)}
            </div>
            <div style={{
              fontSize: '0.55rem', color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {t('share.duration', 'Dur\u00e9e')}
            </div>
          </div>
          <div style={{
            flex: 1, padding: '14px', borderRadius: '14px',
            background: 'rgba(251,191,36,0.08)',
            border: '1px solid rgba(251,191,36,0.12)',
            textAlign: 'center',
          }}>
            <Zap size={18} color="#fbbf24" style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24' }}>
              {totalReps}
            </div>
            <div style={{
              fontSize: '0.55rem', color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {t('share.volume', 'Volume')}
            </div>
          </div>
          <div style={{
            flex: 1, padding: '14px', borderRadius: '14px',
            background: 'rgba(52,211,153,0.08)',
            border: '1px solid rgba(52,211,153,0.12)',
            textAlign: 'center',
          }}>
            <Dumbbell size={18} color="#34d399" style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>
              {exercises.length}
            </div>
            <div style={{
              fontSize: '0.55rem', color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {t('share.exercises', 'Exercices')}
            </div>
          </div>
        </div>

        {/* Exercise list */}
        {exercises.length > 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '6px',
          }}>
            <div style={{
              fontSize: '0.65rem', fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase', letterSpacing: '1px',
              padding: '0 4px',
            }}>
              {t('share.exercisesCompleted', 'Exercices compl\u00e9t\u00e9s')}
            </div>
            {exercises.map((ex, i) => {
              const Icon = ICON_MAP[ex.icon] || Dumbbell;
              return (
                <div key={ex.id || i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 14px', borderRadius: '12px',
                  background: `${ex.color || '#818cf8'}0a`,
                  border: `1px solid ${ex.color || '#818cf8'}15`,
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '10px',
                    background: `${ex.color || '#818cf8'}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={16} color={ex.color || '#818cf8'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.85rem', fontWeight: 700,
                      color: ex.color || '#818cf8',
                    }}>
                      {ex.label || ex.id}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    <Check size={14} color="#10b981" />
                    <span style={{
                      fontSize: '0.8rem', fontWeight: 700, color: '#10b981',
                    }}>
                      {ex.type === 'timer' ? `${ex.reps}s` : `${ex.reps} ${t('common.reps', 'reps')}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
