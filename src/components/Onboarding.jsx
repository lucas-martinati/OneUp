import { useState } from 'react';
import { Calendar, ArrowRight, Info } from 'lucide-react';

export function Onboarding({ onStart }) {
    const [step, setStep] = useState(1);
    const currentYear = new Date().getFullYear();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

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
            gap: 'var(--spacing-lg)'
        }}>
            <div style={{ maxWidth: '300px' }}>
                <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-xs)' }}>
                    OneUp
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {step === 1 ? "The Concept" : "Your Journey"}
                </p>
            </div>

            <div className="glass" style={{
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                maxWidth: '320px',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)',
                minHeight: '200px',
                justifyContent: 'center'
            }}>
                {step === 1 ? (
                    <>
                        <div style={{ textAlign: 'left', fontSize: '0.95rem', lineHeight: '1.6' }}>
                            <p style={{ marginBottom: '10px' }}><strong>Day 1 = 1 Pushup</strong></p>
                            <p style={{ marginBottom: '10px' }}><strong>Day 365 = 365 Pushups</strong></p>
                            <p>Build discipline with small, incremental progress. Consistency is key.</p>
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                padding: 'var(--spacing-sm)',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                                marginTop: '10px',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Next
                        </button>
                    </>
                ) : (
                    <>
                        <label style={{ textAlign: 'left', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            When did you start?
                        </label>
                        <p style={{ textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-10px' }}>
                            We'll auto-complete previous days for you, but only for {currentYear}.
                        </p>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(255,255,255,0.1)', // Lighter background for better contrast
                            padding: 'var(--spacing-sm)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            <Calendar size={20} style={{ color: 'var(--accent)', marginRight: '10px' }} />
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
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    width: '100%',
                                    outline: 'none',
                                    colorScheme: 'dark',
                                    cursor: 'pointer'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button
                                onClick={() => setStep(1)}
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    color: 'var(--text-secondary)',
                                    padding: 'var(--spacing-sm)',
                                    borderRadius: 'var(--radius-md)',
                                    fontWeight: '600',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer'
                                }}
                            >
                                Back
                            </button>
                            <button
                                onClick={handleStart}
                                style={{
                                    flex: 2,
                                    background: 'linear-gradient(135deg, var(--accent), var(--accent-glow))',
                                    color: 'white',
                                    padding: 'var(--spacing-sm)',
                                    borderRadius: 'var(--radius-md)',
                                    fontWeight: '600',
                                    fontSize: '1.1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    boxShadow: '0 4px 15px rgba(109, 40, 217, 0.4)',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Start <ArrowRight size={20} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
