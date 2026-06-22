/**
 * Day200Event — Événement spécial du Jour 200.
 *
 * ⚠️  CE FICHIER EST VOLONTAIREMENT MONOLITHIQUE (plug & play : un seul import).
 *
 * Thème : CANICULE — il fait 42°C, le dashboard est une fournaise : soleil
 * aveuglant, air qui ondule (mirage), gouttes de sueur qui dégoulinent.
 * Volontairement à l'opposé du Jour 100 (glitch rouge) et du Jour 300 (cosmos).
 *
 * ✦ MÉCANIQUE + PRÉTEXTE ✦
 * Il fait une chaleur infernale : bouger c'est l'enfer, mais rester immobile
 * c'est pire (on fond). Le seul échappatoire : transpirer un bon coup pour
 * « activer la climatisation interne ». Concrètement, un THERMOMÈTRE géant est
 * au rouge ; chaque répétition de la journée te fait suer et fait DESCENDRE la
 * température. Quand le thermomètre atteint la zone fraîche (objectif de reps
 * atteint), l'orage éclate, la pluie tombe, la canicule est vaincue — event validé.
 */
import React, { useState, useEffect, memo } from 'react';
import { EXERCISES } from '@config/exercises';
import { makeEventManager, seeded } from './eventEngine';

// Reps à cumuler dans la journée pour faire tomber la température (et la pluie).
export const SWEAT_GOAL = 2000;

// Bornes de température affichées sur le thermomètre (chaud → frais).
const TEMP_HOT = 42;
const TEMP_COOL = 22;

// Total des reps du jour, tous exercices standard confondus.
const totalRepsToday = ({ today, getExerciseCount }) =>
    EXERCISES.reduce((sum, ex) => sum + (getExerciseCount(today, ex.id) || 0), 0);

const lerp = (a, b, t) => a + (b - a) * t;

// ============================================================================
// 1. STYLES CSS (Injectés uniquement pour cet événement)
// ============================================================================
const Day200Styles = () => (
    <style dangerouslySetInnerHTML={{ __html: `
        /* ── PALETTE "CANICULE" : fournaise ambre / orange / braise ── */
        .day200-global {
          position: relative;
          --accent: rgb(249, 115, 22) !important;
          --accent-glow: rgb(251, 191, 36) !important;

          --bg-color: rgb(20, 8, 3) !important;
          --card-bg: rgba(48, 18, 8, 0.42) !important;
          --surface-elevated: linear-gradient(135deg, rgba(54, 20, 8, 0.60), rgba(64, 26, 10, 0.64)) !important;
          --surface-section: linear-gradient(135deg, rgba(54, 20, 8, 0.85), rgba(64, 26, 10, 0.90)) !important;
          --surface-subtle: rgba(251, 146, 60, 0.06) !important;
          --surface-muted: rgba(251, 146, 60, 0.10) !important;
          --surface-dim: rgba(251, 191, 36, 0.13) !important;
          --surface-hover: rgba(249, 115, 22, 0.16) !important;

          --border-subtle: rgba(251, 146, 60, 0.14) !important;
          --border-muted: rgba(251, 146, 60, 0.18) !important;
          --border-default: rgba(249, 115, 22, 0.30) !important;
          --border-strong: rgba(249, 115, 22, 0.50) !important;

          --overlay-bg: rgb(22, 9, 4) !important;
          --sheet-bg: rgba(34, 14, 7, 0.96) !important;
          --progress-track: rgba(251, 146, 60, 0.18) !important;

          --body-glow-1: rgba(249, 115, 22, 0.14) !important;
          --body-glow-2: rgba(234, 88, 12, 0.10) !important;

          --gradient-primary: linear-gradient(135deg, #f97316 0%, #ef4444 100%) !important;
          --gradient-accent: linear-gradient(135deg, #fbbf24 0%, #f97316 100%) !important;
          --gradient-glow: linear-gradient(135deg, #fde047 0%, #f97316 50%, #ef4444 100%) !important;
          --glow-primary: 0 0 20px rgba(249, 115, 22, 0.45) !important;
          --glow-accent: 0 0 25px rgba(251, 191, 36, 0.5) !important;
        }

        /* Fournaise de fond qui palpite (vague de chaleur) */
        .day200-global::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse at 50% -8%, rgba(253, 224, 71, 0.30) 0%, transparent 52%),
            radial-gradient(ellipse at 50% 0%, rgba(249, 115, 22, 0.20) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 105%, rgba(234, 88, 12, 0.18) 0%, transparent 55%);
          pointer-events: none;
          z-index: 0;
          animation: d200Furnace 5s ease-in-out infinite alternate;
        }
        @keyframes d200Furnace {
          0%   { opacity: 0.7; }
          100% { opacity: 1; }
        }

        /* ── Soleil aveuglant ── */
        .d200-sun {
          position: fixed;
          top: clamp(-70px, -5vh, -30px);
          left: 50%;
          width: clamp(160px, 30vh, 280px);
          height: clamp(160px, 30vh, 280px);
          transform: translateX(-50%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(circle, #ffffff 0%, #fff7d6 24%, #fdba74 52%, #f97316 74%, rgba(249, 115, 22, 0) 100%);
          box-shadow: 0 0 90px rgba(253, 224, 71, 0.7), 0 0 200px rgba(249, 115, 22, 0.5);
          animation: d200SunBlaze 4s ease-in-out infinite alternate;
        }
        @keyframes d200SunBlaze {
          0%   { filter: brightness(1);    transform: translateX(-50%) scale(1); }
          100% { filter: brightness(1.18); transform: translateX(-50%) scale(1.05); }
        }

        /* ── Air qui ondule (mirage / heat haze) ── */
        .d200-haze {
          position: fixed; inset: 0;
          pointer-events: none; z-index: 0;
          background: repeating-linear-gradient(0deg,
            rgba(255, 237, 213, 0) 0px,
            rgba(255, 237, 213, 0.05) 2px,
            rgba(255, 237, 213, 0) 5px);
          mix-blend-mode: screen;
          animation: d200Haze 6s ease-in-out infinite;
        }
        @keyframes d200Haze {
          0%, 100% { transform: translateY(0) skewX(0deg); opacity: 0.5; }
          50%      { transform: translateY(-8px) skewX(0.6deg); opacity: 0.95; }
        }

        /* ── Gouttes de sueur qui dégoulinent sur l'écran ── */
        .d200-sweat { position: fixed; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
        .d200-drop {
          position: absolute;
          top: -24px;
          width: 6px; height: 11px;
          border-radius: 50% 50% 50% 50% / 62% 62% 38% 38%;
          background: linear-gradient(180deg, rgba(224, 242, 254, 0.9), rgba(56, 189, 248, 0.5));
          box-shadow: 0 0 6px rgba(56, 189, 248, 0.5);
          animation: d200Drip linear infinite;
        }
        @keyframes d200Drip {
          0%   { transform: translateY(0) scaleY(0.8); opacity: 0; }
          12%  { opacity: 0.95; }
          100% { transform: translateY(112vh) scaleY(1.15); opacity: 0; }
        }

        /* ── Quolibets flottants (humour de canicule) ── */
        .d200-msg {
          position: fixed;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 13px; font-weight: 700;
          color: rgba(254, 215, 170, 0.7);
          text-shadow: 0 0 10px rgba(249, 115, 22, 0.4);
          pointer-events: none; z-index: 1;
          white-space: nowrap;
          animation: d200MsgFloat ease-in-out infinite;
        }
        @keyframes d200MsgFloat {
          0%   { opacity: 0; transform: translateY(10px); }
          15%  { opacity: 0.85; }
          50%  { opacity: 0.6; transform: translateY(-8px); }
          85%  { opacity: 0.3; }
          100% { opacity: 0; transform: translateY(-18px); }
        }

        /* ── Fond des slides : braise ── */
        .day200-global .dashboard-slide-bg {
          background: radial-gradient(circle at 50% 26%, rgba(249, 115, 22, 0.10) 0%, transparent 64%) !important;
        }

        /* ── Le grand numéro du jour : métal en fusion ── */
        .day200-global .day-number,
        .day200-global .day-number-anim {
          background: linear-gradient(135deg, #fde047 0%, #fb923c 40%, #ef4444 80%, #fde047 100%) !important;
          background-size: 220% 220% !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          filter: drop-shadow(0 0 14px rgba(249, 115, 22, 0.55)) !important;
          animation: d200Molten 6s ease infinite, d200Shimmer 4s ease-in-out infinite !important;
        }
        @keyframes d200Molten {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes d200Shimmer {
          0%, 100% { transform: translateY(0) skewX(0deg); }
          50%      { transform: translateY(-2px) skewX(-1.5deg); }
        }

        /* ── Label du jour ── */
        .day200-global .day-label {
          color: #fdba74 !important;
          letter-spacing: 6px !important;
          text-shadow: 0 0 12px rgba(249, 115, 22, 0.7), 0 0 30px rgba(239, 68, 68, 0.3) !important;
        }
        .day200-global .day-label-text { font-size: 0 !important; }
        .day200-global .day-label-text::after {
          content: 'CANICULE';
          font-size: var(--day-label-size, clamp(0.75rem, 1.6vh, 1rem));
        }

        /* ── Logo chauffé à blanc ── */
        .day200-global .app-logo-text {
          background: linear-gradient(135deg, #fde047, #fb923c, #ef4444) !important;
          background-size: 200% 200% !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.45)) !important;
          animation: d200Molten 7s ease infinite !important;
        }
        .day200-global .app-logo-text::after { content: ' 🔥'; font-size: 0.8em; }

        /* ── Bouton central : braise incandescente ── */
        .day200-global .counter-button {
          background: radial-gradient(circle at 50% 38%, rgba(249, 115, 22, 0.32), rgba(40, 12, 6, 0.5)) !important;
          box-shadow: 0 0 34px rgba(249, 115, 22, 0.55), inset 0 0 26px rgba(251, 191, 36, 0.4) !important;
          animation: counterBlobMorph 9s ease-in-out infinite, d200Ember 3.4s ease-in-out infinite !important;
        }
        .day200-global .counter-button span {
          color: #fff7e0 !important;
          text-shadow: 0 0 12px rgba(251, 191, 36, 0.7) !important;
        }
        .day200-global .counter-button svg {
          color: #fdba74 !important;
          filter: drop-shadow(0 0 6px rgba(249, 115, 22, 0.8)) !important;
        }
        @keyframes d200Ember {
          0%, 100% { box-shadow: 0 0 30px rgba(249,115,22,0.5),  inset 0 0 22px rgba(251,191,36,0.35); }
          50%      { box-shadow: 0 0 52px rgba(239,68,68,0.7),    inset 0 0 36px rgba(251,191,36,0.6); }
        }
        /* ── Anneau de progression de l'année : braise ── */
        .day200-global .counter-ring {
          --ring-c1: #fbbf24 !important;
          --ring-c2: #f97316 !important;
          --ring-track: rgba(251, 146, 60, 0.18) !important;
        }

        /* ── Header ── */
        .day200-global .dashboard-header {
          border-color: rgba(249, 115, 22, 0.3) !important;
          background: rgba(54, 20, 8, 0.22) !important;
          box-shadow: 0 0 18px rgba(249, 115, 22, 0.10), inset 0 0 30px rgba(251, 191, 36, 0.05) !important;
          backdrop-filter: blur(2px);
        }

        /* ── Tuiles d'exercices : plaques chauffées ── */
        .day200-global .exercise-button {
          border: 1px solid rgba(249, 115, 22, 0.4) !important;
          background: linear-gradient(160deg, rgba(60, 24, 10, 0.6), rgba(80, 28, 12, 0.45)) !important;
          box-shadow: inset 0 0 16px rgba(251, 191, 36, 0.12), 0 6px 14px rgba(0, 0, 0, 0.45) !important;
          border-radius: 14px !important;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease !important;
        }
        .day200-global .exercise-button:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 10px 22px rgba(249, 115, 22, 0.25), inset 0 0 22px rgba(251, 191, 36, 0.3) !important;
          border-color: rgba(249, 115, 22, 0.8) !important;
        }
        .day200-global .exercise-button span { color: #fed7aa !important; text-shadow: 0 1px 3px rgba(0,0,0,0.6) !important; }
        .day200-global .exercise-button span:last-of-type {
          color: #fdba74 !important; font-weight: 800 !important;
          text-shadow: 0 0 8px rgba(249, 115, 22, 0.5) !important;
        }
        .day200-global .exercise-button > div:not(:last-child):not([class*="streak"]) {
          background: rgba(249, 115, 22, 0.12) !important;
          border: 1px solid rgba(251, 146, 60, 0.3) !important;
          border-radius: 10px !important;
        }
        .day200-global .exercise-button svg {
          color: #fdba74 !important; stroke: #fdba74 !important;
          filter: drop-shadow(0 0 3px rgba(249, 115, 22, 0.6)) !important;
        }
        .day200-global .exercise-button > div:last-child { background: rgba(0, 0, 0, 0.4) !important; }
        .day200-global .exercise-button > div:last-child > div {
          background: linear-gradient(90deg, #fbbf24, #f97316, #ef4444) !important;
          box-shadow: 0 0 8px rgba(249, 115, 22, 0.6) !important;
        }

        /* ── Barre de navigation ── */
        .day200-global .dashboard-nav-bar {
          background: rgba(54, 20, 8, 0.32) !important;
          border-color: rgba(249, 115, 22, 0.30) !important;
          box-shadow: 0 -2px 16px rgba(249, 115, 22, 0.12), 0 4px 14px rgba(0, 0, 0, 0.35) !important;
        }
        .day200-global .dashboard-nav-bar button { color: #fdba74 !important; }
        .day200-global .dashboard-nav-bar button span { color: #fed7aa !important; text-shadow: 0 1px 2px rgba(0,0,0,0.55) !important; }
        .day200-global .dashboard-nav-bar button:active { color: #fff7e0 !important; background: rgba(249, 115, 22, 0.14) !important; }

        .day200-global .progress-ring-svg { filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.5)) !important; }
        .day200-global .progress-ring-svg circle { stroke: #f97316 !important; }

        /* ── ✦ THERMOMÈTRE (HUD intégré) ──
           Mobile : HORIZONTAL, dans le flux (placé par l'hôte). Desktop : VERTICAL,
           épinglé dans la gouttière GAUCHE. Le remplissage est piloté par --fill
           (largeur en horizontal, hauteur en vertical). Jamais en superposition. */
        .d200-thermo {
          display: flex; flex-direction: column; align-items: center; gap: 5px;
          margin: 6px auto;
          width: fit-content; max-width: 94vw;
          pointer-events: none;
          padding: 7px 14px;
          border-radius: 16px;
          background: rgba(28, 10, 4, 0.55);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(249, 115, 22, 0.28);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          animation: d200ThermoIn 0.5s ease-out;
        }
        .d200-thermo-temp {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 15px; font-weight: 900;
          text-shadow: 0 0 10px currentColor;
          transition: color 0.5s ease;
        }
        /* Corps HORIZONTAL (mobile / défaut) */
        .d200-thermo-body { position: relative; width: clamp(180px, 60vw, 300px); height: 32px; }
        .d200-thermo-tube {
          position: absolute;
          top: 50%; transform: translateY(-50%);
          left: 24px; right: 0;
          height: 13px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(255, 255, 255, 0.25);
          box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }
        .d200-thermo-mercury {
          position: absolute; top: 0; bottom: 0; left: 0;
          width: var(--fill, 90%);
          border-radius: 999px;
          transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1), height 0.5s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.5s ease, box-shadow 0.5s ease;
        }
        .d200-thermo-bulb {
          position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 28px; height: 28px; border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.25);
          transition: background-color 0.5s ease, box-shadow 0.5s ease;
        }
        .d200-thermo-reps {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 11px; font-weight: 700;
          color: #fed7aa;
          text-shadow: 0 0 8px rgba(249, 115, 22, 0.5);
          white-space: nowrap;
        }
        .d200-thermo-reps small { opacity: 0.7; }
        @keyframes d200ThermoIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }

        @media (min-width: 768px) {
          .d200-thermo {
            position: fixed; left: 12px; top: 50%; transform: translateY(-50%);
            margin: 0;
          }
          .d200-thermo--dashboard { z-index: 50; }
          .d200-thermo--panel { z-index: 1100; }
          /* Corps VERTICAL */
          .d200-thermo .d200-thermo-body { width: 38px; height: clamp(150px, 38vh, 260px); }
          .d200-thermo .d200-thermo-tube {
            top: 0; bottom: 26px; left: 50%; right: auto;
            transform: translateX(-50%);
            width: 13px; height: auto;
            border-radius: 999px 999px 0 0;
          }
          .d200-thermo .d200-thermo-mercury {
            left: 0; right: 0; bottom: 0; top: auto;
            width: auto; height: var(--fill, 90%);
            border-radius: 999px 999px 0 0;
          }
          .d200-thermo .d200-thermo-bulb {
            left: 50%; top: auto; bottom: 0;
            transform: translateX(-50%);
            width: 30px; height: 30px;
          }
        }

        /* ── Carte d'alerte (modale d'accueil) ── */
        @keyframes d200AlertIn  { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes d200AlertOut { 0% { opacity: 1; } 100% { opacity: 0; transform: scale(1.04); } }
        @keyframes d200CardIn {
          0%   { opacity: 0; transform: translateY(24px) scale(0.94); }
          60%  { opacity: 1; transform: translateY(-5px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes d200CardOut { 0% { opacity: 1; } 100% { opacity: 0; transform: translateY(-22px) scale(0.96); } }
        @keyframes d200Rise { 0% { opacity: 0; transform: translateY(14px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes d200AlertPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          70%      { box-shadow: 0 0 0 14px rgba(239, 68, 68, 0); }
        }

        /* ── Récompense : l'orage qui casse la canicule ── */
        @keyframes d200StormSky {
          0%   { background: linear-gradient(180deg, #f97316 0%, #fb923c 45%, #ef4444 100%); }
          100% { background: linear-gradient(180deg, #1e293b 0%, #334155 50%, #475569 100%); }
        }
        @keyframes d200ReliefSky {
          0%   { background: linear-gradient(180deg, #1e293b 0%, #334155 50%, #475569 100%); }
          100% { background: linear-gradient(180deg, #0c4a6e 0%, #0ea5e9 45%, #7dd3fc 100%); }
        }
        @keyframes d200RainFall {
          0%   { transform: translateY(-12vh); opacity: 0; }
          10%  { opacity: 0.8; }
          100% { transform: translateY(112vh); opacity: 0.3; }
        }
        @keyframes d200Lightning {
          0%, 100% { opacity: 0; }
          47%, 49% { opacity: 0; }
          48%      { opacity: 0.9; }
          52%      { opacity: 0; }
          54%      { opacity: 0.6; }
          56%      { opacity: 0; }
        }
        @keyframes d200ReliefReveal {
          0%   { opacity: 0; transform: scale(0.5) translateY(24px); filter: blur(10px); }
          60%  { opacity: 1; transform: scale(1.06) translateY(-4px); filter: blur(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        @keyframes d200RewardFade { 0% { opacity: 1; } 72% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes d200Confetti {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(calc(var(--dx) * 1px), calc(var(--dy) * 1px + var(--grav) * 1px)) rotate(420deg); opacity: 0; }
        }

        /* ── Transition de sortie sur le dashboard (l'air se rafraîchit) ── */
        .day200-lifting { animation: d200Cooldown 1.6s ease-out forwards; }
        @keyframes d200Cooldown {
          0%   { filter: hue-rotate(0deg) saturate(1.4) brightness(1.1); }
          100% { filter: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .d200-sun, .d200-haze, .d200-drop, .d200-msg { animation: none !important; }
          .day200-global::before { animation: none !important; }
          .day200-global .day-number, .day200-global .day-number-anim,
          .day200-global .app-logo-text, .day200-global .counter-button { animation: none !important; }
        }
    `}} />
);


// ============================================================================
// 2. DÉCOR CANICULE (mémoïsé : ne se re-rend jamais quand le thermomètre bouge)
// ============================================================================
const HEAT_QUIPS = [
    '42°C à l\'ombre… 🥵',
    'Trop chaud pour réfléchir.',
    'Le bitume fond.',
    'Même les glaçons transpirent.',
    'Bouge pas… non, bouge.',
    'On crève de chaud.',
];

const DROPS = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: `${seeded(i, 1) * 100}%`,
    duration: `${3 + seeded(i, 2) * 4}s`,
    delay: `${seeded(i, 3) * -6}s`,
    scale: 0.7 + seeded(i, 4) * 0.9,
}));

const QUIPS = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    text: HEAT_QUIPS[i % HEAT_QUIPS.length],
    top: `${18 + i * 13 + seeded(i, 5) * 5}%`,
    left: `${6 + seeded(i, 6) * 52}%`,
    delay: `${i * 2.2 + seeded(i, 7) * 2}s`,
    duration: `${8 + seeded(i, 8) * 5}s`,
}));

const Day200Decor = memo(() => (
    <>
        <div className="d200-sun" aria-hidden="true" />
        <div className="d200-haze" aria-hidden="true" />

        <div className="d200-sweat" aria-hidden="true">
            {DROPS.map(d => (
                <div
                    key={d.id}
                    className="d200-drop"
                    style={{ left: d.left, animationDuration: d.duration, animationDelay: d.delay, transform: `scale(${d.scale})` }}
                />
            ))}
        </div>

        {QUIPS.map(q => (
            <div
                key={q.id}
                className="d200-msg"
                style={{ top: q.top, left: q.left, animationDelay: q.delay, animationDuration: q.duration }}
            >
                {q.text}
            </div>
        ))}
    </>
));


// ============================================================================
// 3. THERMOMÈTRE : la mécanique vivante (reps → la température descend)
// ============================================================================
// Couleur du mercure selon l'avancée (rouge brûlant → bleu glacé).
const mercuryColor = (pct) =>
    `rgb(${Math.round(lerp(239, 56, pct))}, ${Math.round(lerp(68, 189, pct))}, ${Math.round(lerp(68, 248, pct))})`;

function HeatThermometer({ reps = 0, goal = SWEAT_GOAL, onSolve, placement = 'dashboard' }) {
    const pct = Math.min(reps / goal, 1);
    const cooled = reps >= goal;

    // Objectif atteint → on a assez sué : l'orage peut éclater (une seule fois).
    useEffect(() => {
        if (cooled) onSolve?.();
    }, [cooled, onSolve]);

    const temp = Math.round(lerp(TEMP_HOT, TEMP_COOL, pct));
    const color = mercuryColor(pct);
    // Le mercure RECULE vers le bulbe quand on se rafraîchit : chaud (long) → frais (court).
    const fill = lerp(92, 16, pct);

    return (
        <div className={`d200-thermo d200-thermo--${placement}`}>
            <div className="d200-thermo-temp" style={{ color }}>{temp}°C</div>
            <div className="d200-thermo-body">
                <div className="d200-thermo-tube">
                    <div
                        className="d200-thermo-mercury"
                        style={{ '--fill': `${fill}%`, backgroundColor: color, boxShadow: `0 0 12px ${color}` }}
                    />
                </div>
                <div
                    className="d200-thermo-bulb"
                    style={{ backgroundColor: color, boxShadow: `0 0 16px ${color}` }}
                />
            </div>
            <div className="d200-thermo-reps">
                {Math.min(reps, goal)}<small>/{goal} 💧</small>
            </div>
        </div>
    );
}

// Décor ambiant (overlay de fond) — séparé du HUD intégré.
function Day200DecorOverlay() {
    return (
        <>
            <Day200Styles />
            <Day200Decor />
        </>
    );
}

// HUD intégré (rendu par le Dashboard / l'ExercisePanel via <EventHud />).
function Day200Hud({ onSolve, reps, goal, placement }) {
    return (
        <>
            <Day200Styles />
            <HeatThermometer reps={reps} goal={goal} onSolve={onSolve} placement={placement} />
        </>
    );
}


// ============================================================================
// 4. ALERTE CANICULE (modale d'accueil — le prétexte)
// ============================================================================
function Day200IntroModal({ onDismiss }) {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onDismiss, 450);
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 20000, padding: '22px', overflow: 'hidden',
                background: 'radial-gradient(ellipse at 50% 20%, rgba(249, 115, 22, 0.5) 0%, rgba(20, 8, 3, 0.94) 70%)',
                animation: isClosing ? 'd200AlertOut 0.45s ease-out forwards' : 'd200AlertIn 0.5s ease-out',
            }}
        >
            <Day200Styles />
            <Day200Decor />

            <div style={{
                position: 'relative', zIndex: 2,
                width: '100%', maxWidth: '440px',
                background: 'linear-gradient(165deg, #2a1206 0%, #45160a 55%, #2a1206 100%)',
                border: '1px solid rgba(249, 115, 22, 0.45)',
                borderRadius: '18px',
                padding: '24px',
                boxShadow: '0 24px 70px rgba(0,0,0,0.6), 0 0 60px rgba(249, 115, 22, 0.18)',
                overflow: 'hidden',
                animation: isClosing ? 'd200CardOut 0.45s ease-in forwards' : 'd200CardIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
                {/* Bandeau d'alerte */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', marginBottom: '18px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ef4444, #f97316)',
                    boxShadow: '0 6px 18px rgba(239, 68, 68, 0.4)',
                    animation: 'd200AlertPulse 2s ease-out infinite',
                }}>
                    <span style={{ fontSize: '24px' }}>⚠️</span>
                    <span style={{
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: '13px', fontWeight: 900, letterSpacing: '2px',
                        color: '#fff7ed', textTransform: 'uppercase',
                    }}>
                        Alerte Canicule — Jour 200
                    </span>
                </div>

                {/* Température géante */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
                    <span style={{
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: 'clamp(3.4rem, 18vw, 5rem)', fontWeight: 900, lineHeight: 0.9,
                        background: 'linear-gradient(135deg, #fde047, #fb923c, #ef4444)',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 20px rgba(249, 115, 22, 0.5))',
                    }}>
                        42°C
                    </span>
                    <span style={{ fontSize: '2rem' }}>🥵</span>
                </div>

                {/* Le prétexte */}
                <div style={{
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 'clamp(0.9rem, 3.6vw, 1.02rem)',
                    color: '#fed7aa', lineHeight: 1.55, textAlign: 'center',
                    margin: '4px auto 0', maxWidth: '360px',
                    animation: 'd200Rise 0.6s ease-out 0.3s both',
                }}>
                    Bouger, c'est l'enfer. Mais rester immobile, c'est pire :
                    tu fonds sur le canapé. 🫠
                    <br /><br />
                    Le seul échappatoire&nbsp;? <strong style={{ color: '#fdba74' }}>Transpirer un grand coup</strong> pour
                    activer ta climatisation interne. Sue <strong style={{ color: '#fdba74' }}>{SWEAT_GOAL} reps</strong> aujourd'hui&nbsp;:
                    le thermomètre dégringole, l'orage éclate, la canicule cède. 🌧️
                </div>

                <button
                    onClick={handleClose}
                    style={{
                        width: '100%', marginTop: '22px',
                        padding: '15px 24px',
                        background: 'linear-gradient(135deg, #f97316, #ef4444)',
                        border: 'none', borderRadius: '13px',
                        color: '#fff7ed',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: '15px', fontWeight: 900, letterSpacing: '0.5px',
                        cursor: 'pointer',
                        boxShadow: '0 10px 26px rgba(239, 68, 68, 0.45)',
                        animation: 'd200Rise 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s both',
                    }}
                >
                    🥵 Suer pour faire tomber la pluie
                </button>
            </div>
        </div>
    );
}


// ============================================================================
// 5. RÉCOMPENSE : l'orage casse la canicule
// ============================================================================
const STORM_PHASES = { gather: 1400, storm: 1700, relief: 1800, celebration: 2400 };
const STORM_TOTAL = Object.values(STORM_PHASES).reduce((a, b) => a + b, 0);

const RAIN_LINES = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${seeded(i, 1) * 100}%`,
    delay: `${seeded(i, 2) * 1.2}s`,
    duration: `${0.5 + seeded(i, 3) * 0.5}s`,
    height: `${12 + seeded(i, 4) * 20}px`,
    opacity: 0.3 + seeded(i, 5) * 0.5,
}));

const RELIEF_PARTICLES = Array.from({ length: 56 }, (_, i) => ({
    id: i,
    angle: seeded(i, 1) * 360,
    distance: 40 + seeded(i, 2) * 75,
    size: 5 + seeded(i, 3) * 9,
    color: ['#38bdf8', '#7dd3fc', '#0ea5e9', '#bae6fd', '#5eead4', '#ffffff'][Math.floor(seeded(i, 4) * 6)],
    duration: 1400 + seeded(i, 5) * 1100,
    delay: seeded(i, 6) * 400,
    grav: 30 + seeded(i, 7) * 60,
    shape: Math.floor(seeded(i, 8) * 3),
}));

function Day200StormAnimation({ onComplete }) {
    const [phase, setPhase] = useState('gather');

    useEffect(() => {
        const { gather, storm, relief } = STORM_PHASES;
        const t1 = setTimeout(() => setPhase('storm'), gather);
        const t2 = setTimeout(() => setPhase('relief'), gather + storm);
        const t3 = setTimeout(() => setPhase('celebration'), gather + storm + relief);
        const t4 = setTimeout(onComplete, STORM_TOTAL);
        return () => [t1, t2, t3, t4].forEach(clearTimeout);
    }, [onComplete]);

    const showStorm = phase === 'storm';
    const showRelief = phase === 'relief' || phase === 'celebration';
    const showCelebration = phase === 'celebration';

    let skyAnim = 'd200StormSky 1.4s ease-out forwards';
    if (showRelief) skyAnim = 'd200ReliefSky 1.8s ease-out forwards';
    if (showCelebration) skyAnim = 'd200RewardFade 2.4s ease-out forwards';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 30000,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            background: 'linear-gradient(180deg, #f97316 0%, #fb923c 45%, #ef4444 100%)',
            animation: skyAnim,
        }}>
            <Day200Styles />

            {(showStorm || showRelief) && (
                <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {RAIN_LINES.map(r => (
                        <div key={r.id} style={{
                            position: 'absolute', top: 0, left: r.left,
                            width: '2px', height: r.height,
                            background: 'linear-gradient(180deg, rgba(186,230,253,0.9), transparent)',
                            opacity: r.opacity,
                            animation: `d200RainFall ${r.duration} linear infinite`,
                            animationDelay: r.delay,
                        }} />
                    ))}
                </div>
            )}

            {showStorm && (
                <div aria-hidden="true" style={{
                    position: 'absolute', inset: 0, background: '#fff',
                    animation: 'd200Lightning 1.7s steps(1) infinite',
                    pointerEvents: 'none',
                }} />
            )}

            {showRelief && (
                <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 20px' }}>
                    <div style={{ fontSize: 'clamp(3rem, 12vw, 5rem)', lineHeight: 1, marginBottom: '8px', animation: 'd200ReliefReveal 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}>
                        🌧️
                    </div>
                    <div style={{
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: 'clamp(2rem, 9vw, 4.2rem)', fontWeight: 900, lineHeight: 1.05,
                        color: '#fff', letterSpacing: '1px',
                        textShadow: '0 4px 24px rgba(8, 47, 73, 0.6), 0 0 50px rgba(125, 211, 252, 0.6)',
                        animation: 'd200ReliefReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both',
                    }}>
                        CANICULE<br />VAINCUE
                    </div>
                    <div style={{
                        marginTop: '14px',
                        fontFamily: "'Inter', system-ui, sans-serif",
                        fontSize: 'clamp(0.9rem, 3.4vw, 1.2rem)',
                        color: 'rgba(240, 249, 255, 0.95)', fontWeight: 600,
                        textShadow: '0 2px 10px rgba(8, 47, 73, 0.5)',
                        animation: 'd200Rise 0.5s ease-out 0.5s both',
                    }}>
                        {SWEAT_GOAL} reps de sueur… et la pluie est tombée. 🌧️💧
                    </div>
                </div>
            )}

            {showCelebration && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {RELIEF_PARTICLES.map(p => {
                        const rad = (p.angle * Math.PI) / 180;
                        const shapes = ['50%', '2px', '50% 50% 50% 50% / 60% 60% 40% 40%'];
                        const widths = [p.size, p.size, p.size * 0.7];
                        const heights = [p.size, p.size, p.size * 1.4];
                        return (
                            <div key={p.id} style={{
                                position: 'absolute', left: '50%', top: '46%',
                                width: widths[p.shape], height: heights[p.shape],
                                borderRadius: shapes[p.shape], background: p.color,
                                '--dx': Math.cos(rad) * p.distance,
                                '--dy': -Math.sin(rad) * p.distance,
                                '--grav': p.grav,
                                animation: `d200Confetti ${p.duration}ms forwards ${p.delay}ms`,
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
export const Day200EventManager = makeEventManager({
    isActive: ({ dayNumber }) => dayNumber === 200,
    introKey: 'day200_intro_shown',
    doneKey: 'day200_challenge_done',
    keepAmbianceAfterReward: false, // une fois la pluie tombée, la fournaise s'éteint
    autoReward: false,              // ✦ mécanique propre : c'est le thermomètre (reps) qui résout
    activeClasses: ['day200-global'],
    doneClass: 'day200-lifting',
    // Avancée live du défi injectée dans le HUD (thermomètre).
    hudProps: (ctx) => ({ reps: totalRepsToday(ctx), goal: SWEAT_GOAL }),
    Intro: Day200IntroModal,
    Decor: Day200DecorOverlay,
    Hud: Day200Hud,
    Reward: Day200StormAnimation,
});
