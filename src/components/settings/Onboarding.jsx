import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Calendar, ArrowRight, Zap, Target, Dumbbell, ArrowDownUp, ArrowUp, ChevronsUp, Footprints, Flame, Square, MoveDown, MoveDiagonal } from 'lucide-react';
import { getLocalDateStr } from '../../utils/dateUtils';
import { EXERCISES } from '../../config/exercises';
import ICON_MAP from '../../utils/iconMap';

export function Onboarding({ onStart }) {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const currentYear = new Date().getFullYear();
    const todayStr = getLocalDateStr(new Date());

    const [date, setDate] = useState(getLocalDateStr(new Date()));
    const [selectedExercises, setSelectedExercises] = useState(['pushups']);

    const isPastDate = date < todayStr;

    const toggleExercise = (exId) => {
        setSelectedExercises(prev => {
            if (prev.includes(exId)) {
                return prev.filter(id => id !== exId);
            }
            return [...prev, exId];
        });
    };

    const handleStart = () => {
        if (isPastDate) {
            onStart(new Date(date), selectedExercises);
        } else {
            onStart(new Date(date), null);
        }
    };

    return (
        <div className="fade-in" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            gap: 'clamp(16px, 3vh, 32px)',
            padding: 'var(--spacing-md)'
        }}>
            {/* Title */}
            <div style={{ maxWidth: '380px' }}>
                <h1 className="rainbow-gradient" style={{
                    fontSize: 'clamp(2.4rem, 7vw, 3.5rem)',
                    marginBottom: 'var(--spacing-xs)',
                    fontWeight: '800',
                    letterSpacing: '-1px'
                }}>
                    OneUp
                </h1>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    color: 'var(--text-secondary)',
                    fontSize: 'clamp(0.85rem, 2.2vw, 1.05rem)',
                    fontWeight: '500'
                }}>
                    {step === 1 ? (
                        <>
                            <Target size={18} color="#8b5cf6" />
                            <span>{t('onboarding.concept')}</span>
                        </>
                    ) : step === 2 ? (
                        <>
                            <Zap size={18} color="#f59e0b" />
                            <span>{t('onboarding.yourJourney')}</span>
                        </>
                    ) : (
                        <>
                            <Dumbbell size={18} color="#10b981" />
                            <span>{t('onboarding.yourExercises')}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Content Card */}
            <div
                key={step}
                className={step === 1 ? "glass-premium scale-in" : "glass-premium flip-enter"}
                style={{
                    padding: 'clamp(16px, 3vw, 28px)',
                    borderRadius: 'var(--radius-xl)',
                    width: '100%',
                    maxWidth: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-md)',
                    minHeight: 'clamp(240px, 40vh, 320px)',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-lg)'
                }}
            >
                {step === 1 ? (
                    <>
                        {/* Step 1: Concept */}
                        <div style={{
                            textAlign: 'left',
                            fontSize: 'clamp(0.9rem, 2.5vw, 1.05rem)',
                            lineHeight: '1.7',
                            color: 'var(--text-primary)'
                        }}>
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(109, 40, 217, 0.2), rgba(139, 92, 246, 0.2))',
                                padding: 'var(--spacing-sm)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--spacing-sm)',
                                borderLeft: '3px solid var(--accent)'
                            }}>
                                <p style={{ marginBottom: '8px' }}>
                                    <strong style={{ color: '#8b5cf6' }}>{t('onboarding.day1')}</strong> {t('onboarding.day1Desc')}
                                </p>
                                <p>
                                    <strong style={{ color: '#f093fb' }}>{t('onboarding.day365')}</strong> {t('onboarding.day365Desc')}
                                </p>
                            </div>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                <Trans i18nKey="onboarding.discipline"><strong style={{ color: 'var(--text-primary)' }}>PLACEHOLDER</strong></Trans>
                            </p>
                            <p style={{
                                marginTop: 'var(--spacing-sm)',
                                fontSize: 'clamp(0.8rem, 2vw, 0.95rem)',
                                fontStyle: 'italic',
                                color: '#8b5cf6'
                            }}>
                                {t('onboarding.consistencySuperpower')}
                            </p>
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            className="gradient-button hover-lift"
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                padding: 'clamp(12px, 2vh, 16px) var(--spacing-md)',
                                borderRadius: 'var(--radius-lg)',
                                fontWeight: '600',
                                fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                                marginTop: 'var(--spacing-xs)',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                                minHeight: 'var(--touch-min)'
                            }}
                        >
                            {t('onboarding.letsGo')}
                        </button>
                    </>
                ) : step === 2 ? (
                    <>
                        {/* Step 2: Start Date */}
                        <div style={{ textAlign: 'left' }}>
                            <label style={{
                                fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                                color: 'var(--text-primary)',
                                fontWeight: '600',
                                marginBottom: 'var(--spacing-xs)',
                                display: 'block'
                            }}>
                                {t('onboarding.whenStarted')}
                            </label>
                            <p style={{
                                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                                color: 'var(--text-secondary)',
                                marginBottom: 'var(--spacing-md)',
                                lineHeight: '1.5'
                            }}>
                                {t('onboarding.backfillDesc')}<br />
                                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                    {t('onboarding.limitedTo', { year: currentYear })}
                                </span>
                            </p>

                            {/* Date Picker */}
                            <div className="glass-premium hover-lift" style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: 'linear-gradient(135deg, rgba(109, 40, 217, 0.15), rgba(139, 92, 246, 0.15))',
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                borderRadius: 'var(--radius-lg)',
                                border: '2px solid rgba(139, 92, 246, 0.3)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                minHeight: 'var(--touch-min)'
                            }}>
                                <Calendar size={22} style={{ color: '#8b5cf6', marginRight: '12px', flexShrink: 0 }} />
                                <input
                                    type="date"
                                    value={date}
                                    min={`${currentYear}-01-01`}
                                    max={`${currentYear}-12-31`}
                                    onChange={(e) => setDate(e.target.value)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-primary)',
                                        fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                                        fontFamily: 'inherit',
                                        fontWeight: '600',
                                        width: '100%',
                                        outline: 'none',
                                        colorScheme: 'dark',
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: 'var(--spacing-sm)' }}>
                            <button
                                onClick={() => setStep(1)}
                                className="hover-lift"
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.08)',
                                    color: 'var(--text-secondary)',
                                    padding: 'clamp(10px, 1.5vh, 14px)',
                                    borderRadius: 'var(--radius-lg)',
                                    fontWeight: '600',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    minHeight: 'var(--touch-min)',
                                    fontSize: 'clamp(0.85rem, 2.2vw, 1rem)'
                                }}
                            >
                                {t('onboarding.back')}
                            </button>
                            <button
                                onClick={() => {
                                    if (date < todayStr) {
                                        setStep(3);
                                    } else {
                                        handleStart();
                                    }
                                }}
                                className="gradient-button hover-lift ripple"
                                style={{
                                    flex: 2,
                                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    color: 'white',
                                    padding: 'clamp(10px, 1.5vh, 14px) var(--spacing-md)',
                                    borderRadius: 'var(--radius-lg)',
                                    fontWeight: '700',
                                    fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    boxShadow: '0 6px 24px rgba(245, 87, 108, 0.5)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    minHeight: 'var(--touch-min)'
                                }}
                            >
                                {date < todayStr ? t('onboarding.next') : t('onboarding.startChallenge')}
                                <ArrowRight size={20} strokeWidth={3} />
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Step 3: Exercise Selection (only if past date) */}
                        <div style={{ textAlign: 'left' }}>
                            <label style={{
                                fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                                color: 'var(--text-primary)',
                                fontWeight: '600',
                                marginBottom: 'var(--spacing-xs)',
                                display: 'block'
                            }}>
                                {t('onboarding.whichExercises')}
                            </label>
                            <p style={{
                                fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                                color: 'var(--text-secondary)',
                                marginBottom: 'var(--spacing-md)',
                                lineHeight: '1.5'
                            }}>
                                {t('onboarding.selectPastExercises')}<br />
                                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                    {t('onboarding.chooseAtLeast')}
                                </span>
                            </p>

                            {/* Exercise Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: 'clamp(8px, 1.5vw, 12px)',
                                marginBottom: 'var(--spacing-sm)',
                                maxHeight: '40vh',
                                overflowY: 'auto'
                            }}>
                                {EXERCISES.map(ex => {
                                    const ExIcon = ICON_MAP[ex.icon] || Dumbbell;
                                    const isSelected = selectedExercises.includes(ex.id);
                                    return (
                                        <button
                                            key={ex.id}
                                            onClick={() => toggleExercise(ex.id)}
                                            className="hover-lift"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: 'clamp(8px, 1.5vh, 12px)',
                                                background: isSelected
                                                    ? `${ex.color}22`
                                                    : 'rgba(255,255,255,0.05)',
                                                border: `2px solid ${isSelected ? ex.color : 'rgba(255,255,255,0.1)'}`,
                                                borderRadius: 'var(--radius-md)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                opacity: 1,
                                                minHeight: 'var(--touch-min)'
                                            }}
                                        >
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: `${ex.color}33`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <ExIcon size={16} color={ex.color} />
                                            </div>
                                            <span style={{
                                                color: isSelected ? ex.color : 'var(--text-primary)',
                                                fontWeight: '600',
                                                fontSize: 'clamp(0.75rem, 2vw, 0.9rem)'
                                            }}>
                                                {t('exercises.' + ex.id)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: 'var(--spacing-sm)' }}>
                            <button
                                onClick={() => setStep(2)}
                                className="hover-lift"
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.08)',
                                    color: 'var(--text-secondary)',
                                    padding: 'clamp(10px, 1.5vh, 14px)',
                                    borderRadius: 'var(--radius-lg)',
                                    fontWeight: '600',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    minHeight: 'var(--touch-min)',
                                    fontSize: 'clamp(0.85rem, 2.2vw, 1rem)'
                                }}
                            >
                                {t('onboarding.back')}
                            </button>
                            <button
                                onClick={handleStart}
                                className="gradient-button hover-lift ripple"
                                disabled={selectedExercises.length === 0}
                                style={{
                                    flex: 2,
                                    background: selectedExercises.length > 0
                                        ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                                        : 'rgba(255,255,255,0.1)',
                                    color: selectedExercises.length > 0 ? 'white' : 'var(--text-secondary)',
                                    padding: 'clamp(10px, 1.5vh, 14px) var(--spacing-md)',
                                    borderRadius: 'var(--radius-lg)',
                                    fontWeight: '700',
                                    fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    boxShadow: selectedExercises.length > 0 ? '0 6px 24px rgba(245, 87, 108, 0.5)' : 'none',
                                    border: 'none',
                                    cursor: selectedExercises.length > 0 ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.3s ease',
                                    minHeight: 'var(--touch-min)'
                                }}
                            >
                                {t('onboarding.startChallenge')}
                                <ArrowRight size={20} strokeWidth={3} />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Progress Indicator */}
            <div style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'center'
            }}>
                {[1, 2, 3].map(s => (
                    <div key={s} style={{
                        width: step === s ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        background: step === s
                            ? s === 1 ? 'linear-gradient(90deg, #667eea, #764ba2)'
                                : s === 2 ? 'linear-gradient(90deg, #f093fb, #f5576c)'
                                    : 'linear-gradient(90deg, #10b981, #34d399)'
                            : 'rgba(255,255,255,0.2)',
                        transition: 'all 0.3s ease'
                    }} />
                ))}
            </div>
        </div>
    );
}
