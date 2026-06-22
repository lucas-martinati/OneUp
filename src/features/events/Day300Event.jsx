/**
 * Day300Event — Événement spécial du Jour 300.
 *
 * ⚠️  CE FICHIER EST VOLONTAIREMENT MONOLITHIQUE (plug & play : un seul import).
 *
 * Thème : ASCENSION COSMIQUE — ciel de nuit profond, nébuleuse, aurores,
 * étoiles filantes, une comète qui s'élève. Volontairement TRÈS différent du
 * Jour 100 (glitch rouge) et du Jour 200 (plage / coucher de soleil).
 *
 * ✦ MÉCANIQUE INÉDITE ✦
 * Pas de « journée parfaite » ici. Le défi du Jour 300, c'est un COMPTEUR DE
 * RÉPÉTITIONS : il faut cumuler REP_GOAL répétitions dans la journée (tous
 * exercices confondus). Une jauge-fusée verticale se remplit en temps réel à
 * mesure que tu enchaînes les reps ; à 300, la fusée décolle, le ciel s'embrase,
 * et l'event se termine. C'est l'action réelle (faire des reps) qui le résout.
 */
import React, { useState, useEffect, memo } from 'react';
import { EXERCISES } from '@config/exercises';
import { makeEventManager, seeded } from './eventEngine';

// Objectif de répétitions à cumuler dans la journée pour relever le défi.
export const REP_GOAL = 3000;

// Total des reps du jour, tous exercices standard confondus.
const totalRepsToday = ({ today, getExerciseCount }) =>
    EXERCISES.reduce((sum, ex) => sum + (getExerciseCount(today, ex.id) || 0), 0);

// ============================================================================
// 1. STYLES CSS (Injectés uniquement pour cet événement)
// ============================================================================
const Day300Styles = () => (
    <style dangerouslySetInnerHTML={{ __html: `
        /* ── PALETTE "ASCENSION COSMIQUE" : indigo nuit + cyan + or ──
           On redéfinit les tokens du thème sur la racine de l'event. */
        .day300-global {
          position: relative;
          --accent: rgb(56, 189, 248) !important;            /* cyan */
          --accent-glow: rgb(125, 211, 252) !important;

          --bg-color: rgb(5, 6, 20) !important;
          --card-bg: rgba(18, 20, 48, 0.46) !important;
          --surface-elevated: linear-gradient(135deg, rgba(20, 22, 54, 0.62), rgba(30, 18, 60, 0.66)) !important;
          --surface-section: linear-gradient(135deg, rgba(20, 22, 54, 0.86), rgba(30, 18, 60, 0.90)) !important;
          --surface-subtle: rgba(125, 211, 252, 0.05) !important;
          --surface-muted: rgba(125, 211, 252, 0.09) !important;
          --surface-dim: rgba(129, 140, 248, 0.13) !important;
          --surface-hover: rgba(56, 189, 248, 0.15) !important;

          --border-subtle: rgba(129, 140, 248, 0.12) !important;
          --border-muted: rgba(129, 140, 248, 0.16) !important;
          --border-default: rgba(56, 189, 248, 0.26) !important;
          --border-strong: rgba(56, 189, 248, 0.45) !important;

          --overlay-bg: rgb(6, 7, 22) !important;
          --sheet-bg: rgba(12, 14, 36, 0.97) !important;
          --progress-track: rgba(129, 140, 248, 0.18) !important;

          --body-glow-1: rgba(56, 189, 248, 0.10) !important;
          --body-glow-2: rgba(168, 85, 247, 0.10) !important;

          --gradient-primary: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%) !important;
          --gradient-accent: linear-gradient(135deg, #38bdf8 0%, #a855f7 100%) !important;
          --gradient-glow: linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #fbbf24 100%) !important;
          --glow-primary: 0 0 20px rgba(56, 189, 248, 0.4) !important;
          --glow-accent: 0 0 25px rgba(129, 140, 248, 0.5) !important;
        }

        /* Nébuleuse de fond (douce, qui respire) */
        .day300-global::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse at 18% 22%, rgba(168, 85, 247, 0.18) 0%, transparent 50%),
            radial-gradient(ellipse at 82% 30%, rgba(56, 189, 248, 0.16) 0%, transparent 52%),
            radial-gradient(ellipse at 50% 88%, rgba(129, 140, 248, 0.14) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
          animation: d300Nebula 12s ease-in-out infinite alternate;
        }
        @keyframes d300Nebula {
          0%   { opacity: 0.6; transform: scale(1); }
          100% { opacity: 1;   transform: scale(1.08); }
        }

        /* ── Champ d'étoiles scintillantes ── */
        .d300-stars { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .d300-star {
          position: absolute;
          border-radius: 50%;
          background: #fff;
          animation: d300Twinkle ease-in-out infinite;
        }
        @keyframes d300Twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.7); }
          50%      { opacity: 1;   transform: scale(1.25); }
        }

        /* ── Aurores qui ondulent en haut ── */
        .d300-aurora {
          position: fixed; top: 0; left: -10%;
          width: 120%; height: clamp(140px, 30vh, 320px);
          pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 40% 100% at 30% 0%, rgba(56, 189, 248, 0.22) 0%, transparent 70%),
            radial-gradient(ellipse 45% 100% at 65% 0%, rgba(168, 85, 247, 0.20) 0%, transparent 70%),
            radial-gradient(ellipse 35% 100% at 50% 0%, rgba(45, 212, 191, 0.16) 0%, transparent 70%);
          filter: blur(8px);
          opacity: 0.8;
          animation: d300Aurora 14s ease-in-out infinite alternate;
        }
        @keyframes d300Aurora {
          0%   { transform: translateX(-4%) skewX(-4deg); opacity: 0.65; }
          100% { transform: translateX(4%)  skewX(4deg);  opacity: 0.95; }
        }

        /* ── Étoiles filantes ── */
        .d300-shooting {
          position: fixed; z-index: 0; pointer-events: none;
          width: 2px; height: 2px; border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 6px 1px rgba(255,255,255,0.9);
          animation: d300Shoot linear infinite;
        }
        .d300-shooting::after {
          content: ''; position: absolute; right: 0; top: 50%;
          width: 120px; height: 1px; transform: translateY(-50%);
          background: linear-gradient(90deg, rgba(255,255,255,0.8), transparent);
        }
        @keyframes d300Shoot {
          0%   { opacity: 0; transform: translate(0, 0) rotate(18deg); }
          8%   { opacity: 1; }
          100% { opacity: 0; transform: translate(60vw, 30vh) rotate(18deg); }
        }

        /* ── Fond des slides : voile cosmique ── */
        .day300-global .dashboard-slide-bg {
          background: radial-gradient(circle at 50% 24%, rgba(56, 189, 248, 0.08) 0%, transparent 64%) !important;
        }

        /* ── Le grand numéro du jour : chrome stellaire ── */
        .day300-global .day-number,
        .day300-global .day-number-anim {
          background: linear-gradient(135deg, #7dd3fc 0%, #818cf8 45%, #c084fc 70%, #fbbf24 100%) !important;
          background-size: 220% 220% !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          filter: drop-shadow(0 0 14px rgba(129, 140, 248, 0.55)) !important;
          animation: d300StarFlow 7s ease infinite !important;
        }
        @keyframes d300StarFlow {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* ── Label du jour : cyan stellaire ── */
        .day300-global .day-label {
          color: #7dd3fc !important;
          letter-spacing: 6px !important;
          text-shadow: 0 0 12px rgba(56, 189, 248, 0.8), 0 0 36px rgba(129, 140, 248, 0.4) !important;
        }
        .day300-global .day-label-text { font-size: 0 !important; }
        .day300-global .day-label-text::after {
          content: 'ASCENSION';
          font-size: var(--day-label-size, clamp(0.75rem, 1.6vh, 1rem));
        }

        /* ── Logo cosmique ── */
        .day300-global .app-logo-text {
          background: linear-gradient(135deg, #38bdf8, #818cf8, #fbbf24) !important;
          background-size: 200% 200% !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.45)) !important;
          animation: d300StarFlow 8s ease infinite !important;
        }
        .day300-global .app-logo-text::after { content: ' ✦'; font-size: 0.8em; }

        /* ── Bouton central : astre (le border est volontairement laissé à l'anneau) ── */
        .day300-global .counter-button {
          background: radial-gradient(circle at 50% 38%, rgba(129, 140, 248, 0.3), rgba(10, 12, 34, 0.5)) !important;
          box-shadow: 0 0 34px rgba(56, 189, 248, 0.5), inset 0 0 26px rgba(129, 140, 248, 0.4) !important;
          animation: counterBlobMorph 9s ease-in-out infinite, d300AstroPulse 4s ease-in-out infinite !important;
        }
        /* ── Anneau de progression de l'année : teinte cosmique ── */
        .day300-global .counter-ring {
          --ring-c1: #38bdf8 !important;
          --ring-c2: #818cf8 !important;
          --ring-track: rgba(129, 140, 248, 0.20) !important;
        }
        .day300-global .counter-button span {
          color: #e0f2fe !important;
          text-shadow: 0 0 12px rgba(56, 189, 248, 0.7) !important;
        }
        .day300-global .counter-button svg {
          color: #7dd3fc !important;
          filter: drop-shadow(0 0 6px rgba(56, 189, 248, 0.8)) !important;
        }
        @keyframes d300AstroPulse {
          0%, 100% { box-shadow: 0 0 30px rgba(56,189,248,0.45), inset 0 0 22px rgba(129,140,248,0.35); }
          50%      { box-shadow: 0 0 52px rgba(129,140,248,0.8), inset 0 0 36px rgba(56,189,248,0.6); }
        }

        /* ── Header : verre cosmique ── */
        .day300-global .dashboard-header {
          border-color: rgba(129, 140, 248, 0.3) !important;
          background: rgba(18, 20, 48, 0.20) !important;
          box-shadow: 0 0 18px rgba(56, 189, 248, 0.10), inset 0 0 30px rgba(129, 140, 248, 0.05) !important;
          backdrop-filter: blur(2px);
        }

        /* ── Tuiles d'exercices : plaques de vaisseau ── */
        .day300-global .exercise-button {
          border: 1px solid rgba(56, 189, 248, 0.35) !important;
          background: linear-gradient(160deg, rgba(18, 22, 52, 0.6), rgba(30, 18, 56, 0.45)) !important;
          box-shadow: inset 0 0 16px rgba(129, 140, 248, 0.12), 0 6px 14px rgba(0, 0, 0, 0.45) !important;
          border-radius: 14px !important;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease !important;
        }
        .day300-global .exercise-button:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 10px 22px rgba(56, 189, 248, 0.22), inset 0 0 22px rgba(129, 140, 248, 0.3) !important;
          border-color: rgba(56, 189, 248, 0.75) !important;
        }
        .day300-global .exercise-button span { color: #dbeafe !important; text-shadow: 0 1px 3px rgba(0,0,0,0.6) !important; }
        .day300-global .exercise-button span:last-of-type {
          color: #7dd3fc !important; font-weight: 800 !important;
          text-shadow: 0 0 8px rgba(56, 189, 248, 0.5) !important;
        }
        .day300-global .exercise-button > div:not(:last-child):not([class*="streak"]) {
          background: rgba(56, 189, 248, 0.12) !important;
          border: 1px solid rgba(129, 140, 248, 0.3) !important;
          border-radius: 10px !important;
        }
        .day300-global .exercise-button svg {
          color: #7dd3fc !important; stroke: #7dd3fc !important;
          filter: drop-shadow(0 0 3px rgba(56, 189, 248, 0.6)) !important;
        }
        .day300-global .exercise-button > div:last-child { background: rgba(0, 0, 0, 0.4) !important; }
        .day300-global .exercise-button > div:last-child > div {
          background: linear-gradient(90deg, #818cf8, #38bdf8) !important;
          box-shadow: 0 0 8px rgba(56, 189, 248, 0.6) !important;
        }

        /* ── Barre de navigation ── */
        .day300-global .dashboard-nav-bar {
          background: rgba(18, 20, 48, 0.32) !important;
          border-color: rgba(56, 189, 248, 0.28) !important;
          box-shadow: 0 -2px 16px rgba(129, 140, 248, 0.12), 0 4px 14px rgba(0, 0, 0, 0.35) !important;
        }
        .day300-global .dashboard-nav-bar button { color: #7dd3fc !important; }
        .day300-global .dashboard-nav-bar button span { color: #bae6fd !important; text-shadow: 0 1px 2px rgba(0,0,0,0.55) !important; }
        .day300-global .dashboard-nav-bar button:active { color: #e0f2fe !important; background: rgba(56, 189, 248, 0.14) !important; }

        .day300-global .progress-ring-svg { filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.55)) !important; }
        .day300-global .progress-ring-svg circle { stroke: #38bdf8 !important; }

        /* ── ✦ JAUGE-FUSÉE verticale (mécanique) ── */
        .d300-gauge {
          position: fixed;
          right: clamp(8px, 2.5vw, 22px);
          top: 50%;
          transform: translateY(-50%);
          z-index: 9995;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          pointer-events: none;
          animation: d300GaugeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .d300-gauge-track {
          position: relative;
          width: clamp(26px, 6vw, 34px);
          height: clamp(150px, 40vh, 300px);
          border-radius: 999px;
          background: rgba(6, 8, 24, 0.7);
          border: 1px solid rgba(129, 140, 248, 0.3);
          box-shadow: inset 0 0 18px rgba(56, 189, 248, 0.15), 0 6px 18px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }
        .d300-gauge-fill {
          position: absolute;
          left: 0; right: 0; bottom: 0;
          border-radius: 999px;
          background: linear-gradient(180deg, #38bdf8 0%, #818cf8 55%, #c084fc 100%);
          box-shadow: 0 0 16px rgba(56, 189, 248, 0.7);
          transition: height 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        }
        /* Graduations */
        .d300-gauge-tick {
          position: absolute; left: 0; right: 0;
          height: 1px; background: rgba(255, 255, 255, 0.12);
        }
        /* La fusée qui monte le long de la jauge */
        .d300-rocket {
          position: absolute;
          left: 50%;
          transform: translate(-50%, 50%);
          font-size: clamp(20px, 5vw, 28px);
          line-height: 1;
          filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.8));
          transition: bottom 0.5s cubic-bezier(0.22, 1, 0.36, 1);
          animation: d300RocketBob 2.2s ease-in-out infinite;
        }
        @keyframes d300RocketBob {
          0%, 100% { margin-left: -1px; }
          50%      { margin-left: 1px; }
        }
        .d300-gauge-readout {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 12px; font-weight: 800;
          color: #e0f2fe;
          text-shadow: 0 0 10px rgba(56, 189, 248, 0.6);
          letter-spacing: 0.5px;
          white-space: nowrap;
        }
        .d300-gauge-readout small { color: #7dd3fc; font-weight: 600; }
        .d300-gauge-cap {
          font-size: 18px; line-height: 1;
          filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.8));
        }
        @keyframes d300GaugeIn {
          0%   { opacity: 0; transform: translateY(-50%) translateX(30px); }
          100% { opacity: 1; transform: translateY(-50%) translateX(0); }
        }

        /* ── Carte d'accueil (splash cinématique, PAS un terminal) ── */
        @keyframes d300SplashIn  { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes d300SplashOut { 0% { opacity: 1; } 100% { opacity: 0; transform: scale(1.05); } }
        @keyframes d300BigNum {
          0%   { opacity: 0; transform: scale(0.4) translateY(20px); filter: blur(14px); letter-spacing: 30px; }
          60%  { opacity: 1; transform: scale(1.08) translateY(-4px); filter: blur(0); letter-spacing: 6px; }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); letter-spacing: 6px; }
        }
        @keyframes d300Rise {
          0%   { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes d300CardOrbit {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* ── Récompense : décollage + supernova ── */
        @keyframes d300Launch {
          0%   { transform: translate(-50%, 0) scale(1); opacity: 1; }
          70%  { transform: translate(-50%, -60vh) scale(1.1); opacity: 1; }
          100% { transform: translate(-50%, -120vh) scale(0.6); opacity: 0; }
        }
        @keyframes d300Trail {
          0%   { opacity: 0; height: 0; }
          30%  { opacity: 0.9; }
          100% { opacity: 0; height: 120vh; }
        }
        @keyframes d300Supernova {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0); }
          40%  { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(3.2); }
        }
        @keyframes d300RewardReveal {
          0%   { opacity: 0; transform: scale(0.5) translateY(24px); filter: blur(10px); }
          60%  { opacity: 1; transform: scale(1.06) translateY(-4px); filter: blur(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        @keyframes d300RewardFade {
          0% { opacity: 1; } 72% { opacity: 1; } 100% { opacity: 0; }
        }
        @keyframes d300Confetti {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(calc(var(--dx) * 1px), calc(var(--dy) * 1px + var(--grav) * 1px)) rotate(440deg); opacity: 0; }
        }

        /* ── Transition de sortie sur le dashboard ── */
        .day300-lifting { animation: d300Settle 1.5s ease-out forwards; }
        @keyframes d300Settle {
          0%   { filter: hue-rotate(0deg) brightness(1.1) saturate(1.3); }
          100% { filter: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .d300-star, .d300-shooting, .d300-aurora, .d300-rocket { animation: none !important; }
          .day300-global::before { animation: none !important; }
          .day300-global .day-number, .day300-global .day-number-anim,
          .day300-global .app-logo-text, .day300-global .counter-button { animation: none !important; }
        }
    `}} />
);


// ============================================================================
// 2. DÉCOR COSMIQUE (mémoïsé : ne se re-rend jamais quand la jauge avance)
// ============================================================================
const STARS = Array.from({ length: 70 }, (_, i) => ({
    id: i,
    left: `${seeded(i, 1) * 100}%`,
    top: `${seeded(i, 2) * 100}%`,
    size: `${1 + seeded(i, 3) * 2.5}px`,
    duration: `${2 + seeded(i, 4) * 4}s`,
    delay: `${seeded(i, 5) * 4}s`,
}));

const SHOOTERS = Array.from({ length: 3 }, (_, i) => ({
    id: i,
    left: `${10 + seeded(i, 6) * 50}%`,
    top: `${5 + seeded(i, 7) * 30}%`,
    duration: `${6 + seeded(i, 8) * 5}s`,
    delay: `${i * 4 + seeded(i, 9) * 6}s`,
}));

const Day300Decor = memo(() => (
    <>
        <div className="d300-aurora" aria-hidden="true" />
        <div className="d300-stars" aria-hidden="true">
            {STARS.map(s => (
                <div
                    key={s.id}
                    className="d300-star"
                    style={{
                        left: s.left, top: s.top, width: s.size, height: s.size,
                        animationDuration: s.duration, animationDelay: s.delay,
                    }}
                />
            ))}
        </div>
        {SHOOTERS.map(s => (
            <div
                key={s.id}
                className="d300-shooting"
                aria-hidden="true"
                style={{ left: s.left, top: s.top, animationDuration: s.duration, animationDelay: s.delay }}
            />
        ))}
    </>
));


// ============================================================================
// 3. JAUGE-FUSÉE : la mécanique vivante (reps → ascension)
// ============================================================================
const GAUGE_TICKS = [0.25, 0.5, 0.75];

function RocketGauge({ reps = 0, target = REP_GOAL, onSolve }) {
    const pct = Math.min(reps / target, 1);
    const reached = reps >= target;

    // Dès que l'objectif est atteint, on déclenche la récompense (une seule fois,
    // garanti par le verrou interne du moteur).
    useEffect(() => {
        if (reached) onSolve();
    }, [reached, onSolve]);

    return (
        <div className="d300-gauge">
            <div className="d300-gauge-cap" aria-hidden="true">✦</div>
            <div className="d300-gauge-track" role="progressbar" aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(reps, target)}>
                {GAUGE_TICKS.map(t => (
                    <div key={t} className="d300-gauge-tick" style={{ bottom: `${t * 100}%` }} />
                ))}
                <div className="d300-gauge-fill" style={{ height: `${pct * 100}%` }} />
                <div className="d300-rocket" aria-hidden="true" style={{ bottom: `${pct * 100}%` }}>🚀</div>
            </div>
            <div className="d300-gauge-readout">
                {Math.min(reps, target)}<small>/{target}</small>
            </div>
        </div>
    );
}

function Day300Overlay({ onSolve, reps, target }) {
    return (
        <>
            <Day300Styles />
            <Day300Decor />
            <RocketGauge reps={reps} target={target} onSolve={onSolve} />
        </>
    );
}


// ============================================================================
// 4. SPLASH D'ACCUEIL (cinématique — un grand "300", pas un terminal)
// ============================================================================
function Day300IntroModal({ onDismiss }) {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onDismiss, 450);
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                zIndex: 20000, padding: '24px', overflow: 'hidden',
                background: 'radial-gradient(ellipse at 50% 35%, #1a1140 0%, #070818 70%)',
                animation: isClosing ? 'd300SplashOut 0.45s ease-out forwards' : 'd300SplashIn 0.5s ease-out',
            }}
        >
            <Day300Styles />
            <Day300Decor />

            {/* Anneau orbital décoratif derrière le nombre */}
            <div aria-hidden="true" style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 'clamp(220px, 60vw, 340px)', height: 'clamp(220px, 60vw, 340px)',
                marginTop: '-30px',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                border: '1px solid rgba(129, 140, 248, 0.25)',
                boxShadow: '0 0 60px rgba(56, 189, 248, 0.15) inset',
                animation: 'd300CardOrbit 24s linear infinite',
            }}>
                <div style={{
                    position: 'absolute', top: '-5px', left: '50%', marginLeft: '-5px',
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: '#fbbf24', boxShadow: '0 0 12px #fbbf24',
                }} />
            </div>

            <div style={{ position: 'relative', textAlign: 'center', zIndex: 2 }}>
                <div style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: '13px', letterSpacing: '5px', fontWeight: 700,
                    textTransform: 'uppercase', color: '#7dd3fc',
                    textShadow: '0 0 14px rgba(56, 189, 248, 0.6)',
                    marginBottom: '6px',
                    animation: 'd300Rise 0.6s ease-out 0.2s both',
                }}>
                    Défi du Jour
                </div>

                <div style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 'clamp(5rem, 26vw, 11rem)',
                    fontWeight: 900, lineHeight: 0.9,
                    background: 'linear-gradient(135deg, #7dd3fc 0%, #818cf8 45%, #c084fc 70%, #fbbf24 100%)',
                    backgroundSize: '200% 200%',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 30px rgba(129, 140, 248, 0.5))',
                    animation: 'd300BigNum 1s cubic-bezier(0.22, 1, 0.36, 1) both, d300StarFlow 7s ease infinite',
                }}>
                    300
                </div>

                <div style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 'clamp(1rem, 4.5vw, 1.35rem)',
                    fontWeight: 700, color: '#e0f2fe',
                    marginTop: '8px',
                    animation: 'd300Rise 0.6s ease-out 0.7s both',
                }}>
                    {REP_GOAL} répétitions à conquérir
                </div>
                <div style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 'clamp(0.85rem, 3.4vw, 1rem)',
                    color: 'rgba(186, 230, 253, 0.75)', lineHeight: 1.5,
                    maxWidth: '320px', margin: '10px auto 0',
                    animation: 'd300Rise 0.6s ease-out 0.9s both',
                }}>
                    Cumule {REP_GOAL} reps aujourd'hui, tous exercices confondus.
                    La fusée s'élève à chaque effort — fais-la décoller. 🚀
                </div>

                <button
                    onClick={handleClose}
                    style={{
                        marginTop: '28px',
                        padding: '15px 34px',
                        background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                        border: 'none', borderRadius: '14px',
                        color: '#06121f',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: '15px', fontWeight: 900,
                        letterSpacing: '1px', cursor: 'pointer',
                        boxShadow: '0 10px 30px rgba(56, 189, 248, 0.45), 0 0 0 1px rgba(255,255,255,0.1) inset',
                        animation: 'd300Rise 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 1.1s both',
                    }}
                >
                    🚀 Lancer l'ascension
                </button>
            </div>
        </div>
    );
}


// ============================================================================
// 5. RÉCOMPENSE : décollage → supernova → "300 ATTEINT"
// ============================================================================
const REWARD_PHASES = { launch: 1500, nova: 1100, reveal: 1800, celebration: 2400 };
const REWARD_TOTAL = Object.values(REWARD_PHASES).reduce((a, b) => a + b, 0);

const REWARD_PARTICLES = Array.from({ length: 64 }, (_, i) => ({
    id: i,
    angle: seeded(i, 1) * 360,
    distance: 40 + seeded(i, 2) * 80,
    size: 5 + seeded(i, 3) * 9,
    color: ['#38bdf8', '#818cf8', '#c084fc', '#fbbf24', '#5eead4', '#fde68a'][Math.floor(seeded(i, 4) * 6)],
    duration: 1400 + seeded(i, 5) * 1100,
    delay: seeded(i, 6) * 400,
    grav: 30 + seeded(i, 7) * 60,
    shape: Math.floor(seeded(i, 8) * 3),
}));

function Day300RewardAnimation({ onComplete }) {
    const [phase, setPhase] = useState('launch');

    useEffect(() => {
        const { launch, nova, reveal } = REWARD_PHASES;
        const t1 = setTimeout(() => setPhase('nova'), launch);
        const t2 = setTimeout(() => setPhase('reveal'), launch + nova);
        const t3 = setTimeout(() => setPhase('celebration'), launch + nova + reveal);
        const t4 = setTimeout(onComplete, REWARD_TOTAL);
        return () => [t1, t2, t3, t4].forEach(clearTimeout);
    }, [onComplete]);

    const showNova = phase === 'nova' || phase === 'reveal' || phase === 'celebration';
    const showReveal = phase === 'reveal' || phase === 'celebration';
    const showCelebration = phase === 'celebration';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 30000,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            background: 'radial-gradient(ellipse at 50% 60%, #1a1140 0%, #050616 70%)',
            animation: showCelebration ? 'd300RewardFade 2.4s ease-out forwards' : undefined,
        }}>
            <Day300Styles />
            <Day300Decor />

            {phase === 'launch' && (
                <>
                    <div aria-hidden="true" style={{
                        position: 'absolute', left: '50%', bottom: '12%',
                        width: '3px', transform: 'translateX(-50%)',
                        background: 'linear-gradient(180deg, rgba(56,189,248,0.9), rgba(251,191,36,0.5), transparent)',
                        animation: 'd300Trail 1.5s ease-in forwards',
                    }} />
                    <div aria-hidden="true" style={{
                        position: 'absolute', left: '50%', bottom: '12%',
                        fontSize: 'clamp(48px, 12vw, 90px)', lineHeight: 1,
                        filter: 'drop-shadow(0 0 16px rgba(56,189,248,0.9))',
                        animation: 'd300Launch 1.5s ease-in forwards',
                    }}>
                        🚀
                    </div>
                </>
            )}

            {showNova && (
                <div aria-hidden="true" style={{
                    position: 'absolute', top: '46%', left: '50%',
                    width: 'clamp(140px, 36vw, 260px)', height: 'clamp(140px, 36vw, 260px)',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #ffffff 0%, #fde68a 25%, #38bdf8 55%, rgba(129,140,248,0) 72%)',
                    boxShadow: '0 0 120px rgba(56, 189, 248, 0.7)',
                    animation: 'd300Supernova 1.4s ease-out forwards',
                }} />
            )}

            {showReveal && (
                <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 20px' }}>
                    <div style={{
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: 'clamp(2rem, 9vw, 4.4rem)', fontWeight: 900, lineHeight: 1.05,
                        background: 'linear-gradient(135deg, #7dd3fc, #818cf8, #fbbf24)',
                        backgroundSize: '200% 200%',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 30px rgba(129, 140, 248, 0.6))',
                        animation: 'd300RewardReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), d300StarFlow 5s ease infinite',
                        letterSpacing: '2px',
                    }}>
                        300 ATTEINT
                    </div>
                    <div style={{
                        marginTop: '16px',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: 'clamp(0.9rem, 3.4vw, 1.2rem)',
                        color: 'rgba(224, 242, 254, 0.92)', fontWeight: 600,
                        animation: 'd300Rise 0.5s ease-out 0.5s both',
                    }}>
                        300 répétitions, le ciel est à toi. ✦🚀
                    </div>
                </div>
            )}

            {showCelebration && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {REWARD_PARTICLES.map(p => {
                        const rad = (p.angle * Math.PI) / 180;
                        const shapes = ['50%', '2px', '2px'];
                        const widths = [p.size, p.size, p.size * 0.5];
                        const heights = [p.size, p.size, p.size * 1.6];
                        return (
                            <div key={p.id} style={{
                                position: 'absolute', left: '50%', top: '46%',
                                width: widths[p.shape], height: heights[p.shape],
                                borderRadius: shapes[p.shape], background: p.color,
                                '--dx': Math.cos(rad) * p.distance,
                                '--dy': -Math.sin(rad) * p.distance,
                                '--grav': p.grav,
                                animation: `d300Confetti ${p.duration}ms forwards ${p.delay}ms`,
                                willChange: 'transform, opacity',
                            }} />
                        );
                    })}
                </div>
            )}
        </div>
    );
}


// ============================================================================
// 6. MANAGER D'ÉVÉNEMENT (PLUG & PLAY)
// ============================================================================
export const Day300EventManager = makeEventManager({
    isActive: ({ dayNumber }) => dayNumber === 300,
    introKey: 'day300_intro_shown',
    doneKey: 'day300_challenge_done',
    keepAmbianceAfterReward: false, // une fois le défi relevé, l'ambiance s'éteint
    autoReward: false,              // ✦ mécanique propre : c'est la jauge de reps qui résout
    activeClasses: ['day300-global'],
    doneClass: 'day300-lifting',
    // Avancée live du défi injectée dans l'Overlay (jauge-fusée).
    overlayProps: (ctx) => ({ reps: totalRepsToday(ctx), target: REP_GOAL }),
    Intro: Day300IntroModal,
    Overlay: Day300Overlay,
    Reward: Day300RewardAnimation,
});
