import { useState } from 'react';
import { Calendar, ArrowRight, Zap, Target } from 'lucide-react';

export function Onboarding({ onStart }) {
    const [step, setStep] = useState(1);
    const currentYear = new Date().getFullYear();

    // Helper to get local date string (not UTC)
    const getLocalDateStr = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [date, setDate] = useState(getLocalDateStr(new Date()));

    const handleStart = () => {
        onStart(new Date(date));
    };

    return (
        <div className="fade-in" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            gap: 'var(--spacing-xl)',
            padding: 'var(--spacing-md)'
        }}>
            {/* Title */}
            <div style={{ maxWidth: '320px' }}>
                <h1 className="rainbow-gradient" style={{
                    fontSize: '3rem',
                    marginBottom: 'var(--spacing-sm)',
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
                    fontSize: '1rem',
                    fontWeight: '500'
                }}>
                    {step === 1 ? (
                        <>
                            <Target size={18} color="#8b5cf6" />
                            <span>The Concept</span>
                        </>
                    ) : (
                        <>
                            <Zap size={18} color="#f59e0b" />
                            <span>Your Journey</span>
                        </>
                    )}
                </div>
            </div>

            {/* Content Card */}
            <div
                key={step}
                className={step === 1 ? "glass-premium scale-in" : "glass-premium flip-enter"}
                style={{
                    padding: 'var(--spacing-lg)',
                    borderRadius: 'var(--radius-xl)',
                    width: '100%',
                    maxWidth: '340px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-md)',
                    minHeight: '280px',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-lg)'
                }}
            >
                {step === 1 ? (
                    <>
                        {/* Step 1: Concept */}
                        <div style={{
                            textAlign: 'left',
                            fontSize: '1rem',
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
                                    <strong style={{ color: '#8b5cf6' }}>Day 1</strong> = 1 Pushup
                                </p>
                                <p>
                                    <strong style={{ color: '#f093fb' }}>Day 365</strong> = 365 Pushups
                                </p>
                            </div>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Build <strong style={{ color: 'var(--text-primary)' }}>unstoppable discipline</strong> with small, incremental progress every single day.
                            </p>
                            <p style={{
                                marginTop: 'var(--spacing-sm)',
                                fontSize: '0.9rem',
                                fontStyle: 'italic',
                                color: '#8b5cf6'
                            }}>
                                💪 Consistency is your superpower.
                            </p>
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            className="gradient-button hover-lift"
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                borderRadius: 'var(--radius-lg)',
                                fontWeight: '600',
                                fontSize: '1.05rem',
                                marginTop: 'var(--spacing-sm)',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
                            }}
                        >
                            Let's Begin
                        </button>
                    </>
                ) : (
                    <>
                        {/* Step 2: Start Date */}
                        <div style={{ textAlign: 'left' }}>
                            <label style={{
                                fontSize: '1rem',
                                color: 'var(--text-primary)',
                                fontWeight: '600',
                                marginBottom: 'var(--spacing-xs)',
                                display: 'block'
                            }}>
                                📅 When did you start?
                            </label>
                            <p style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                marginBottom: 'var(--spacing-md)',
                                lineHeight: '1.5'
                            }}>
                                We'll auto-complete previous days for you<br />
                                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                    (limited to {currentYear} only)
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
                                cursor: 'pointer'
                            }}>
                                <Calendar size={22} style={{ color: '#8b5cf6', marginRight: '12px' }} />
                                <input
                                    type="date"
                                    value={date}
                                    min={`${currentYear}-01-01`}
                                    max={`${currentYear}-12-31`}
                                    onChange={(e) => setDate(e.target.value)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        fontSize: '1.05rem',
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
                        <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--spacing-sm)' }}>
                            <button
                                onClick={() => setStep(1)}
                                className="hover-lift"
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.08)',
                                    color: 'var(--text-secondary)',
                                    padding: 'var(--spacing-sm)',
                                    borderRadius: 'var(--radius-lg)',
                                    fontWeight: '600',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Back
                            </button>
                            <button
                                onClick={handleStart}
                                className="gradient-button hover-lift ripple"
                                style={{
                                    flex: 2,
                                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                    color: 'white',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    borderRadius: 'var(--radius-lg)',
                                    fontWeight: '700',
                                    fontSize: '1.1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    boxShadow: '0 6px 24px rgba(245, 87, 108, 0.5)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Start Challenge
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
                <div style={{
                    width: step === 1 ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: step === 1
                        ? 'linear-gradient(90deg, #667eea, #764ba2)'
                        : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.3s ease'
                }} />
                <div style={{
                    width: step === 2 ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: step === 2
                        ? 'linear-gradient(90deg, #f093fb, #f5576c)'
                        : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.3s ease'
                }} />
            </div>
        </div>
    );
}
