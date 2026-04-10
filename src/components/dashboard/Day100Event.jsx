/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';

// ============================================================================
// 1. STYLES CSS (Injectés uniquement pour cet événement)
// ============================================================================
const Day100Styles = () => (
    <style dangerouslySetInnerHTML={{ __html: `
        /* ── Global wrapper: tints the entire dashboard ── */
        .day100-global {
          position: relative;
        }
        .day100-global::before {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at 30% 20%, rgba(239, 68, 68, 0.06) 0%, transparent 60%),
                      radial-gradient(ellipse at 70% 80%, rgba(14, 165, 233, 0.04) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
          animation: bgPulseHack 4s ease-in-out infinite alternate;
        }

        @keyframes bgPulseHack {
          0%   { opacity: 0.5; filter: hue-rotate(0deg); }
          50%  { opacity: 1;   filter: hue-rotate(10deg); }
          100% { opacity: 0.6; filter: hue-rotate(-5deg); }
        }

        /* ── CRT Scanlines overlay ── */
        .day100-scanlines {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.08) 2px,
            rgba(0, 0, 0, 0.08) 4px
          );
          animation: scanlineScroll 8s linear infinite;
        }

        @keyframes scanlineScroll {
          0%   { background-position: 0 0; }
          100% { background-position: 0 100vh; }
        }

        /* ── Horizontal glitch bars ── */
        .day100-glitch-bar-1, .day100-glitch-bar-2, .day100-glitch-bar-3 {
          position: fixed;
          left: 0;
          right: 0;
          height: 3px;
          pointer-events: none;
          z-index: 9998;
          background: linear-gradient(90deg, transparent 5%, rgba(239, 68, 68, 0.6) 15%, rgba(14, 165, 233, 0.4) 50%, rgba(239, 68, 68, 0.5) 85%, transparent 95%);
          mix-blend-mode: screen;
        }
        .day100-glitch-bar-1 { animation: glitchBar1 3.5s infinite; }
        .day100-glitch-bar-2 { animation: glitchBar2 4.2s infinite 0.8s; }
        .day100-glitch-bar-3 { animation: glitchBar3 2.8s infinite 1.5s; }

        @keyframes glitchBar1 {
          0%, 85%, 100% { opacity: 0; top: 20%; }
          87% { opacity: 1; top: 20%; }
          90% { opacity: 1; top: 22%; height: 2px; }
          93% { opacity: 0; top: 25%; }
        }
        @keyframes glitchBar2 {
          0%, 78%, 100% { opacity: 0; top: 55%; }
          80% { opacity: 1; top: 55%; }
          83% { opacity: 0.8; top: 58%; height: 4px; }
          86% { opacity: 0; top: 60%; }
        }
        @keyframes glitchBar3 {
          0%, 90%, 100% { opacity: 0; top: 75%; }
          92% { opacity: 1; top: 75%; height: 1px; }
          95% { opacity: 0.6; top: 78%; height: 6px; }
          97% { opacity: 0; top: 80%; }
        }

        /* ── Matrix rain columns ── */
        .day100-matrix-rain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .day100-matrix-col {
          position: absolute;
          top: -100%;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 14px;
          color: rgba(16, 185, 129, 0.35);
          text-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
          writing-mode: vertical-rl;
          white-space: nowrap;
          animation: matrixFall linear infinite;
          user-select: none;
        }

        @keyframes matrixFall {
          0%   { transform: translateY(0); }
          100% { transform: translateY(250vh); }
        }

        /* ── Glitch background for slides ── */
        .dashboard-glitch-bg {
          background: radial-gradient(circle at center, rgba(239, 68, 68, 0.06) 0%, transparent 70%);
          position: relative;
        }

        /* ── Main glitch text (the "100" number) ── */
        .glitch-text {
          color: #ef4444;
          text-shadow: 3px 3px #0ea5e9, -3px -3px #10b981;
          animation: textGlitch 0.5s steps(2) infinite;
          position: relative;
          font-family: 'Courier New', monospace;
          letter-spacing: 4px;
        }
        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          font-size: inherit;
          font-weight: inherit;
          line-height: inherit;
        }
        .glitch-text::before {
          color: #0ea5e9;
          animation: glitchClip1 2s steps(3) infinite;
          clip-path: inset(0 0 60% 0);
          transform: translate(-4px, -2px);
        }
        .glitch-text::after {
          color: #10b981;
          animation: glitchClip2 2.5s steps(3) infinite 0.3s;
          clip-path: inset(40% 0 0 0);
          transform: translate(4px, 2px);
        }

        @keyframes textGlitch {
          0%  { transform: translate(0); text-shadow: 3px 3px #0ea5e9, -3px -3px #10b981; }
          20% { transform: translate(-4px, 3px); text-shadow: -3px 3px #0ea5e9, 3px -3px #10b981; }
          40% { transform: translate(4px, -2px); text-shadow: 4px -3px #0ea5e9, -4px 3px #10b981; }
          60% { transform: translate(-2px, -4px) skewX(4deg); text-shadow: 2px 2px #0ea5e9, -2px -2px #10b981; opacity: 0.85; }
          80% { transform: translate(3px, 4px) skewX(-2deg); text-shadow: -3px 3px #0ea5e9, 3px -3px #10b981; opacity: 1; }
          100%{ transform: translate(0); text-shadow: 3px 3px #0ea5e9, -3px -3px #10b981; }
        }

        @keyframes glitchClip1 {
          0%   { clip-path: inset(0 0 80% 0); transform: translate(-4px, -2px); }
          25%  { clip-path: inset(20% 0 50% 0); transform: translate(3px, 1px); }
          50%  { clip-path: inset(50% 0 20% 0); transform: translate(-2px, 3px); }
          75%  { clip-path: inset(10% 0 70% 0); transform: translate(4px, -1px); }
          100% { clip-path: inset(0 0 80% 0); transform: translate(-4px, -2px); }
        }
        @keyframes glitchClip2 {
          0%   { clip-path: inset(60% 0 0 0); transform: translate(4px, 2px); }
          25%  { clip-path: inset(30% 0 40% 0); transform: translate(-3px, -1px); }
          50%  { clip-path: inset(70% 0 10% 0); transform: translate(2px, -3px); }
          75%  { clip-path: inset(45% 0 25% 0); transform: translate(-4px, 1px); }
          100% { clip-path: inset(60% 0 0 0); transform: translate(4px, 2px); }
        }

        /* ── "SYSTEM_OVERRIDE" title ── */
        .hacked-title {
          color: #ef4444 !important;
          font-family: 'Courier New', monospace;
          text-transform: uppercase;
          letter-spacing: 6px !important;
          text-shadow: 0 0 12px rgba(239, 68, 68, 0.9), 0 0 40px rgba(239, 68, 68, 0.3) !important;
          animation: blinkHack 2s steps(8) infinite;
        }

        @keyframes blinkHack {
          0%, 100% { opacity: 1; }
          45% { opacity: 0.7; }
          50% { opacity: 0.1; }
          52% { opacity: 1; }
          55% { opacity: 0.3; }
          58% { opacity: 1; }
          80% { opacity: 0.9; }
          82% { opacity: 0.15; }
          85% { opacity: 1; }
        }

        /* ── Central button hacked style ── */
        .hacked-button {
          border: 2.5px solid #ef4444 !important;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.5), 0 0 60px rgba(239, 68, 68, 0.15), inset 0 0 15px rgba(239, 68, 68, 0.25) !important;
          animation: buttonGlitch 3s infinite !important;
        }

        @keyframes buttonGlitch {
          0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5), 0 0 60px rgba(239, 68, 68, 0.15), inset 0 0 15px rgba(239, 68, 68, 0.25); transform: scale(1); }
          88% { transform: scale(1) translate(0); }
          90% { transform: scale(1.03) translate(3px, -2px); box-shadow: 0 0 35px rgba(239, 68, 68, 0.8), 0 0 80px rgba(239, 68, 68, 0.25); }
          92% { transform: scale(0.97) translate(-4px, 3px); box-shadow: 0 0 10px rgba(14, 165, 233, 0.5); }
          94% { transform: scale(1.02) translate(2px, 2px); box-shadow: 0 0 25px rgba(239, 68, 68, 0.6); }
          96% { transform: scale(1) translate(-1px, -1px); box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
        }

        /* ── Hacked header style ── */
        .day100-header {
          border-color: rgba(239, 68, 68, 0.3) !important;
          background: rgba(239, 68, 68, 0.04) !important;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.1), inset 0 0 30px rgba(239, 68, 68, 0.03) !important;
          animation: headerFlicker 4s infinite;
        }

        @keyframes headerFlicker {
          0%, 100% { border-color: rgba(239, 68, 68, 0.3); }
          48% { border-color: rgba(239, 68, 68, 0.3); }
          50% { border-color: rgba(14, 165, 233, 0.5); box-shadow: 0 0 20px rgba(14, 165, 233, 0.15); }
          52% { border-color: rgba(239, 68, 68, 0.3); }
          75% { border-color: rgba(239, 68, 68, 0.3); }
          76% { border-color: rgba(16, 185, 129, 0.4); }
          78% { border-color: rgba(239, 68, 68, 0.3); }
        }

        /* ── Hacked exercise buttons ── */
        .day100-exercise-btn {
          border-color: rgba(239, 68, 68, 0.4) !important;
          background: rgba(239, 68, 68, 0.06) !important;
          font-family: 'Courier New', monospace !important;
        }
        .day100-exercise-btn > * {
          animation: exBtnCorrupt 4s steps(5) infinite;
        }
        @keyframes exBtnCorrupt {
          0%, 90%, 100% { filter: none; }
          92% { filter: hue-rotate(90deg) brightness(1.5); }
          94% { filter: hue-rotate(-90deg) contrast(1.3); }
          96% { filter: invert(1); }
          98% { filter: hue-rotate(180deg); }
        }

        /* ── Hacked bottom actions bar ── */
        .day100-actions button {
          border: 1px solid rgba(239, 68, 68, 0.3) !important;
          background: rgba(239, 68, 68, 0.08) !important;
          font-family: 'Courier New', monospace !important;
          color: #ef4444 !important;
          text-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
        }

        /* ── Floating hacked messages ── */
        .day100-msg {
          position: fixed;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          font-weight: 700;
          color: rgba(239, 68, 68, 0.6);
          text-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
          pointer-events: none;
          z-index: 9997;
          white-space: nowrap;
          animation: msgFloat 6s ease-in-out infinite;
        }

        @keyframes msgFloat {
          0%   { opacity: 0; transform: translateX(-20px); }
          10%  { opacity: 0.8; }
          50%  { opacity: 0.6; transform: translateX(10px); }
          90%  { opacity: 0.3; }
          100% { opacity: 0; transform: translateX(30px); }
        }

        /* ── Screen-wide flicker effect ── */
        .day100-flicker {
          animation: screenFlicker 8s infinite;
        }

        @keyframes screenFlicker {
          0%, 100% { opacity: 1; }
          92%  { opacity: 1; }
          93%  { opacity: 0.6; }
          93.5%{ opacity: 1; }
          96%  { opacity: 1; }
          96.5%{ opacity: 0.3; }
          97%  { opacity: 0.9; }
          97.5%{ opacity: 1; }
        }

        /* ── Progress ring override for Day 100 ── */
        .day100-ring circle {
          stroke: #ef4444 !important;
          filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.5));
        }

        /* ── Vignette corners (dark burn) ── */
        .day100-vignette {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9996;
          background: radial-gradient(ellipse at center, transparent 50%, rgba(0, 0, 0, 0.4) 100%);
        }

        /* ── Day 100 Hack Modal animations ── */
        @keyframes hackModalIn {
          0%   { opacity: 0; }
          30%  { opacity: 0.3; }
          32%  { opacity: 0; }
          35%  { opacity: 0.6; }
          37%  { opacity: 0.1; }
          40%  { opacity: 1; }
          100% { opacity: 1; }
        }
        @keyframes hackModalOut {
          0%   { opacity: 1; filter: none; }
          30%  { opacity: 0.8; filter: hue-rotate(40deg) brightness(1.5); }
          60%  { opacity: 0.3; filter: hue-rotate(90deg) brightness(2); }
          100% { opacity: 0; filter: hue-rotate(180deg) brightness(3); }
        }
        @keyframes terminalLineIn {
          0%   { opacity: 0; transform: translateX(-8px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes terminalBtnIn {
          0%   { opacity: 0; transform: translateY(10px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* ── Day 100 Unhack (System Restored) animations ── */
        @keyframes unhackGlitchBurst {
          0%  { opacity: 0; }
          15% { opacity: 1; transform: translateX(5px); }
          25% { opacity: 0.3; transform: translateX(-8px); }
          40% { opacity: 0.8; transform: translateX(3px) skewX(2deg); }
          55% { opacity: 0.2; transform: translateX(-4px) skewX(-3deg); }
          70% { opacity: 0.9; transform: translateX(6px); }
          85% { opacity: 0.4; transform: translateX(-2px); }
          100%{ opacity: 0; transform: translateX(0); }
        }
        @keyframes whiteFlash {
          0%   { opacity: 0.9; }
          100% { opacity: 0; }
        }
        @keyframes restoredReveal {
          0%   { opacity: 0; transform: scale(0.3) translateY(30px); filter: blur(10px); }
          60%  { opacity: 1; transform: scale(1.08) translateY(-5px); filter: blur(0); }
          100% { transform: scale(1) translateY(0); filter: blur(0); }
        }
        @keyframes unhackFadeOut {
          0%   { opacity: 1; }
          70%  { opacity: 1; }
          100% { opacity: 0; }
        }

        /* ── Smooth unhack transition on dashboard ── */
        .day100-unhacking {
          animation: unhackCleanup 1.5s ease-out forwards;
        }
        @keyframes unhackCleanup {
          0%   { filter: hue-rotate(0deg) saturate(1); }
          50%  { filter: hue-rotate(30deg) saturate(1.5) brightness(1.1); }
          100% { filter: none; }
        }
    `}} />
);


// ============================================================================
// 2. HOOK LOGIQUE PRINCIPAL
// ============================================================================
export function useDay100Logic(dayNumber, isDayPerfectStandard) {
    const isDay100 = dayNumber === 100;
    
    const [day100ModalShown, setDay100ModalShown] = useState(
        () => isDay100 && !!sessionStorage.getItem('day100_modal_shown')
    );
    const [day100Unhacked, setDay100Unhacked] = useState(
        () => isDay100 && !!localStorage.getItem('day100_unhacked')
    );
    const [showUnhackAnim, setShowUnhackAnim] = useState(false);

    // If stats load and indicate perfect day BEFORE the modal is dismissed,
    // it implies it was completed in a previous session. Mark it unhacked silently.
    useEffect(() => {
        if (isDay100 && isDayPerfectStandard && !day100Unhacked && !day100ModalShown) {
            setTimeout(() => {
                setDay100Unhacked(true);
                localStorage.setItem('day100_unhacked', '1');
            }, 0);
        }
    }, [isDay100, isDayPerfectStandard, day100ModalShown, day100Unhacked]);

    // The modal should be shown if it's day 100, we haven't unhacked, and it hasn't been shown in this session
    // We already evaluated sessionStorage in useState, so day100ModalShown accurately tracks it for this session.
    const showDay100Modal = isDay100 && !day100ModalShown && !day100Unhacked;

    // The hack is active when: it's day 100, modal has been dismissed, and not yet unhacked
    const hackActive = isDay100 && day100ModalShown && !day100Unhacked && !showUnhackAnim;

    const handleDay100ModalDismiss = useCallback(() => {
        setDay100ModalShown(true);
        sessionStorage.setItem('day100_modal_shown', '1');
    }, []);

    const perfectDayCompletedRef = useRef(false);
    useEffect(() => {
        if (!hackActive || !isDayPerfectStandard || perfectDayCompletedRef.current) return;
        perfectDayCompletedRef.current = true;
        let cancelled = false;
        queueMicrotask(() => {
            if (!cancelled) {
                setShowUnhackAnim(true);
            }
        });
        return () => { cancelled = true; };
    }, [hackActive, isDayPerfectStandard]);

    const handleUnhackComplete = useCallback(() => {
        setShowUnhackAnim(false);
        setDay100Unhacked(true);
        localStorage.setItem('day100_unhacked', '1');
    }, []);

    return {
        isDay100,
        hackActive,
        showDay100Modal,
        showUnhackAnim,
        day100Unhacked,
        handleDay100ModalDismiss,
        handleUnhackComplete
    };
}


// ============================================================================
// 3. OVERLAY DASHBOARD HACKÉ
// ============================================================================
const MATRIX_CHARS = '01アイウエオカキクケコABCDEF0123456789';
const HACKED_MSGS = [
    '> ACCESS_GRANTED',
    'BREACH DETECTED ███',
    '// 100 DAYS — NO MERCY',
    'SYS_OVERRIDE: 0x64',
    '█▓▒░ HACK COMPLETE ░▒▓█',
    'FIREWALL BYPASSED',
    '> rm -rf weakness/',
    'ENCRYPTION: NONE',
    '100_DAYS.exe RUNNING...',
    'WARNING: UNSTOPPABLE',
    'PROTOCOL: BEAST_MODE',
    '> sudo unlock --power',
];

const seeded = (i, salt = 0) => {
    const x = Math.sin((i + 1) * 9301 + salt * 4957) * 49297;
    return x - Math.floor(x);
};

const generateMatrixStr = (len, seed) => {
    let s = '';
    for (let j = 0; j < len; j++) {
        s += MATRIX_CHARS[Math.floor(seeded(j, seed) * MATRIX_CHARS.length)];
    }
    return s;
};

const MATRIX_COLS = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: `${(i / 18) * 100 + seeded(i, 1) * 4}%`,
    text: generateMatrixStr(40 + Math.floor(seeded(i, 2) * 30), i),
    duration: `${8 + seeded(i, 3) * 12}s`,
    delay: `${seeded(i, 4) * 8}s`,
    opacity: 0.15 + seeded(i, 5) * 0.25,
    fontSize: `${10 + Math.floor(seeded(i, 6) * 4)}px`,
}));

const FLOATING_MSGS = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    text: HACKED_MSGS[i % HACKED_MSGS.length],
    top: `${12 + (i * 14) + seeded(i, 7) * 5}%`,
    left: `${5 + seeded(i, 8) * 60}%`,
    delay: `${i * 1.5 + seeded(i, 9) * 2}s`,
    animDuration: `${5 + seeded(i, 10) * 4}s`,
}));

export const Day100Overlay = memo(() => {
    return (
        <>
            <Day100Styles />
            {/* Matrix rain */}
            <div className="day100-matrix-rain" aria-hidden="true">
                {MATRIX_COLS.map(col => (
                    <div
                        key={col.id}
                        className="day100-matrix-col"
                        style={{
                            left: col.left,
                            animationDuration: col.duration,
                            animationDelay: col.delay,
                            opacity: col.opacity,
                            fontSize: col.fontSize,
                        }}
                    >
                        {col.text}
                    </div>
                ))}
            </div>

            {/* Dark vignette */}
            <div className="day100-vignette" aria-hidden="true" />

            {/* Floating hacked messages */}
            {FLOATING_MSGS.map(msg => (
                <div
                    key={msg.id}
                    className="day100-msg"
                    style={{
                        top: msg.top,
                        left: msg.left,
                        animationDelay: msg.delay,
                        animationDuration: msg.animDuration,
                    }}
                >
                    {msg.text}
                </div>
            ))}

            {/* Horizontal glitch bars */}
            <div className="day100-glitch-bar-1" aria-hidden="true" />
            <div className="day100-glitch-bar-2" aria-hidden="true" />
            <div className="day100-glitch-bar-3" aria-hidden="true" />

            {/* CRT scanlines */}
            <div className="day100-scanlines" aria-hidden="true" />
        </>
    );
});


// ============================================================================
// 4. MODAL D'INFORMATION TERMINAL
// ============================================================================
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
            <Day100Styles />
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
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
                    pointerEvents: 'none', zIndex: 1,
                }} />
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
                    {!showButton && (
                        <span style={{
                            display: 'inline-block', width: '8px', height: '14px',
                            background: '#10b981',
                            animation: 'cursorBlink 0.8s steps(2) infinite',
                            verticalAlign: 'text-bottom', marginLeft: '2px',
                        }} />
                    )}
                </div>
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

// ============================================================================
// 5. ANIMATION SPECTACULAIRE DE RÉSOLUTION
// ============================================================================
const PHASE_DURATIONS = {
    blackout: 1000,
    patching: 2000,
    progress: 2000,
    restored: 1500,
    celebration: 2000,
};

const TOTAL_DURATION = Object.values(PHASE_DURATIONS).reduce((a, b) => a + b, 0);

const PARTICLES = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    angle: seeded(i, 1) * 360,
    distance: 30 + seeded(i, 2) * 60,
    size: 4 + seeded(i, 3) * 8,
    color: ['#10b981', '#0ea5e9', '#fbbf24', '#8b5cf6', '#ec4899', '#6366f1'][Math.floor(seeded(i, 4) * 6)],
    duration: 1200 + seeded(i, 5) * 1000,
    delay: seeded(i, 6) * 400,
    shape: Math.floor(seeded(i, 7) * 3),
}));

export function Day100UnhackAnimation({ onComplete }) {
    const [phase, setPhase] = useState('blackout');
    const [progressPct, setProgressPct] = useState(0);

    useEffect(() => {
        const t1 = setTimeout(() => setPhase('patching'), PHASE_DURATIONS.blackout);
        const t2 = setTimeout(() => setPhase('progress'), PHASE_DURATIONS.blackout + PHASE_DURATIONS.patching);
        const t3 = setTimeout(() => setPhase('restored'), PHASE_DURATIONS.blackout + PHASE_DURATIONS.patching + PHASE_DURATIONS.progress);
        const t4 = setTimeout(() => setPhase('celebration'), PHASE_DURATIONS.blackout + PHASE_DURATIONS.patching + PHASE_DURATIONS.progress + PHASE_DURATIONS.restored);
        const t5 = setTimeout(onComplete, TOTAL_DURATION);
        return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
    }, [onComplete]);

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
            <Day100Styles />
            {phase === 'blackout' && (
                <div style={{
                    position: 'absolute', inset: 0,
                    animation: 'unhackGlitchBurst 1s steps(4) forwards',
                    background: 'linear-gradient(180deg, transparent 30%, rgba(239,68,68,0.15) 50%, transparent 70%)',
                }} />
            )}

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

            {showProgress && (
                <div style={{
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

            {showRestored && (
                <>
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
                                '--grav': 30 + seeded(p.id, 8) * 50,
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
