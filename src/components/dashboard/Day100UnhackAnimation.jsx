import React, { useState, useEffect, useRef } from 'react';

/**
 * Day100UnhackAnimation — Spectacular "system restored" full-screen takeover.
 * Plays when the user achieves a perfect day on Day 100.
 *
 * Sequence:
 *   1. Screen goes black with glitch burst (0–1s)
 *   2. "BREACH PATCHED" typed with green glow (1–3s)
 *   3. Progress bar fills up (3–5s)
 *   4. "SYSTEM RESTORED" big reveal with flash (5–6.5s)
 *   5. Particle explosion + fade out (6.5–8.5s)
 */

const PHASE_DURATIONS = {
    blackout: 1000,
    patching: 2000,
    progress: 2000,
    restored: 1500,
    celebration: 2000,
};

const TOTAL_DURATION = Object.values(PHASE_DURATIONS).reduce((a, b) => a + b, 0);

/** Seeded random for particles */
const srand = (i, salt = 0) => {
    const x = Math.sin((i + 1) * 9301 + salt * 4957) * 49297;
    return x - Math.floor(x);
};

const PARTICLES = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    angle: srand(i, 1) * 360,
    distance: 30 + srand(i, 2) * 60,
    size: 4 + srand(i, 3) * 8,
    color: ['#10b981', '#0ea5e9', '#fbbf24', '#8b5cf6', '#ec4899', '#6366f1'][Math.floor(srand(i, 4) * 6)],
    duration: 1200 + srand(i, 5) * 1000,
    delay: srand(i, 6) * 400,
    shape: Math.floor(srand(i, 7) * 3), // 0=circle, 1=square, 2=rect
}));

export function Day100UnhackAnimation({ onComplete }) {
    const [phase, setPhase] = useState('blackout');
    const [progressPct, setProgressPct] = useState(0);
    const progressRef = useRef(null);

    useEffect(() => {
        const t1 = setTimeout(() => setPhase('patching'), PHASE_DURATIONS.blackout);
        const t2 = setTimeout(() => setPhase('progress'), PHASE_DURATIONS.blackout + PHASE_DURATIONS.patching);
        const t3 = setTimeout(() => setPhase('restored'), PHASE_DURATIONS.blackout + PHASE_DURATIONS.patching + PHASE_DURATIONS.progress);
        const t4 = setTimeout(() => setPhase('celebration'), PHASE_DURATIONS.blackout + PHASE_DURATIONS.patching + PHASE_DURATIONS.progress + PHASE_DURATIONS.restored);
        const t5 = setTimeout(onComplete, TOTAL_DURATION);
        return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
    }, [onComplete]);

    // Animate progress bar
    useEffect(() => {
        if (phase !== 'progress') return;
        let start = null;
        let raf;
        const animate = (ts) => {
            if (!start) start = ts;
            const elapsed = ts - start;
            const pct = Math.min((elapsed / PHASE_DURATIONS.progress) * 100, 100);
            setProgressPct(pct);
            if (pct < 100) raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [phase]);

    const showPatching = phase === 'patching' || phase === 'progress' || phase === 'restored' || phase === 'celebration';
    const showProgress = phase === 'progress' || phase === 'restored' || phase === 'celebration';
    const showRestored = phase === 'restored' || phase === 'celebration';
    const showCelebration = phase === 'celebration';

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: '#000',
            zIndex: 30000,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            animation: showCelebration ? 'unhackFadeOut 2s ease-out forwards' : undefined,
        }}>
            {/* Initial glitch burst */}
            {phase === 'blackout' && (
                <div style={{
                    position: 'absolute', inset: 0,
                    animation: 'unhackGlitchBurst 1s steps(4) forwards',
                    background: 'linear-gradient(180deg, transparent 30%, rgba(239,68,68,0.15) 50%, transparent 70%)',
                }} />
            )}

            {/* "CORRECTION EN COURS..." */}
            {showPatching && (
                <div style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 'clamp(14px, 3.5vw, 18px)',
                    color: '#10b981',
                    textShadow: '0 0 15px rgba(16, 185, 129, 0.6), 0 0 40px rgba(16, 185, 129, 0.2)',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    animation: 'terminalLineIn 0.3s ease-out',
                    marginBottom: '24px',
                    textAlign: 'center',
                    padding: '0 20px',
                }}>
                    {phase === 'patching' ? '> CORRECTION DES FAILLES...' : '> FAILLES CORRIGÉES ✓'}
                </div>
            )}

            {/* Progress bar */}
            {showProgress && (
                <div ref={progressRef} style={{
                    width: 'min(80%, 320px)', height: '6px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '3px', overflow: 'hidden',
                    marginBottom: '32px',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                }}>
                    <div style={{
                        width: `${progressPct}%`,
                        height: '100%', borderRadius: '3px',
                        background: 'linear-gradient(90deg, #10b981, #0ea5e9)',
                        boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)',
                        transition: phase === 'progress' ? 'none' : 'width 0.3s',
                    }} />
                </div>
            )}

            {/* "SYSTEM RESTORED" big reveal */}
            {showRestored && (
                <>
                    {/* White flash */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'white',
                        animation: 'whiteFlash 0.6s ease-out forwards',
                        pointerEvents: 'none',
                    }} />

                    <div style={{
                        fontSize: 'clamp(2rem, 8vw, 4rem)',
                        fontWeight: '900',
                        fontFamily: "'Courier New', monospace",
                        background: 'linear-gradient(135deg, #10b981, #0ea5e9, #8b5cf6)',
                        backgroundSize: '200% 200%',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: 'restoredReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), rainbowFlow 4s ease infinite',
                        textShadow: 'none',
                        textAlign: 'center',
                        letterSpacing: '4px',
                        padding: '0 16px',
                    }}>
                        SYSTÈME<br />RESTAURÉ
                    </div>

                    <div style={{
                        marginTop: '16px',
                        fontSize: 'clamp(0.8rem, 3vw, 1.1rem)',
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily: "'Courier New', monospace",
                        textAlign: 'center',
                        animation: 'terminalLineIn 0.4s ease-out 0.5s both',
                    }}>
                        Merci, agent. Le Jour 100 est sécurisé. 🛡️
                    </div>
                </>
            )}

            {/* Celebration particles */}
            {showCelebration && (
                <div style={{
                    position: 'absolute', inset: 0,
                    pointerEvents: 'none',
                }}>
                    {PARTICLES.map(p => {
                        const rad = (p.angle * Math.PI) / 180;
                        const shapes = ['50%', '3px', '3px'];
                        const widths = [p.size, p.size, p.size * 0.5];
                        const heights = [p.size, p.size, p.size * 1.6];
                        return (
                            <div key={p.id} style={{
                                position: 'absolute',
                                left: '50%', top: '50%',
                                width: widths[p.shape],
                                height: heights[p.shape],
                                borderRadius: shapes[p.shape],
                                background: p.color,
                                '--dx': Math.cos(rad) * p.distance,
                                '--dy': -Math.sin(rad) * p.distance,
                                '--grav': 30 + srand(p.id, 8) * 50,
                                animation: `confettiBurst3D ${p.duration}ms forwards ${p.delay}ms`,
                                willChange: 'transform, opacity',
                            }} />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
