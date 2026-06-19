import { useState } from 'react';
import { useBackHandler } from '@hooks/useBackHandler';
import { useTranslation, Trans } from 'react-i18next';
import {
    Calendar, ArrowRight, ArrowLeft, Target, Rocket, History,
    Sparkles, AlertCircle, CheckCircle2, Globe, getIcon
} from '@utils/icons';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { getLocalDateStr } from '@utils/dateUtils';
import { EXERCISES } from '@config/exercises';
import { LANGUAGES, resolveLanguageCode } from '@config/languages';
import { useAuth } from '@contexts/AuthContext';
import { Button, GoogleIcon } from '../ui';

const ACCENT = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';

export function Onboarding({ onStart }) {
    const { t, i18n } = useTranslation();
    const auth = useAuth();
    const currentYear = new Date().getFullYear();
    const todayStr = getLocalDateStr(new Date());

    // The challenge is pinned to the calendar year: the daily goal is the
    // day-of-year (Jan 1 → Day 1, Dec 31 → Day 365). Joining mid-year means
    // picking up at today's number, not restarting at 1.
    const now = new Date();
    const dayOfYear = Math.floor(
        (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(currentYear, 0, 1)) / 86400000
    ) + 1;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);
    const minStr = `${currentYear}-01-01`;

    const [step, setStep] = useState(1);
    // 'today'  → fresh start at Day 1 (recommended, the common case)
    // 'past'   → import a real history that already exists
    const [mode, setMode] = useState('today');
    const [date, setDate] = useState(yesterdayStr < minStr ? minStr : yesterdayStr);
    const [selectedExercises, setSelectedExercises] = useState(['pushups']);

    // Hardware back navigates between steps before bubbling up
    useBackHandler(() => {
        if (step > 1) { setStep(step - 1); return true; }
        return false;
    }, true);

    const toggleExercise = (exId) => {
        setSelectedExercises(prev =>
            prev.includes(exId) ? prev.filter(id => id !== exId) : [...prev, exId]
        );
    };

    const handleStart = () => {
        if (mode === 'past') {
            onStart(new Date(date), selectedExercises);
        } else {
            onStart(new Date(), null);
        }
    };

    const canStartPast = date < todayStr && selectedExercises.length > 0;

    // ── Shared styles ────────────────────────────────────────────────────
    const primaryBtn = {
        background: ACCENT,
        color: 'white',
        padding: 'clamp(12px, 1.8vh, 16px) var(--spacing-md)',
        borderRadius: 'var(--radius-lg)',
        fontWeight: '700',
        fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        boxShadow: '0 6px 24px rgba(245, 87, 108, 0.45)',
        border: 'none', cursor: 'pointer', minHeight: 'var(--touch-min)',
    };

    const headerFor = {
        1: { icon: <Target size={18} color="#8b5cf6" />, label: t('onboarding.concept') },
        2: { icon: <Rocket size={18} color="#f59e0b" />, label: t('onboarding.yourJourney') },
        3: mode === 'past'
            ? { icon: <History size={18} color="#10b981" />, label: t('onboarding.yourExercises') }
            : { icon: <Sparkles size={18} color="#10b981" />, label: t('onboarding.almostThere') },
    }[step];

    return (
        <div className="fade-in" style={{
            position: 'relative',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', textAlign: 'center',
            gap: 'clamp(16px, 3vh, 32px)', padding: 'var(--spacing-md)'
        }}>
            {/* Discreet language switcher */}
            <LanguageSwitcher i18n={i18n} />

            {/* Title + sub-header */}
            <div style={{ maxWidth: '380px' }}>
                <h1 className="rainbow-gradient" style={{
                    fontSize: 'clamp(2.4rem, 7vw, 3.5rem)',
                    marginBottom: 'var(--spacing-xs)', fontWeight: '800', letterSpacing: '-1px'
                }}>
                    OneUp
                </h1>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    color: 'var(--text-secondary)',
                    fontSize: 'clamp(0.85rem, 2.2vw, 1.05rem)', fontWeight: '500'
                }}>
                    {headerFor.icon}
                    <span>{headerFor.label}</span>
                </div>
            </div>

            {/* Content card */}
            <div
                key={step}
                className={step === 1 ? 'glass-premium scale-in' : 'glass-premium flip-enter'}
                style={{
                    padding: 'clamp(16px, 3vw, 28px)', borderRadius: 'var(--radius-xl)',
                    width: '100%', maxWidth: '420px',
                    display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)',
                    minHeight: 'clamp(240px, 40vh, 320px)', justifyContent: 'center',
                    boxShadow: 'var(--shadow-lg)'
                }}
            >
                {/* ───────────────── STEP 1 — Concept ───────────────── */}
                {step === 1 && (
                    <>
                        <p style={{
                            fontSize: 'clamp(1rem, 2.8vw, 1.2rem)', fontWeight: '700',
                            color: 'var(--text-primary)', lineHeight: '1.5', margin: 0
                        }}>
                            {t('onboarding.tagline')}
                        </p>

                        {/* Progressive ramp visual */}
                        <div style={{
                            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                            gap: 'clamp(6px, 2vw, 12px)', height: '104px', padding: '4px 0'
                        }}>
                            {[
                                { label: '1', h: '24%' },
                                { label: '2', h: '40%' },
                                { label: '3', h: '56%' },
                                { label: '…', h: '76%' },
                                { label: '365', h: '100%' },
                            ].map((bar, i) => (
                                <div key={i} style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    gap: '6px', height: '100%', justifyContent: 'flex-end', flex: 1, maxWidth: '56px'
                                }}>
                                    <span style={{
                                        fontSize: 'clamp(0.65rem, 2vw, 0.8rem)', fontWeight: '800',
                                        color: i === 4 ? '#f5576c' : 'var(--text-secondary)'
                                    }}>
                                        {bar.label}
                                    </span>
                                    <div style={{
                                        width: '100%', height: bar.h, borderRadius: '6px 6px 3px 3px',
                                        background: ACCENT, opacity: 0.55 + i * 0.11,
                                        boxShadow: i === 4 ? '0 4px 16px rgba(245,87,108,0.45)' : 'none'
                                    }} />
                                </div>
                            ))}
                        </div>
                        <p style={{
                            fontSize: 'clamp(0.78rem, 2vw, 0.9rem)', color: 'var(--text-secondary)',
                            margin: 0, fontWeight: '600'
                        }}>
                            {t('onboarding.rampCaption')}
                        </p>

                        <p style={{
                            fontSize: 'clamp(0.85rem, 2.2vw, 0.98rem)', lineHeight: '1.6',
                            color: 'var(--text-secondary)', margin: 0, textAlign: 'left'
                        }}>
                            <Trans i18nKey="onboarding.conceptBody">
                                <strong style={{ color: 'var(--text-primary)' }}>PLACEHOLDER</strong>
                            </Trans>
                        </p>

                        <button onClick={() => setStep(2)} className="gradient-button hover-lift" style={primaryBtn}>
                            {t('onboarding.letsGo')}
                            <ArrowRight size={20} strokeWidth={3} />
                        </button>

                        {!auth.isSignedIn && (
                            <>
                                <button
                                    onClick={auth.signIn}
                                    className="hover-lift"
                                    disabled={auth.loading}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: 'var(--text-primary)',
                                        padding: 'clamp(10px, 1.5vh, 14px) var(--spacing-md)',
                                        borderRadius: 'var(--radius-lg)', fontWeight: '600',
                                        fontSize: 'clamp(0.9rem, 2.3vw, 1rem)',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', gap: '10px',
                                        minHeight: 'var(--touch-min)', width: '100%',
                                        backdropFilter: 'blur(8px)'
                                    }}
                                >
                                    {auth.loading ? (
                                        <>
                                            <span className="delete-spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                                            <span>{t('common.loading')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <GoogleIcon className="google-icon" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                                            <span>{t('onboarding.reconnectOption')}</span>
                                        </>
                                    )}
                                </button>
                                {auth.error && (
                                    <div className="sync-message error" style={{ width: '100%', boxSizing: 'border-box' }}>
                                        <AlertCircle size={16} />
                                        <span>{auth.error}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* ───────────────── STEP 2 — Choose mode ───────────────── */}
                {step === 2 && (
                    <>
                        <p style={{
                            fontSize: 'clamp(0.98rem, 2.6vw, 1.15rem)', fontWeight: '700',
                            color: 'var(--text-primary)', margin: 0
                        }}>
                            {t('onboarding.whereToStart')}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <ModeCard
                                active={mode === 'today'}
                                onClick={() => setMode('today')}
                                icon={<Rocket size={22} color="#f5576c" />}
                                accent="#f5576c"
                                title={t('onboarding.modeTodayTitle')}
                                desc={t('onboarding.modeTodayDesc', { day: dayOfYear })}
                                badge={t('onboarding.recommended')}
                            />
                            <ModeCard
                                active={mode === 'past'}
                                onClick={() => setMode('past')}
                                icon={<History size={22} color="#8b5cf6" />}
                                accent="#8b5cf6"
                                title={t('onboarding.modePastTitle')}
                                desc={t('onboarding.modePastDesc')}
                            />
                        </div>

                        <NavRow onBack={() => setStep(1)} t={t}>
                            <button onClick={() => setStep(3)} className="gradient-button hover-lift" style={{ ...primaryBtn, flex: 2 }}>
                                {t('onboarding.continue')}
                                <ArrowRight size={20} strokeWidth={3} />
                            </button>
                        </NavRow>
                    </>
                )}

                {/* ───────────────── STEP 3a — Ready (today) ───────────────── */}
                {step === 3 && mode === 'today' && (
                    <>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%', alignSelf: 'center',
                            display: 'grid', placeItems: 'center',
                            background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16,185,129,0.25)'
                        }}>
                            <CheckCircle2 size={34} color="#10b981" />
                        </div>
                        <p style={{
                            fontSize: 'clamp(1.05rem, 3vw, 1.3rem)', fontWeight: '800',
                            color: 'var(--text-primary)', margin: 0
                        }}>
                            {t('onboarding.readyTitle')}
                        </p>
                        <p style={{
                            fontSize: 'clamp(0.85rem, 2.2vw, 0.98rem)', lineHeight: '1.6',
                            color: 'var(--text-secondary)', margin: 0
                        }}>
                            <Trans i18nKey="onboarding.todayRecap" values={{ day: dayOfYear }}>
                                <strong style={{ color: '#10b981' }}>PLACEHOLDER</strong>
                            </Trans>
                        </p>

                        <NavRow onBack={() => setStep(2)} t={t}>
                            <button onClick={handleStart} className="gradient-button hover-lift ripple" style={{ ...primaryBtn, flex: 2 }}>
                                {t('onboarding.startChallenge')}
                                <ArrowRight size={20} strokeWidth={3} />
                            </button>
                        </NavRow>
                    </>
                )}

                {/* ───────────────── STEP 3b — Import history (past) ───────────────── */}
                {step === 3 && mode === 'past' && (
                    <>
                        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', maxHeight: '62vh', overflowY: 'auto', paddingRight: '2px' }}>
                            {/* Start date */}
                            <div>
                                <label style={{
                                    fontSize: 'clamp(0.92rem, 2.4vw, 1.05rem)', color: 'var(--text-primary)',
                                    fontWeight: '700', marginBottom: '6px', display: 'block'
                                }}>
                                    {t('onboarding.whenStartedReal')}
                                </label>
                                <p style={{
                                    fontSize: 'clamp(0.78rem, 2vw, 0.88rem)', color: 'var(--text-secondary)',
                                    margin: '0 0 10px', lineHeight: '1.5'
                                }}>
                                    {t('onboarding.backfillExplain')}
                                </p>
                                <div className="hover-lift" style={{
                                    display: 'flex', alignItems: 'center',
                                    background: 'linear-gradient(135deg, rgba(109, 40, 217, 0.15), rgba(139, 92, 246, 0.15))',
                                    padding: 'var(--spacing-sm) var(--spacing-md)', borderRadius: 'var(--radius-lg)',
                                    border: '2px solid rgba(139, 92, 246, 0.3)', minHeight: 'var(--touch-min)'
                                }}>
                                    <Calendar size={22} style={{ color: '#8b5cf6', marginRight: '12px', flexShrink: 0 }} />
                                    <input
                                        type="date"
                                        value={date}
                                        min={minStr}
                                        max={yesterdayStr}
                                        onChange={(e) => setDate(e.target.value)}
                                        style={{
                                            background: 'transparent', border: 'none', color: 'var(--text-primary)',
                                            fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', fontFamily: 'inherit',
                                            fontWeight: '600', width: '100%', outline: 'none',
                                            colorScheme: 'dark', cursor: 'pointer'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Honesty notice — the crux of the confusion fix */}
                            <div style={{
                                display: 'flex', gap: '10px', alignItems: 'flex-start',
                                background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
                                borderRadius: 'var(--radius-md)', padding: 'var(--spacing-sm)'
                            }}>
                                <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '1px' }} />
                                <div style={{ fontSize: 'clamp(0.76rem, 1.9vw, 0.86rem)', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                                    <strong style={{ color: '#f59e0b', display: 'block', marginBottom: '2px' }}>
                                        {t('onboarding.honestTitle')}
                                    </strong>
                                    {t('onboarding.honestDesc')}
                                </div>
                            </div>

                            {/* Exercise picker */}
                            <div>
                                <label style={{
                                    fontSize: 'clamp(0.92rem, 2.4vw, 1.05rem)', color: 'var(--text-primary)',
                                    fontWeight: '700', marginBottom: '6px', display: 'block'
                                }}>
                                    {t('onboarding.whichExercisesReal')}
                                    <span style={{ fontWeight: '500', fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                                        {t('onboarding.chooseAtLeast')}
                                    </span>
                                </label>
                                <div style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 'clamp(8px, 1.5vw, 12px)'
                                }}>
                                    {EXERCISES.map(ex => {
                                        const ExIcon = getIcon(ex.icon);
                                        const isSelected = selectedExercises.includes(ex.id);
                                        return (
                                            <button
                                                key={ex.id}
                                                onClick={() => toggleExercise(ex.id)}
                                                className="hover-lift"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '10px',
                                                    padding: 'clamp(12px, 2.2vh, 16px)',
                                                    background: isSelected ? `${ex.color}22` : 'rgba(255,255,255,0.05)',
                                                    border: `2px solid ${isSelected ? ex.color : 'rgba(255,255,255,0.1)'}`,
                                                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                                    transition: 'all 0.2s ease', minHeight: 'clamp(54px, 8vh, 64px)'
                                                }}
                                            >
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '50%',
                                                    background: `${ex.color}33`, display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                }}>
                                                    <ExIcon size={16} color={ex.color} />
                                                </div>
                                                <span style={{
                                                    color: isSelected ? ex.color : 'var(--text-primary)',
                                                    fontWeight: '600', fontSize: 'clamp(0.75rem, 2vw, 0.9rem)'
                                                }}>
                                                    {getExerciseLabel(ex)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <NavRow onBack={() => setStep(2)} t={t}>
                            <button
                                onClick={handleStart}
                                className="gradient-button hover-lift ripple"
                                disabled={!canStartPast}
                                style={{
                                    ...primaryBtn, flex: 2,
                                    background: canStartPast ? ACCENT : 'rgba(255,255,255,0.1)',
                                    color: canStartPast ? 'white' : 'var(--text-secondary)',
                                    boxShadow: canStartPast ? primaryBtn.boxShadow : 'none',
                                    cursor: canStartPast ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {t('onboarding.startChallenge')}
                                <ArrowRight size={20} strokeWidth={3} />
                            </button>
                        </NavRow>
                    </>
                )}
            </div>

            {/* Progress indicator */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {[1, 2, 3].map(s => {
                    let backgroundVal = 'rgba(255,255,255,0.2)';
                    if (step === s) {
                        if (s === 1) {
                            backgroundVal = 'linear-gradient(90deg, #667eea, #764ba2)';
                        } else if (s === 2) {
                            backgroundVal = 'linear-gradient(90deg, #f093fb, #f5576c)';
                        } else {
                            backgroundVal = 'linear-gradient(90deg, #10b981, #34d399)';
                        }
                    }
                    return (
                        <div key={s} style={{
                            width: step === s ? '24px' : '8px', height: '8px', borderRadius: '4px',
                            background: backgroundVal,
                            transition: 'all 0.3s ease'
                        }} />
                    );
                })}
            </div>
        </div>
    );
}

/** Discreet language picker, pinned to the top-right during onboarding. */
function LanguageSwitcher({ i18n }) {
    const current = resolveLanguageCode(i18n.resolvedLanguage || i18n.language);
    const label = LANGUAGES.find(l => l.code === current)?.label || 'English';

    const onChange = (e) => {
        const code = e.target.value;
        i18n.changeLanguage(code);
        localStorage.setItem('oneup_language', code);
    };

    return (
        <label
            className="hover-lift"
            title={label}
            style={{
                position: 'absolute',
                top: 'max(8px, env(safe-area-inset-top))',
                right: 'max(8px, env(safe-area-inset-right))',
                zIndex: 3,
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 10px', borderRadius: '999px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: '700',
                cursor: 'pointer', backdropFilter: 'blur(8px)'
            }}
        >
            <Globe size={15} />
            <span>{label}</span>
            <select
                value={current}
                onChange={onChange}
                aria-label="Language"
                style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    opacity: 0, cursor: 'pointer', border: 'none', appearance: 'none'
                }}
            >
                {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code} style={{ background: '#0a0a0f', color: '#fff' }}>
                        {lang.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

/** Selectable card for the start-mode choice (today vs already started). */
function ModeCard({ active, onClick, icon, accent, title, desc, badge }) {
    return (
        <button
            onClick={onClick}
            className="hover-lift"
            style={{
                position: 'relative', textAlign: 'left', display: 'flex', gap: '12px', alignItems: 'center',
                padding: 'var(--spacing-sm) var(--spacing-md)', borderRadius: 'var(--radius-lg)',
                background: active ? `${accent}1f` : 'rgba(255,255,255,0.04)',
                border: `2px solid ${active ? accent : 'rgba(255,255,255,0.1)'}`,
                cursor: 'pointer', transition: 'all 0.2s ease', minHeight: 'var(--touch-min)'
            }}
        >
            <div style={{
                width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                display: 'grid', placeItems: 'center', background: `${accent}26`
            }}>
                {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '800', fontSize: 'clamp(0.92rem, 2.4vw, 1.02rem)', color: 'var(--text-primary)' }}>
                        {title}
                    </span>
                    {badge && (
                        <span style={{
                            fontSize: '0.62rem', fontWeight: '800', letterSpacing: '0.04em',
                            textTransform: 'uppercase', color: accent,
                            background: `${accent}26`, border: `1px solid ${accent}55`,
                            borderRadius: '999px', padding: '2px 8px'
                        }}>
                            {badge}
                        </span>
                    )}
                </div>
                <span style={{ display: 'block', marginTop: '2px', fontSize: 'clamp(0.76rem, 1.9vw, 0.86rem)', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {desc}
                </span>
            </div>
            <div style={{
                width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${active ? accent : 'rgba(255,255,255,0.25)'}`,
                background: active ? accent : 'transparent',
                display: 'grid', placeItems: 'center'
            }}>
                {active && <CheckCircle2 size={14} color="#fff" />}
            </div>
        </button>
    );
}

/** Back + primary action row shared by steps 2 and 3. */
function NavRow({ onBack, t, children }) {
    return (
        <div style={{ display: 'flex', gap: '10px', marginTop: 'var(--spacing-xs)' }}>
            <Button variant="secondary" onClick={onBack} className="hover-lift" style={{ flex: 1, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <ArrowLeft size={18} />
                {t('onboarding.back')}
            </Button>
            {children}
        </div>
    );
}
