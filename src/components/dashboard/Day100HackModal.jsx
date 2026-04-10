import React, { useState, useEffect } from 'react';

/**
 * Day100HackModal — Terminal-style popup explaining the "hack" scenario.
 * Appears once on first load at Day 100.
 * Text types in line-by-line for dramatic effect.
 */

const TERMINAL_LINES = [
    { text: '> INTRUSION DÉTECTÉE...', delay: 0, color: '#ef4444' },
    { text: '> PARE-FEU : DÉSACTIVÉ', delay: 600, color: '#ef4444' },
    { text: '> CHIFFREMENT : COMPROMIS', delay: 1200, color: '#f97316' },
    { text: '', delay: 1600, color: '#666' },
    { text: '██████████████████████████████', delay: 1800, color: '#ef4444' },
    { text: '  ALERTE SÉCURITÉ — JOUR 100', delay: 2200, color: '#fbbf24' },
    { text: '██████████████████████████████', delay: 2600, color: '#ef4444' },
    { text: '', delay: 2800, color: '#666' },
    { text: 'L\'application a été piratée.', delay: 3200, color: '#e2e8f0' },
    { text: '', delay: 3400, color: '#666' },
    { text: 'Des étudiants en BUT Informatique', delay: 3800, color: '#e2e8f0' },
    { text: 'tentent de corriger les failles.', delay: 4400, color: '#e2e8f0' },
    { text: '', delay: 4800, color: '#666' },
    { text: 'Pour les aider, tu dois réaliser', delay: 5200, color: '#10b981' },
    { text: 'une JOURNÉE PARFAITE aujourd\'hui.', delay: 5800, color: '#10b981' },
    { text: '', delay: 6200, color: '#666' },
    { text: '> Complète TOUS tes exercices.', delay: 6600, color: '#0ea5e9' },
    { text: '> Le système sera restauré.', delay: 7200, color: '#0ea5e9' },
];

export function Day100HackModal({ onDismiss }) {
    const [visibleLines, setVisibleLines] = useState(0);
    const [showButton, setShowButton] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const timers = TERMINAL_LINES.map((line, i) =>
            setTimeout(() => setVisibleLines(i + 1), line.delay)
        );
        const buttonTimer = setTimeout(
            () => setShowButton(true),
            TERMINAL_LINES[TERMINAL_LINES.length - 1].delay + 800
        );
        return () => {
            timers.forEach(clearTimeout);
            clearTimeout(buttonTimer);
        };
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onDismiss, 500);
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0, 0, 0, 0.92)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 20000,
                padding: '20px',
                animation: isClosing ? 'hackModalOut 0.5s ease-out forwards' : 'hackModalIn 0.6s ease-out',
            }}
        >
            <div style={{
                width: '100%', maxWidth: '420px',
                background: 'rgba(10, 10, 15, 0.95)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 0 60px rgba(239, 68, 68, 0.15), 0 0 120px rgba(239, 68, 68, 0.05), inset 0 0 40px rgba(239, 68, 68, 0.03)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Scanline overlay on the modal itself */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
                    pointerEvents: 'none', zIndex: 1,
                }} />

                {/* Terminal header bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    marginBottom: '16px', paddingBottom: '10px',
                    borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
                }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f97316', opacity: 0.6 }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', opacity: 0.4 }} />
                    <span style={{
                        marginLeft: 'auto',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '11px',
                        color: 'rgba(239, 68, 68, 0.6)',
                        letterSpacing: '1px',
                    }}>
                        TERMINAL — BREACH.SH
                    </span>
                </div>

                {/* Terminal content */}
                <div style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: '13px',
                    lineHeight: '1.7',
                    position: 'relative',
                    zIndex: 2,
                    minHeight: '280px',
                }}>
                    {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
                        <div key={i} style={{
                            color: line.color,
                            animation: 'terminalLineIn 0.15s ease-out',
                            fontWeight: line.color === '#fbbf24' || line.color === '#10b981' ? '700' : '400',
                            textShadow: line.color === '#ef4444' ? '0 0 8px rgba(239,68,68,0.5)' : 'none',
                        }}>
                            {line.text || '\u00A0'}
                        </div>
                    ))}
                    {/* Blinking cursor */}
                    {!showButton && (
                        <span style={{
                            display: 'inline-block', width: '8px', height: '14px',
                            background: '#10b981',
                            animation: 'cursorBlink 0.8s steps(2) infinite',
                            verticalAlign: 'text-bottom', marginLeft: '2px',
                        }} />
                    )}
                </div>

                {/* Action button */}
                {showButton && (
                    <button
                        onClick={handleClose}
                        style={{
                            width: '100%', marginTop: '20px',
                            padding: '14px 24px',
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.08))',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            borderRadius: '10px',
                            color: '#ef4444',
                            fontFamily: "'Courier New', monospace",
                            fontSize: '14px', fontWeight: '700',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            animation: 'terminalBtnIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            textShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                            position: 'relative', zIndex: 2,
                            transition: 'all 0.2s ease',
                        }}
                    >
                        &gt; CORRIGER LES FAILLES
                    </button>
                )}
            </div>
        </div>
    );
}
