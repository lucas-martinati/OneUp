import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles, Plus, X, Check, Trash2, Play, Pause, ChevronRight,
  Lock, Calendar, Flame, BarChart3, Edit3, ArrowLeft
} from 'lucide-react';
import { EXERCISES, EXERCISES_MAP } from '../../config/exercises';
import { getLocalDateStr } from '../../utils/dateUtils';
import { registerBackHandler } from '../../utils/backHandler';
import { canAccessFeature, FEATURES } from '../../utils/entitlements';
import { Z_INDEX } from '../../utils/zIndex';

export function CustomProgramPanel({
  onClose, isPro, programs,
  saveProgram, updateProgram, deleteProgram,
  startProgram, pauseProgram, resumeProgram,
  toggleProgramExerciseCompletion,
  getProgramDayNumber, isProgramExerciseDone,
  getProgramStreak, getProgramStats, maxPrograms
}) {
  const { t } = useTranslation();
  const [view, setView] = useState('list');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [today] = useState(getLocalDateStr(new Date()));

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formExercises, setFormExercises] = useState([]);
  const [formGoals, setFormGoals] = useState({});
  const [formDuration, setFormDuration] = useState(30);
  const [formError, setFormError] = useState('');

  const resetForm = useCallback(() => {
    setFormName('');
    setFormDesc('');
    setFormExercises([]);
    setFormGoals({});
    setFormDuration(30);
    setFormError('');
  }, []);

  // Back handler
  useEffect(() => {
    const unreg = registerBackHandler(() => {
      if (view === 'create' || view === 'edit') {
        setView('list');
        resetForm();
        return true;
      }
      if (view === 'detail') {
        setView('list');
        setSelectedProgram(null);
        return true;
      }
      onClose();
      return true;
    });
    return unreg;
  }, [view, onClose, resetForm]);

  const toggleExercise = (exId) => {
    setFormExercises((prev) => {
      if (prev.includes(exId)) {
        const newExercises = prev.filter((id) => id !== exId);
        setFormGoals((g) => {
          const next = { ...g };
          delete next[exId];
          return next;
        });
        return newExercises;
      }
      setFormGoals((g) => ({ ...g, [exId]: 10 }));
      return [...prev, exId];
    });
  };

  const handleSave = () => {
    if (!formName.trim()) return setFormError(t('customProgram.nameRequired'));
    if (formExercises.length === 0) return setFormError(t('customProgram.exerciseRequired'));

    if (view === 'edit' && selectedProgram) {
      updateProgram(selectedProgram.id, {
        name: formName.trim(),
        description: formDesc.trim(),
        exerciseIds: formExercises,
        dailyGoals: formGoals,
        duration: formDuration,
      });
    } else {
      const success = saveProgram({
        name: formName,
        description: formDesc,
        exerciseIds: formExercises,
        dailyGoals: formGoals,
        duration: formDuration,
      });
      if (!success) return setFormError(t('customProgram.maxPrograms', { count: maxPrograms }));
    }

    setView('list');
    resetForm();
  };

  const handleEdit = (program) => {
    setFormName(program.name);
    setFormDesc(program.description || '');
    setFormExercises([...program.exerciseIds]);
    setFormGoals({ ...program.dailyGoals });
    setFormDuration(program.duration);
    setSelectedProgram(program);
    setView('edit');
  };

  const handleOpenDetail = (program) => {
    setSelectedProgram(program);
    setView('detail');
  };

  // ── Pro locked gate ──────────────────────────────────────────────────
  if (!canAccessFeature(FEATURES.CUSTOM_PROGRAMS, { isPro })) {
    return (
      <div className="fade-in" style={{
        position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.92)',
        zIndex: Z_INDEX.TOAST, display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        <div style={{ padding: 'var(--spacing-md)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="glass hover-lift" style={{
            width: '40px', height: '40px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-secondary)'
          }}><X size={20} /></button>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-lg)', gap: '20px' }}>
          <Lock size={64} color="#8b5cf6" style={{ marginBottom: '10px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', textAlign: 'center', margin: 0, color: '#8b5cf6' }}>
            {t('pro.locked')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px', lineHeight: '1.5' }}>
            {t('pro.lockedDesc')}
          </p>
        </div>
      </div>
    );
  }

  // ── Detail view ──────────────────────────────────────────────────────
  if (view === 'detail' && selectedProgram) {
    const dayNum = getProgramDayNumber(selectedProgram, today);
    const streak = getProgramStreak(selectedProgram.id);
    const stats = getProgramStats(selectedProgram.id);

    return (
      <div className="fade-in" style={{
        position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.92)',
        zIndex: Z_INDEX.TOAST, display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        <div style={{ padding: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => { setView('list'); setSelectedProgram(null); }} className="glass hover-lift" style={{
            width: '40px', height: '40px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-secondary)'
          }}><ArrowLeft size={20} /></button>
          <button onClick={() => handleEdit(selectedProgram)} className="glass hover-lift" style={{
            width: '40px', height: '40px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-secondary)'
          }}><Edit3 size={18} /></button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 var(--spacing-md) var(--spacing-md)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', textAlign: 'center', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
            {selectedProgram.name}
          </h2>
          {selectedProgram.description && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
              {selectedProgram.description}
            </p>
          )}

          {/* Status badge */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700',
              background: selectedProgram.status === 'active' ? 'rgba(16,185,129,0.15)' : selectedProgram.status === 'paused' ? 'rgba(245,158,11,0.15)' : 'rgba(139,92,246,0.15)',
              color: selectedProgram.status === 'active' ? '#10b981' : selectedProgram.status === 'paused' ? '#f59e0b' : '#8b5cf6',
              border: `1px solid ${selectedProgram.status === 'active' ? 'rgba(16,185,129,0.3)' : selectedProgram.status === 'paused' ? 'rgba(245,158,11,0.3)' : 'rgba(139,92,246,0.3)'}`
            }}>
              {t(`customProgram.${selectedProgram.status}`)}
            </span>
          </div>

          {/* Stats row */}
          {selectedProgram.status !== 'draft' && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {[
                { icon: Calendar, label: t('customProgram.day', { current: dayNum, total: selectedProgram.duration }), color: '#8b5cf6' },
                { icon: Flame, label: `${streak} ${t('customProgram.streak')}`, color: '#f97316' },
                { icon: BarChart3, label: `${stats.completionRate}%`, color: '#10b981' },
              ].map((s, i) => (
                <div key={i} style={{
                  flex: 1, padding: '10px 8px', borderRadius: 'var(--radius-md)',
                  background: `${s.color}12`, border: `1px solid ${s.color}25`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                }}>
                  <s.icon size={16} color={s.color} />
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', color: s.color, textAlign: 'center' }}>{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Today's exercises */}
          {selectedProgram.status === 'active' && (
            <>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {t('dashboard.session')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedProgram.exerciseIds.map((exId) => {
                  const ex = EXERCISES_MAP[exId];
                  if (!ex) return null;
                  const done = isProgramExerciseDone(selectedProgram.id, today, exId);
                  const goal = selectedProgram.dailyGoals?.[exId] || 10;
                  return (
                    <button
                      key={exId}
                      onClick={() => toggleProgramExerciseCompletion(selectedProgram.id, today, exId)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '14px', borderRadius: 'var(--radius-md)',
                        background: done ? `${ex.color}15` : 'var(--surface-muted)',
                        border: done ? `2px solid ${ex.color}50` : '2px solid var(--border-subtle)',
                        cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left', width: '100%'
                      }}
                    >
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        background: done ? ex.color : 'transparent',
                        border: done ? 'none' : `2px solid ${ex.color}50`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {done && <Check size={16} color="white" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: done ? ex.color : 'var(--text-primary)' }}>
                          {t(`exercises.${exId}`)}
                        </div>
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '0.9rem', color: ex.color }}>
                        {goal}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            {selectedProgram.status === 'draft' && (
              <button onClick={() => { startProgram(selectedProgram.id); setView('list'); }} className="hover-lift" style={{
                flex: 1, padding: '14px', borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white',
                fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
              }}>
                <Play size={18} /> {t('customProgram.start')}
              </button>
            )}
            {selectedProgram.status === 'active' && (
              <button onClick={() => { pauseProgram(selectedProgram.id); setView('list'); }} className="hover-lift" style={{
                flex: 1, padding: '14px', borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: 'white',
                fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
              }}>
                <Pause size={18} /> {t('customProgram.pause')}
              </button>
            )}
            {selectedProgram.status === 'paused' && (
              <button onClick={() => { resumeProgram(selectedProgram.id); setView('list'); }} className="hover-lift" style={{
                flex: 1, padding: '14px', borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white',
                fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
              }}>
                <Play size={18} /> {t('customProgram.resume')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Create / Edit form ───────────────────────────────────────────────
  if (view === 'create' || view === 'edit') {
    return (
      <div className="fade-in" style={{
        position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.92)',
        zIndex: Z_INDEX.TOAST, display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        <div style={{ padding: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => { setView('list'); resetForm(); }} className="glass hover-lift" style={{
            width: '40px', height: '40px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-secondary)'
          }}><ArrowLeft size={20} /></button>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {view === 'edit' ? t('customProgram.editProgram') : t('customProgram.newProgram')}
          </h3>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 var(--spacing-md) var(--spacing-md)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name */}
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={t('customProgram.namePlaceholder')}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)', background: 'var(--surface-muted)',
                color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '600',
                outline: 'none', boxSizing: 'border-box'
              }}
            />

            {/* Description */}
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder={t('customProgram.descPlaceholder')}
              rows={2}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)', background: 'var(--surface-muted)',
                color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '500',
                outline: 'none', boxSizing: 'border-box', resize: 'none'
              }}
            />

            {/* Exercise selection */}
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('customProgram.selectExercises')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {EXERCISES.map((ex) => (
                <button key={ex.id} onClick={() => toggleExercise(ex.id)} style={{
                  padding: '8px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700',
                  background: formExercises.includes(ex.id) ? `${ex.color}25` : 'var(--surface-muted)',
                  border: formExercises.includes(ex.id) ? `2px solid ${ex.color}` : '2px solid var(--border-subtle)',
                  color: formExercises.includes(ex.id) ? ex.color : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}>
                  {t(`exercises.${ex.id}`)}
                </button>
              ))}
            </div>

            {/* Daily goals for selected exercises */}
            {formExercises.length > 0 && (
              <>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('customProgram.dailyGoal')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {formExercises.map((exId) => {
                    const ex = EXERCISES_MAP[exId];
                    return (
                      <div key={exId} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 14px', borderRadius: 'var(--radius-md)',
                        background: 'var(--surface-muted)', border: '1px solid var(--border-subtle)'
                      }}>
                        <span style={{ flex: 1, fontWeight: '600', fontSize: '0.9rem', color: ex?.color || 'var(--text-primary)' }}>
                          {t(`exercises.${exId}`)}
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={formGoals[exId] || 10}
                          onChange={(e) => setFormGoals((g) => ({ ...g, [exId]: Math.max(1, parseInt(e.target.value) || 1) }))}
                          style={{
                            width: '70px', padding: '8px', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)', background: 'var(--surface-section)',
                            color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '700',
                            textAlign: 'center', outline: 'none'
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Duration */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {t('customProgram.duration')}
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={formDuration}
                onChange={(e) => setFormDuration(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
                style={{
                  width: '80px', padding: '10px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)', background: 'var(--surface-muted)',
                  color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '700',
                  textAlign: 'center', outline: 'none'
                }}
              />
            </div>

            {formError && (
              <p style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.85rem', margin: 0 }}>{formError}</p>
            )}

            {/* Save button */}
            <button onClick={handleSave} className="hover-lift" style={{
              width: '100%', padding: '16px', borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', color: 'white',
              fontSize: '1rem', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
              <Check size={20} /> {t('customProgram.save')}
            </button>

            {/* Delete button (edit mode only) */}
            {view === 'edit' && selectedProgram && (
              <button onClick={() => {
                deleteProgram(selectedProgram.id);
                setView('list');
                resetForm();
              }} style={{
                width: '100%', padding: '12px', borderRadius: 'var(--radius-lg)',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
                <Trash2 size={18} /> {t('customProgram.delete')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────
  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.92)',
      zIndex: Z_INDEX.TOAST, display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      <div style={{ padding: 'var(--spacing-md)', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onClose} className="glass hover-lift" style={{
          width: '40px', height: '40px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-secondary)'
        }}><X size={20} /></button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-lg)', gap: '20px' }}>
        <Sparkles size={64} color="#8b5cf6" style={{ marginBottom: '10px' }} />
        <h2 style={{
          fontSize: '1.8rem', fontWeight: '800', textAlign: 'center', margin: 0,
          background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>{t('customProgram.title')}</h2>

        {/* Program list */}
        {programs.length > 0 && (
          <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
            {programs.map((prog) => {
              const statusColor = prog.status === 'active' ? '#10b981' : prog.status === 'paused' ? '#f59e0b' : prog.status === 'completed' ? '#818cf8' : '#8b5cf6';
              return (
                <button key={prog.id} onClick={() => handleOpenDetail(prog)} className="hover-lift" style={{
                  width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)',
                  background: `linear-gradient(135deg, rgba(139,92,246,0.12), rgba(124,58,237,0.08))`,
                  border: '1px solid rgba(139,92,246,0.25)', color: 'white',
                  fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                    <Sparkles size={18} color="#8b5cf6" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prog.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.75rem', color: statusColor, fontWeight: '600' }}>
                      {t(`customProgram.${prog.status}`)}
                    </span>
                    <ChevronRight size={16} color="var(--text-secondary)" />
                  </div>
                </button>
              );
            })}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
          </div>
        )}

        {programs.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px', margin: 0, lineHeight: '1.5' }}>
            {t('customProgram.noProgramsHint')}
          </p>
        )}

        <button onClick={() => { setView('create'); resetForm(); }} className="hover-lift" style={{
          width: '100%', maxWidth: '300px', padding: '16px', borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', color: 'white',
          fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}><Plus size={20} /> {t('customProgram.newProgram')}</button>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0, opacity: 0.7 }}>
          {t('customProgram.maxPrograms', { count: maxPrograms })}
        </p>
      </div>
    </div>
  );
}
