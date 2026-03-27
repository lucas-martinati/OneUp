import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Swords, LogIn, Plus, X, Check, Trophy, Users,
  Timer, Hash, ChevronRight, Lock, Star
} from 'lucide-react';
import { cloudSync } from '../services/cloudSync';
import { EXERCISES, EXERCISES_MAP } from '../config/exercises';
import { registerBackHandler } from '../utils/backHandler';

export function ChallengeModal({ onClose, cloudAuth, isClub }) {
  const { t } = useTranslation();
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('menu'); // 'menu' | 'create' | 'join' | 'details'
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  // Create form state
  const [challengeName, setChallengeName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [duration, setDuration] = useState(7);

  // Initial load
  useEffect(() => {
    const fetchChallenges = async () => {
      if (cloudAuth?.isSignedIn && isClub) {
        const ch = await cloudSync.getUserChallenges();
        setChallenges(ch);
      }
      setView('menu');
      setIsLoading(false);
    };
    fetchChallenges();
  }, [cloudAuth?.isSignedIn, isClub]);

  // Back handler
  useEffect(() => {
    const unreg = registerBackHandler(() => {
      if (view === 'create' || view === 'join') {
        setView('menu');
        setInputValue('');
        setError('');
        return true;
      }
      if (view === 'details') {
        setView('menu');
        setSelectedChallenge(null);
        return true;
      }
      onClose();
      return true;
    });
    return unreg;
  }, [view, onClose]);

  const handleOpenChallenge = async (chId) => {
    setIsLoading(true);
    const data = await cloudSync.getChallengeDetails(chId);
    if (data) {
      setSelectedChallenge(data);
      setView('details');
    } else {
      setError(t('challenge.noChallenges'));
    }
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!challengeName.trim()) return setError(t('challenge.challengeName'));
    if (selectedExercises.length === 0) return setError(t('challenge.selectExercises'));

    setIsLoading(true);
    setError('');

    const res = await cloudSync.createChallenge({
      name: challengeName.trim(),
      exerciseIds: selectedExercises,
      duration,
      invitedPseudos: [],
    });

    if (res.success) {
      const ch = await cloudSync.getUserChallenges();
      setChallenges(ch);
      setView('menu');
      setChallengeName('');
      setSelectedExercises([]);
    } else {
      setError(res.error || t('clan.createError'));
    }
    setIsLoading(false);
  };

  const handleJoin = async () => {
    if (!inputValue.trim() || inputValue.trim().length !== 6) return setError(t('clan.codeRequired'));

    setIsLoading(true);
    setError('');

    const res = await cloudSync.joinChallenge(inputValue.trim());
    if (res.success) {
      const ch = await cloudSync.getUserChallenges();
      setChallenges(ch);
      setView('menu');
      setInputValue('');
    } else {
      setError(res.error || t('clan.invalidCode'));
    }
    setIsLoading(false);
  };

  const toggleExercise = (exId) => {
    setSelectedExercises((prev) =>
      prev.includes(exId) ? prev.filter((id) => id !== exId) : [...prev, exId]
    );
  };

  // ── Club locked gate ─────────────────────────────────────────────────
  if (!isClub) {
    return (
      <div className="fade-in" style={{
        position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.92)',
        zIndex: 1000, display: 'flex', flexDirection: 'column',
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
          <Lock size={64} color="#f59e0b" style={{ marginBottom: '10px' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', textAlign: 'center', margin: 0, color: '#f59e0b' }}>
            {t('club.locked')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px', lineHeight: '1.5' }}>
            {t('club.lockedDesc')}
          </p>
        </div>
      </div>
    );
  }

  // ── Loader ───────────────────────────────────────────────────────────
  if (isLoading && !selectedChallenge && view !== 'create' && view !== 'join') {
    return (
      <div className="fade-in" style={{
        position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.92)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</div>
      </div>
    );
  }

  // ── Details view ─────────────────────────────────────────────────────
  if (view === 'details' && selectedChallenge) {
    return (
      <div className="fade-in" style={{
        position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.92)',
        zIndex: 1000, display: 'flex', flexDirection: 'column',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        <div style={{ padding: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => { setView('menu'); setSelectedChallenge(null); }} className="glass hover-lift" style={{
            width: '40px', height: '40px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-secondary)'
          }}><X size={20} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hash size={14} color="#f59e0b" />
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f59e0b', letterSpacing: '2px' }}>{selectedChallenge.code}</span>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 var(--spacing-md) var(--spacing-md)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', textAlign: 'center', margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            {selectedChallenge.name}
          </h2>

          {/* Exercise tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '20px' }}>
            {selectedChallenge.exerciseIds.map((exId) => {
              const ex = EXERCISES_MAP[exId];
              if (!ex) return null;
              return (
                <span key={exId} style={{
                  padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                  background: `${ex.color}20`, color: ex.color, border: `1px solid ${ex.color}40`
                }}>
                  {t(`exercises.${exId}`)}
                </span>
              );
            })}
          </div>

          {/* Duration */}
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            <Timer size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            {selectedChallenge.duration} {t('common.daysAbbr')}
          </div>

          {/* Leaderboard */}
          <div style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {t('challenge.leaderboard')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedChallenge.participants.map((p, idx) => (
              <div key={p.uid} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px', borderRadius: 'var(--radius-md)',
                background: p.isCurrentUser ? 'rgba(129,140,248,0.1)' : 'var(--surface-muted)',
                border: p.isCurrentUser ? '1px solid rgba(129,140,248,0.3)' : '1px solid var(--border-subtle)'
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: idx === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : idx === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : idx === 2 ? 'linear-gradient(135deg, #b45309, #92400e)' : 'var(--surface-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: '800', color: idx < 3 ? 'white' : 'var(--text-secondary)'
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.pseudo} {p.isCurrentUser && <span style={{ color: '#818cf8', fontSize: '0.75rem' }}>({t('common.you')})</span>}
                  </div>
                </div>
                <div style={{ fontWeight: '800', color: '#818cf8', fontSize: '1rem' }}>
                  {p.score}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Main menu ────────────────────────────────────────────────────────
  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.92)',
      zIndex: 1000, display: 'flex', flexDirection: 'column',
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
        <Swords size={64} color="#f59e0b" style={{ marginBottom: '10px' }} />
        <h2 style={{
          fontSize: '1.8rem', fontWeight: '800', textAlign: 'center', margin: 0,
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>{t('challenge.title')}</h2>

        {view === 'menu' && (
          <>
            {!cloudAuth?.isSignedIn ? (
              <>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px', margin: 0, lineHeight: '1.5' }}>
                  {t('clan.signInRequired')}
                </p>
              </>
            ) : (
              <>
                {/* Existing challenges */}
                {challenges.length > 0 && (
                  <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
                    {challenges.map((ch) => (
                      <button key={ch.id} onClick={() => handleOpenChallenge(ch.id)} className="hover-lift" style={{
                        width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.08))',
                        border: '1px solid rgba(245,158,11,0.25)', color: 'white',
                        fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                          <Swords size={18} color="#f59e0b" />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.75rem', color: ch.status === 'active' ? '#10b981' : '#f59e0b', fontWeight: '600' }}>
                            {t(`challenge.${ch.status}`)}
                          </span>
                          <ChevronRight size={16} color="var(--text-secondary)" />
                        </div>
                      </button>
                    ))}
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                  </div>
                )}

                {challenges.length === 0 && (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px', margin: 0, lineHeight: '1.5' }}>
                    {t('challenge.noChallengesHint')}
                  </p>
                )}

                <button onClick={() => { setView('create'); setError(''); setChallengeName(''); setSelectedExercises([]); }} className="hover-lift" style={{
                  width: '100%', maxWidth: '300px', padding: '16px', borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: 'white',
                  fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  marginBottom: '12px'
                }}><Plus size={20} /> {t('challenge.newChallenge')}</button>

                <button onClick={() => { setView('join'); setError(''); setInputValue(''); }} className="hover-lift" style={{
                  width: '100%', maxWidth: '300px', padding: '16px', borderRadius: 'var(--radius-lg)',
                  background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)',
                  fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}><LogIn size={20} /> {t('challenge.joinChallenge')}</button>
              </>
            )}
          </>
        )}

        {(view === 'create' || view === 'join') && (
          <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {view === 'create' && (
              <>
                <input
                  type="text"
                  value={challengeName}
                  onChange={(e) => setChallengeName(e.target.value)}
                  placeholder={t('challenge.challengeNamePlaceholder')}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-muted)',
                    color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '600',
                    outline: 'none', boxSizing: 'border-box'
                  }}
                />

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t('challenge.selectExercises')}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {EXERCISES.map((ex) => (
                    <button key={ex.id} onClick={() => toggleExercise(ex.id)} style={{
                      padding: '8px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700',
                      background: selectedExercises.includes(ex.id) ? `${ex.color}25` : 'var(--surface-muted)',
                      border: selectedExercises.includes(ex.id) ? `2px solid ${ex.color}` : '2px solid var(--border-subtle)',
                      color: selectedExercises.includes(ex.id) ? ex.color : 'var(--text-secondary)',
                      cursor: 'pointer', transition: 'all 0.2s ease'
                    }}>
                      {t(`exercises.${ex.id}`)}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {t('challenge.duration')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, Math.min(90, parseInt(e.target.value) || 1)))}
                    style={{
                      width: '80px', padding: '10px', borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)', background: 'var(--surface-muted)',
                      color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '700',
                      textAlign: 'center', outline: 'none'
                    }}
                  />
                </div>

                <button onClick={handleCreate} className="hover-lift" style={{
                  width: '100%', padding: '16px', borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', color: 'white',
                  fontSize: '1rem', fontWeight: '700', cursor: 'pointer'
                }}>
                  {t('challenge.createChallenge')}
                </button>
              </>
            )}

            {view === 'join' && (
              <>
                <p style={{ margin: 0, color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>
                  {t('challenge.enterCode')}
                </p>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="ABC123"
                  maxLength={6}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)', background: 'var(--surface-muted)',
                    color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: '800',
                    textAlign: 'center', letterSpacing: '6px', outline: 'none', boxSizing: 'border-box',
                    textTransform: 'uppercase'
                  }}
                />
                <button onClick={handleJoin} className="hover-lift" style={{
                  width: '100%', padding: '16px', borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #818cf8, #6366f1)', border: 'none', color: 'white',
                  fontSize: '1rem', fontWeight: '700', cursor: 'pointer'
                }}>
                  {t('clan.join')}
                </button>
              </>
            )}

            {error && (
              <p style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.85rem', margin: 0 }}>{error}</p>
            )}

            <button onClick={() => { setView('menu'); setError(''); }} style={{
              background: 'transparent', border: 'none', color: 'var(--text-secondary)',
              fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', padding: '8px'
            }}>
              {t('common.cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
