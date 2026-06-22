/**
 * Day200Event — Événement spécial du Jour 200.
 *
 * ⚠️  CE FICHIER EST VOLONTAIREMENT MONOLITHIQUE.
 * Tous les composants, styles et logique de l'événement sont regroupés ici
 * dans un seul fichier pour garantir un comportement 100 % plug & play :
 * ajouter ou retirer cet événement de l'app se fait en un seul import,
 * sans dépendances dispersées dans le projet.
 *
 * Thème : VACANCES — plage, sable chaud, vagues tranquilles, coucher de soleil.
 * Là où le Jour 100 était une intrusion stressante à corriger, le Jour 200
 * est une récompense : 200 jours de régularité, on pose le sac, on respire.
 * Aucune pression — et si la journée est bouclée, le coucher de soleil arrive.
 */
import React, { useState, useEffect, memo } from 'react';
import { makeEventManager, seeded } from './eventEngine';

// ============================================================================
// 1. STYLES CSS (Injectés uniquement pour cet événement)
// ============================================================================
const Day200Styles = () => (
    <style dangerouslySetInnerHTML={{ __html: `
        /* ── Global wrapper: baigne tout le dashboard dans une lumière chaude ── */
        .day200-global {
          position: relative;
        }

        /* ── PALETTE DE THÈME "VACANCES" (cohérente partout) ──
           On redéfinit l'ensemble des tokens du thème sur la racine de l'event,
           comme un vrai [data-theme]. Tout ce qui consomme var(--…) (modales,
           barres, cartes, mur cardio, sliders…) s'adapte automatiquement.
           Les surfaces sont volontairement TRÈS translucides : combinées au
           backdrop-blur des cartes, elles donnent le verre dépoli / la mer. */
        .day200-global {
          /* Accent : orange chaud + lueur ambre */
          --accent: rgb(251, 146, 60) !important;
          --accent-glow: rgb(252, 211, 77) !important;

          /* Surfaces translucides (glassmorphisme / mer) */
          --bg-color: rgb(20, 14, 6) !important;
          --card-bg: rgba(40, 30, 14, 0.30) !important;
          --surface-elevated: linear-gradient(135deg, rgba(44, 30, 12, 0.42), rgba(40, 34, 20, 0.46)) !important;
          --surface-section: linear-gradient(135deg, rgba(44, 30, 12, 0.55), rgba(40, 34, 20, 0.60)) !important;
          --surface-subtle: rgba(254, 240, 138, 0.05) !important;
          --surface-muted: rgba(254, 240, 138, 0.08) !important;
          --surface-dim: rgba(254, 240, 138, 0.12) !important;
          --surface-hover: rgba(254, 240, 138, 0.15) !important;

          /* Bordures sable */
          --border-subtle: rgba(251, 191, 36, 0.16) !important;
          --border-muted: rgba(251, 191, 36, 0.12) !important;
          --border-default: rgba(251, 146, 60, 0.30) !important;
          --border-strong: rgba(251, 146, 60, 0.45) !important;

          /* Overlays / sheets (un peu plus opaques pour rester lisibles) */
          --overlay-bg: rgb(22, 15, 7) !important;
          --sheet-bg: rgba(34, 24, 11, 0.94) !important;
          --progress-track: rgba(254, 240, 138, 0.18) !important;

          /* Lueurs de fond : soleil + mer */
          --body-glow-1: rgba(251, 191, 36, 0.12) !important;
          --body-glow-2: rgba(45, 212, 191, 0.08) !important;

          /* Gradients : sable → soleil → mer turquoise */
          --gradient-primary: linear-gradient(135deg, #fb923c 0%, #fbbf24 100%) !important;
          --gradient-accent: linear-gradient(135deg, #fbbf24 0%, #2dd4bf 100%) !important;
          --gradient-glow: linear-gradient(135deg, #f97316 0%, #fbbf24 50%, #2dd4bf 100%) !important;
          --glow-primary: 0 0 20px rgba(251, 146, 60, 0.4) !important;
          --glow-accent: 0 0 25px rgba(251, 191, 36, 0.5) !important;
        }
        .day200-global::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse at 50% -10%, rgba(254, 215, 102, 0.35) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 15%, rgba(251, 146, 60, 0.18) 0%, transparent 50%),
            linear-gradient(180deg, rgba(125, 211, 252, 0.10) 0%, rgba(253, 230, 138, 0.08) 45%, rgba(45, 212, 191, 0.10) 100%);
          pointer-events: none;
          z-index: 0;
          animation: bgWarmBreath 9s ease-in-out infinite alternate;
        }

        @keyframes bgWarmBreath {
          0%   { opacity: 0.7; }
          100% { opacity: 1; }
        }

        /* ── Soleil + rayons (haut de l'écran) ── */
        .day200-sun {
          position: fixed;
          top: clamp(-90px, -6vh, -40px);
          left: 50%;
          width: clamp(140px, 26vh, 240px);
          height: clamp(140px, 26vh, 240px);
          transform: translateX(-50%);
          pointer-events: none;
          z-index: 0;
        }
        .day200-sun::after {
          content: '';
          position: absolute;
          inset: 22%;
          border-radius: 50%;
          background: radial-gradient(circle, #fffbe6 0%, #fde68a 45%, #fcd34d 75%, rgba(251, 191, 36, 0) 100%);
          box-shadow: 0 0 70px rgba(253, 224, 71, 0.6), 0 0 140px rgba(251, 191, 36, 0.35);
          animation: sunGlow 6s ease-in-out infinite alternate;
        }
        .day200-sun::before {
          content: '';
          position: absolute;
          inset: -10%;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            rgba(253, 224, 71, 0.25) 0deg, transparent 14deg,
            rgba(253, 224, 71, 0.25) 30deg, transparent 44deg,
            rgba(253, 224, 71, 0.25) 60deg, transparent 74deg,
            rgba(253, 224, 71, 0.25) 90deg, transparent 104deg,
            rgba(253, 224, 71, 0.25) 120deg, transparent 134deg,
            rgba(253, 224, 71, 0.25) 150deg, transparent 164deg,
            rgba(253, 224, 71, 0.25) 180deg, transparent 194deg,
            rgba(253, 224, 71, 0.25) 210deg, transparent 224deg,
            rgba(253, 224, 71, 0.25) 240deg, transparent 254deg,
            rgba(253, 224, 71, 0.25) 270deg, transparent 284deg,
            rgba(253, 224, 71, 0.25) 300deg, transparent 314deg,
            rgba(253, 224, 71, 0.25) 330deg, transparent 344deg
          );
          -webkit-mask: radial-gradient(circle, transparent 38%, #000 42%, transparent 72%);
          mask: radial-gradient(circle, transparent 38%, #000 42%, transparent 72%);
          animation: sunRays 60s linear infinite;
        }

        @keyframes sunGlow {
          0%   { transform: scale(1);    opacity: 0.92; }
          100% { transform: scale(1.06); opacity: 1; }
        }
        @keyframes sunRays {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* ── Nuages doux qui dérivent ── */
        .day200-cloud {
          position: fixed;
          pointer-events: none;
          z-index: 0;
          border-radius: 100px;
          background: rgba(255, 255, 255, 0.55);
          filter: blur(6px);
          box-shadow:
            40px 8px 0 -6px rgba(255, 255, 255, 0.55),
            -38px 10px 0 -8px rgba(255, 255, 255, 0.45),
            8px -14px 0 -4px rgba(255, 255, 255, 0.5);
          animation: cloudDrift linear infinite;
        }
        @keyframes cloudDrift {
          0%   { transform: translateX(-25vw); }
          100% { transform: translateX(125vw); }
        }

        /* ── Mer + vagues en bas d'écran ── */
        .day200-sea {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          height: clamp(70px, 14vh, 130px);
          pointer-events: none;
          z-index: 0;
          background: linear-gradient(180deg, rgba(45, 212, 191, 0) 0%, rgba(34, 211, 238, 0.18) 35%, rgba(14, 165, 233, 0.28) 100%);
          overflow: hidden;
        }
        .day200-wave {
          position: absolute;
          left: -50%;
          width: 200%;
          height: 100%;
          background-repeat: repeat-x;
          background-position: 0 bottom;
          background-size: 50% 100%;
          opacity: 0.5;
        }
        .day200-wave-1 {
          background-image: radial-gradient(ellipse 50% 18px at 50% 100%, rgba(255,255,255,0.55) 0%, transparent 70%);
          animation: waveSlide 11s linear infinite;
          opacity: 0.45;
        }
        .day200-wave-2 {
          background-image: radial-gradient(ellipse 60% 22px at 50% 100%, rgba(186, 230, 253, 0.5) 0%, transparent 70%);
          animation: waveSlide 16s linear infinite reverse;
          bottom: 6px;
          opacity: 0.4;
        }
        @keyframes waveSlide {
          0%   { transform: translateX(0); }
          100% { transform: translateX(50%); }
        }

        /* ── Palmiers dans les coins (oscillation douce) ── */
        .day200-palm {
          position: fixed;
          bottom: clamp(40px, 9vh, 90px);
          font-size: clamp(70px, 16vh, 150px);
          line-height: 1;
          pointer-events: none;
          z-index: 0;
          opacity: 0.85;
          filter: drop-shadow(0 6px 10px rgba(0,0,0,0.12)) saturate(1.1);
          transform-origin: bottom center;
        }
        .day200-palm-left  { left: clamp(-22px, -1vw, -6px);  transform: scaleX(-1); animation: palmSwayL 7s ease-in-out infinite; }
        .day200-palm-right { right: clamp(-22px, -1vw, -6px); animation: palmSwayR 8s ease-in-out infinite; }
        @keyframes palmSwayL {
          0%, 100% { transform: scaleX(-1) rotate(-2deg); }
          50%      { transform: scaleX(-1) rotate(3deg); }
        }
        @keyframes palmSwayR {
          0%, 100% { transform: rotate(2deg); }
          50%      { transform: rotate(-3deg); }
        }

        /* ── Particules dorées qui flottent (poussière de soleil / sable) ── */
        .day200-sparkles {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .day200-sparkle {
          position: absolute;
          bottom: -10px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: radial-gradient(circle, #fffbe6 0%, #fcd34d 60%, rgba(251,191,36,0) 100%);
          box-shadow: 0 0 6px rgba(253, 224, 71, 0.7);
          animation: sparkleRise linear infinite;
        }
        @keyframes sparkleRise {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.7; }
          100% { transform: translateY(-108vh) translateX(var(--drift, 20px)); opacity: 0; }
        }

        /* ── Mouettes qui planent ── */
        .day200-gull {
          position: fixed;
          z-index: 0;
          pointer-events: none;
          color: rgba(71, 85, 105, 0.45);
          font-size: 18px;
          animation: gullGlide linear infinite;
        }
        @keyframes gullGlide {
          0%   { transform: translateX(-10vw) translateY(0); opacity: 0; }
          10%  { opacity: 1; }
          50%  { transform: translateX(50vw) translateY(-18px); }
          90%  { opacity: 1; }
          100% { transform: translateX(115vw) translateY(6px); opacity: 0; }
        }

        /* ── Fond des slides : sable chaud ── */
        .day200-global .dashboard-slide-bg {
          background: radial-gradient(circle at 50% 30%, rgba(253, 230, 138, 0.10) 0%, transparent 65%) !important;
        }

        /* ── Le grand numéro du jour : dégradé coucher de soleil + miroitement de chaleur ── */
        .day200-global .day-number,
        .day200-global .day-number-anim {
          background: linear-gradient(135deg, #f97316 0%, #fbbf24 35%, #f472b6 70%, #38bdf8 100%) !important;
          background-size: 220% 220% !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          text-shadow: none !important;
          filter: drop-shadow(0 3px 10px rgba(251, 146, 60, 0.35)) !important;
          animation: sunsetFlow 8s ease infinite, heatShimmer 5s ease-in-out infinite !important;
        }
        @keyframes sunsetFlow {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes heatShimmer {
          0%, 100% { transform: translateY(0) skewX(0deg); }
          50%      { transform: translateY(-2px) skewX(-1deg); }
        }

        /* ── Label du jour : sable doux ── */
        .day200-global .day-label {
          color: #fde68a !important;
          letter-spacing: 6px !important;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55), 0 0 16px rgba(251, 191, 36, 0.45) !important;
          animation: labelBob 5s ease-in-out infinite !important;
        }
        @keyframes labelBob {
          0%, 100% { opacity: 0.85; transform: translateY(0); }
          50%      { opacity: 1;    transform: translateY(-1px); }
        }

        /* ── Logo réchauffé ── */
        .day200-global .app-logo-text {
          background: linear-gradient(135deg, #fb923c, #fbbf24, #f472b6) !important;
          background-size: 200% 200% !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          color: transparent !important;
          filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.4)) !important;
          animation: sunsetFlow 7s ease infinite !important;
        }

        /* ── Bouton central : une bouée qui flotte ──
              On anime le conteneur parent (bouton + anneau + halo) pour que tout
              le groupe flotte ENSEMBLE, sinon l'anneau resterait sur place. ── */
        .day200-global .flex-center:has(> .counter-button) {
          animation: buoyFloat 5s ease-in-out infinite !important;
        }
        @keyframes buoyFloat {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50%      { transform: translateY(-6px) rotate(1deg); }
        }

        .day200-global .counter-button {
          background: radial-gradient(circle at 50% 35%, rgba(254, 240, 138, 0.25), rgba(45, 212, 191, 0.12)) !important;
          box-shadow: 0 4px 18px rgba(251, 146, 60, 0.25), inset 0 0 25px rgba(254, 240, 138, 0.35) !important;
          animation: counterBlobMorph 9s ease-in-out infinite, buoyGlow 5s ease-in-out infinite !important;
        }
        /* ── Anneau de progression de l'année : turquoise → soleil ── */
        .day200-global .counter-ring {
          --ring-c1: #2dd4bf !important;
          --ring-c2: #fbbf24 !important;
          --ring-track: rgba(254, 240, 138, 0.18) !important;
        }
        .day200-global .counter-button span {
          color: #fff7e0 !important;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6), 0 0 12px rgba(251, 191, 36, 0.5) !important;
        }
        .day200-global .counter-button svg {
          color: #f97316 !important;
          filter: drop-shadow(0 0 5px rgba(251, 146, 60, 0.7)) !important;
        }
        @keyframes buoyGlow {
          0%, 100% { box-shadow: 0 4px 18px rgba(251, 146, 60, 0.25), inset 0 0 22px rgba(254, 240, 138, 0.3); border-color: rgba(251, 146, 60, 0.6); }
          50%      { box-shadow: 0 6px 26px rgba(251, 146, 60, 0.4), inset 0 0 32px rgba(254, 240, 138, 0.5); border-color: rgba(251, 146, 60, 0.85); }
        }

        /* ── Header : verre chaud ── */
        .day200-global .dashboard-header {
          border-color: rgba(251, 191, 36, 0.3) !important;
          background: rgba(254, 243, 199, 0.10) !important;
          box-shadow: 0 4px 18px rgba(251, 146, 60, 0.10), inset 0 0 30px rgba(254, 240, 138, 0.06) !important;
          backdrop-filter: blur(2px);
        }

        /* ── Tuiles d'exercices : galets de sable chaud ── */
        .day200-global .exercise-button {
          border: 1px solid rgba(251, 146, 60, 0.4) !important;
          background: linear-gradient(160deg, rgba(254, 240, 138, 0.14), rgba(45, 212, 191, 0.08)) !important;
          box-shadow: inset 0 1px 6px rgba(255, 255, 255, 0.4), 0 6px 14px rgba(180, 83, 9, 0.10) !important;
          border-radius: 16px !important;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease !important;
        }
        .day200-global .exercise-button:hover {
          transform: translateY(-3px) !important;
          background: linear-gradient(160deg, rgba(254, 240, 138, 0.25), rgba(45, 212, 191, 0.14)) !important;
          box-shadow: 0 10px 22px rgba(251, 146, 60, 0.25), inset 0 1px 6px rgba(255,255,255,0.5) !important;
          border-color: rgba(251, 146, 60, 0.8) !important;
        }
        .day200-global .exercise-button span {
          color: #fef3c7 !important;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55) !important;
        }
        .day200-global .exercise-button span:last-of-type {
          color: #fdba74 !important;
          font-weight: 800 !important;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6), 0 0 8px rgba(251, 146, 60, 0.4) !important;
        }
        .day200-global .exercise-button > div:not(:last-child):not([class*="streak"]) {
          background: rgba(251, 191, 36, 0.16) !important;
          border: 1px solid rgba(251, 146, 60, 0.3) !important;
          border-radius: 12px !important;
        }
        .day200-global .exercise-button svg {
          color: #f97316 !important;
          stroke: #f97316 !important;
          filter: drop-shadow(0 0 2px rgba(251, 146, 60, 0.5)) !important;
        }
        .day200-global .exercise-button > div:last-child {
          background: rgba(180, 83, 9, 0.12) !important;
        }
        .day200-global .exercise-button > div:last-child > div {
          background: linear-gradient(90deg, #2dd4bf, #fbbf24, #f97316) !important;
          box-shadow: 0 0 8px rgba(251, 191, 36, 0.6) !important;
        }

        /* ── Barre de navigation : on habille seulement la barre (ton sable),
              pas chaque bouton — pour ne pas encadrer les icônes dans un carré. ── */
        .day200-global .dashboard-nav-bar {
          background: rgba(254, 240, 138, 0.10) !important;
          border-color: rgba(251, 146, 60, 0.35) !important;
          box-shadow: 0 -2px 16px rgba(251, 146, 60, 0.12), 0 4px 14px rgba(180, 83, 9, 0.10) !important;
        }
        /* Couleur des icônes (currentColor) + labels, sans fond ni bordure.
           Le bouton Séance central garde son icône blanche (color explicite). */
        .day200-global .dashboard-nav-bar button {
          color: #fcd34d !important;
        }
        .day200-global .dashboard-nav-bar button span {
          color: #fde68a !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
        }
        .day200-global .dashboard-nav-bar button:active {
          color: #fff7e0 !important;
          background: rgba(254, 240, 138, 0.14) !important;
        }

        /* ── Anneau de progression : turquoise/corail ── */
        .day200-global .progress-ring-svg {
          filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.5)) !important;
        }
        .day200-global .progress-ring-svg circle {
          stroke: #2dd4bf !important;
        }

        /* ── Cartes postales flottantes ── */
        .day200-msg {
          position: fixed;
          font-family: 'Georgia', 'Times New Roman', serif;
          font-size: 13px;
          font-weight: 600;
          font-style: italic;
          color: rgba(180, 83, 9, 0.55);
          text-shadow: 0 1px 4px rgba(255, 255, 255, 0.5);
          pointer-events: none;
          z-index: 1;
          white-space: nowrap;
          animation: msgDrift ease-in-out infinite;
        }
        @keyframes msgDrift {
          0%   { opacity: 0; transform: translateY(10px) rotate(-2deg); }
          15%  { opacity: 0.9; }
          50%  { opacity: 0.7; transform: translateY(-8px) rotate(1deg); }
          85%  { opacity: 0.4; }
          100% { opacity: 0; transform: translateY(-20px) rotate(2deg); }
        }

        /* ── Carte postale d'accueil (modale) ── */
        @keyframes postcardIn {
          0%   { opacity: 0; transform: translateY(24px) rotate(-3deg) scale(0.92); }
          60%  { opacity: 1; transform: translateY(-6px) rotate(1deg) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
        }
        @keyframes postcardOut {
          0%   { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translateY(-30px) rotate(3deg) scale(0.95); }
        }
        @keyframes lineFadeUp {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes stampPop {
          0%   { opacity: 0; transform: scale(0.4) rotate(-18deg); }
          70%  { opacity: 1; transform: scale(1.12) rotate(10deg); }
          100% { opacity: 1; transform: scale(1) rotate(8deg); }
        }
        @keyframes overlayFadeIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes overlayFadeOut {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }

        /* ── Animation coucher de soleil (récompense journée parfaite) ── */
        @keyframes skyToDusk {
          0%   { background: linear-gradient(180deg, #7dd3fc 0%, #bae6fd 45%, #5eead4 100%); }
          100% { background: linear-gradient(180deg, #1e293b 0%, #7c3aed 18%, #f97316 55%, #fbbf24 78%, #fde68a 100%); }
        }
        @keyframes sunSink {
          0%   { transform: translate(-50%, -10vh); opacity: 1; }
          100% { transform: translate(-50%, 34vh); opacity: 1; }
        }
        @keyframes sunsetReveal {
          0%   { opacity: 0; transform: translateY(24px) scale(0.85); filter: blur(8px); }
          60%  { opacity: 1; transform: translateY(-4px) scale(1.05); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes sunsetFadeOut {
          0%   { opacity: 1; }
          75%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes seaShimmer {
          0%, 100% { opacity: 0.5; }
          50%      { opacity: 0.85; }
        }

        /* Particules de confettis chaleureux (autonome, plug & play) ── */
        @keyframes day200Confetti {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(calc(var(--dx) * 1px), calc(var(--dy) * 1px + var(--grav) * 1px)) rotate(420deg); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .day200-sun::before { animation: none; }
          .day200-cloud, .day200-gull, .day200-sparkle, .day200-wave,
          .day200-palm, .day200-msg { animation: none !important; }
          .day200-global .counter-button,
          .day200-global .flex-center:has(> .counter-button) { animation: none !important; }
          .day200-global .day-number, .day200-global .day-number-anim { animation: sunsetFlow 8s ease infinite !important; }
        }
    `}} />
);


// ============================================================================
// 2. OVERLAY DASHBOARD VACANCES (décor de plage)
// ============================================================================
const POSTCARD_MSGS = [
    'Jour 200 ☀️',
    'Mode vacances activé',
    'Les pieds dans le sable…',
    'Respire.',
    '200 jours de régularité 🐚',
    'Profite du moment 🌊',
];

const SPARKLES = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: `${seeded(i, 1) * 100}%`,
    size: `${4 + Math.floor(seeded(i, 2) * 6)}px`,
    duration: `${10 + seeded(i, 3) * 12}s`,
    delay: `${seeded(i, 4) * 12}s`,
    drift: `${-30 + seeded(i, 5) * 60}px`,
    opacity: 0.4 + seeded(i, 6) * 0.5,
}));

const CLOUDS = Array.from({ length: 3 }, (_, i) => ({
    id: i,
    top: `${8 + seeded(i, 7) * 22}%`,
    width: `${70 + seeded(i, 8) * 60}px`,
    height: `${20 + seeded(i, 9) * 12}px`,
    duration: `${55 + seeded(i, 10) * 50}s`,
    delay: `${seeded(i, 11) * -60}s`,
    opacity: 0.5 + seeded(i, 12) * 0.3,
}));

const GULLS = Array.from({ length: 2 }, (_, i) => ({
    id: i,
    top: `${14 + i * 10 + seeded(i, 13) * 6}%`,
    duration: `${22 + seeded(i, 14) * 14}s`,
    delay: `${i * 9 + seeded(i, 15) * 6}s`,
    fontSize: `${14 + Math.floor(seeded(i, 16) * 8)}px`,
}));

const FLOATING_MSGS = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    text: POSTCARD_MSGS[i % POSTCARD_MSGS.length],
    top: `${20 + i * 13 + seeded(i, 17) * 4}%`,
    left: `${6 + seeded(i, 18) * 58}%`,
    delay: `${i * 2 + seeded(i, 19) * 2}s`,
    duration: `${9 + seeded(i, 20) * 5}s`,
}));

const Day200Overlay = memo(() => {
    return (
        <>
            <Day200Styles />

            {/* Soleil + rayons */}
            <div className="day200-sun" aria-hidden="true" />

            {/* Nuages */}
            {CLOUDS.map(c => (
                <div
                    key={c.id}
                    className="day200-cloud"
                    aria-hidden="true"
                    style={{
                        top: c.top, width: c.width, height: c.height,
                        animationDuration: c.duration, animationDelay: c.delay,
                        opacity: c.opacity,
                    }}
                />
            ))}

            {/* Mouettes */}
            {GULLS.map(g => (
                <div
                    key={g.id}
                    className="day200-gull"
                    aria-hidden="true"
                    style={{
                        top: g.top, fontSize: g.fontSize,
                        animationDuration: g.duration, animationDelay: g.delay,
                    }}
                >
                    ﹀
                </div>
            ))}

            {/* Particules dorées */}
            <div className="day200-sparkles" aria-hidden="true">
                {SPARKLES.map(s => (
                    <div
                        key={s.id}
                        className="day200-sparkle"
                        style={{
                            left: s.left, width: s.size, height: s.size,
                            animationDuration: s.duration, animationDelay: s.delay,
                            opacity: s.opacity, '--drift': s.drift,
                        }}
                    />
                ))}
            </div>

            {/* Cartes postales flottantes */}
            {FLOATING_MSGS.map(m => (
                <div
                    key={m.id}
                    className="day200-msg"
                    style={{
                        top: m.top, left: m.left,
                        animationDelay: m.delay, animationDuration: m.duration,
                    }}
                >
                    {m.text}
                </div>
            ))}

            {/* Palmiers */}
            <div className="day200-palm day200-palm-left" aria-hidden="true">🌴</div>
            <div className="day200-palm day200-palm-right" aria-hidden="true">🌴</div>

            {/* Mer + vagues */}
            <div className="day200-sea" aria-hidden="true">
                <div className="day200-wave day200-wave-1" />
                <div className="day200-wave day200-wave-2" />
            </div>
        </>
    );
});


// ============================================================================
// 4. CARTE POSTALE D'ACCUEIL (modale)
// ============================================================================
const POSTCARD_LINES = [
    { text: '200 jours. Pose ton sac.', delay: 400 },
    { text: "Aujourd'hui, c'est sable chaud", delay: 1100 },
    { text: 'et vagues tranquilles.', delay: 1600 },
    { text: '', delay: 1900 },
    { text: 'Pas de pression — juste toi,', delay: 2300 },
    { text: 'le soleil, et ta régularité.', delay: 2900 },
    { text: '', delay: 3200 },
    { text: '(Et si tu boucles ta journée…', delay: 3700 },
    { text: "le coucher de soleil t'attend 🌅)", delay: 4300 },
];

function Day200WelcomeModal({ onDismiss }) {
    const [visibleLines, setVisibleLines] = useState(0);
    const [showButton, setShowButton] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const timers = POSTCARD_LINES.map((line, i) =>
            setTimeout(() => setVisibleLines(i + 1), line.delay)
        );
        const buttonTimer = setTimeout(
            () => setShowButton(true),
            POSTCARD_LINES[POSTCARD_LINES.length - 1].delay + 700
        );
        return () => {
            timers.forEach(clearTimeout);
            clearTimeout(buttonTimer);
        };
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onDismiss, 450);
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'radial-gradient(ellipse at center, rgba(125, 211, 252, 0.45) 0%, rgba(30, 41, 59, 0.78) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 20000, padding: '20px',
                animation: isClosing ? 'overlayFadeOut 0.45s ease-out forwards' : 'overlayFadeIn 0.5s ease-out',
            }}
        >
            <Day200Styles />
            <div style={{
                width: '100%', maxWidth: '440px',
                background: 'linear-gradient(160deg, #fffdf5 0%, #fef3c7 55%, #fde68a 100%)',
                border: '1px solid rgba(251, 191, 36, 0.5)',
                borderRadius: '16px',
                padding: '26px 24px 24px',
                boxShadow: '0 24px 70px rgba(180, 83, 9, 0.35), 0 0 0 8px rgba(255,255,255,0.5), inset 0 1px 0 rgba(255,255,255,0.7)',
                position: 'relative', overflow: 'hidden',
                animation: isClosing ? 'postcardOut 0.45s ease-in forwards' : 'postcardIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
                {/* Timbre */}
                <div style={{
                    position: 'absolute', top: '16px', right: '16px',
                    width: '54px', height: '64px',
                    background: 'linear-gradient(160deg, #38bdf8, #2dd4bf)',
                    border: '3px solid #fffdf5',
                    borderRadius: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '26px',
                    animation: 'stampPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both',
                }}>
                    🏖️
                </div>

                {/* En-tête carte postale */}
                <div style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: '12px', letterSpacing: '3px',
                    color: '#b45309', textTransform: 'uppercase',
                    fontWeight: 700, marginBottom: '4px',
                }}>
                    Carte postale
                </div>
                <div style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: '40px', fontWeight: 900, lineHeight: 1,
                    background: 'linear-gradient(135deg, #f97316, #fbbf24, #f472b6)',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '18px',
                    paddingBottom: '14px',
                    borderBottom: '2px dashed rgba(251, 146, 60, 0.35)',
                }}>
                    JOUR 200
                </div>

                {/* Corps du message */}
                <div style={{
                    fontFamily: "'Georgia', serif",
                    fontSize: '16px', lineHeight: '1.7',
                    color: '#78350f', minHeight: '210px',
                    fontStyle: 'italic',
                }}>
                    {POSTCARD_LINES.slice(0, visibleLines).map((line, i) => (
                        <div key={i} style={{ animation: 'lineFadeUp 0.4s ease-out', minHeight: line.text ? undefined : '0.9em' }}>
                            {line.text || ' '}
                        </div>
                    ))}
                </div>

                {showButton && (
                    <button
                        onClick={handleClose}
                        style={{
                            width: '100%', marginTop: '18px',
                            padding: '15px 24px',
                            background: 'linear-gradient(135deg, #fb923c, #fbbf24)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fffdf5',
                            fontFamily: "'Georgia', serif",
                            fontSize: '15px', fontWeight: 800,
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            boxShadow: '0 8px 20px rgba(251, 146, 60, 0.45)',
                            animation: 'lineFadeUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            textShadow: '0 1px 2px rgba(180,83,9,0.3)',
                        }}
                    >
                        🩴 Les pieds dans le sable
                    </button>
                )}
            </div>
        </div>
    );
}


// ============================================================================
// 5. ANIMATION COUCHER DE SOLEIL (récompense journée parfaite)
// ============================================================================
const SUNSET_PHASE_DURATIONS = {
    dusk: 1400,
    sink: 2600,
    reveal: 1800,
    celebration: 2400,
};

const SUNSET_TOTAL = Object.values(SUNSET_PHASE_DURATIONS).reduce((a, b) => a + b, 0);

const SUNSET_PARTICLES = Array.from({ length: 56 }, (_, i) => ({
    id: i,
    angle: seeded(i, 1) * 360,
    distance: 40 + seeded(i, 2) * 70,
    size: 5 + seeded(i, 3) * 9,
    color: ['#fb923c', '#fbbf24', '#f472b6', '#fde68a', '#2dd4bf', '#38bdf8'][Math.floor(seeded(i, 4) * 6)],
    duration: 1400 + seeded(i, 5) * 1100,
    delay: seeded(i, 6) * 400,
    grav: 30 + seeded(i, 7) * 60,
    shape: Math.floor(seeded(i, 8) * 3),
}));

function Day200SunsetAnimation({ onComplete }) {
    const [phase, setPhase] = useState('dusk');

    useEffect(() => {
        const { dusk, sink, reveal } = SUNSET_PHASE_DURATIONS;
        const t1 = setTimeout(() => setPhase('sink'), dusk);
        const t2 = setTimeout(() => setPhase('reveal'), dusk + sink);
        const t3 = setTimeout(() => setPhase('celebration'), dusk + sink + reveal);
        const t4 = setTimeout(onComplete, SUNSET_TOTAL);
        return () => [t1, t2, t3, t4].forEach(clearTimeout);
    }, [onComplete]);

    const showReveal = phase === 'reveal' || phase === 'celebration';
    const showCelebration = phase === 'celebration';

    return (
        <div style={{
            position: 'fixed', inset: 0,
            zIndex: 30000,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #1e293b 0%, #7c3aed 18%, #f97316 55%, #fbbf24 78%, #fde68a 100%)',
            animation: showCelebration ? 'sunsetFadeOut 2.4s ease-out forwards' : 'skyToDusk 1.4s ease-out forwards',
        }}>
            <Day200Styles />

            {/* Soleil qui descend vers l'horizon */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 'clamp(120px, 30vw, 220px)',
                height: 'clamp(120px, 30vw, 220px)',
                borderRadius: '50%',
                background: 'radial-gradient(circle, #fffbe6 0%, #fde68a 40%, #fb923c 75%, rgba(249,115,22,0) 100%)',
                boxShadow: '0 0 90px rgba(251, 191, 36, 0.7), 0 0 180px rgba(251, 146, 60, 0.4)',
                animation: 'sunSink 2.6s ease-in 1.4s forwards',
                transform: 'translate(-50%, -10vh)',
            }} />

            {/* Mer scintillante en bas */}
            <div style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                height: '34vh',
                background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.35) 0%, rgba(14, 165, 233, 0.55) 60%, rgba(30, 41, 59, 0.85) 100%)',
            }}>
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.18) 0px, transparent 3px, transparent 14px)',
                    animation: 'seaShimmer 3s ease-in-out infinite',
                }} />
            </div>

            {showReveal && (
                <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '0 20px' }}>
                    <div style={{
                        fontSize: 'clamp(1.8rem, 7vw, 3.6rem)',
                        fontWeight: 900,
                        fontFamily: "'Georgia', serif",
                        color: '#fffdf5',
                        textShadow: '0 4px 24px rgba(180, 83, 9, 0.6), 0 0 50px rgba(251, 191, 36, 0.5)',
                        animation: 'sunsetReveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        letterSpacing: '2px', lineHeight: 1.15,
                    }}>
                        COUCHER DE SOLEIL<br />PARFAIT
                    </div>
                    <div style={{
                        marginTop: '18px',
                        fontSize: 'clamp(0.9rem, 3.2vw, 1.2rem)',
                        color: 'rgba(255, 253, 245, 0.92)',
                        fontFamily: "'Georgia', serif",
                        fontStyle: 'italic',
                        textShadow: '0 2px 10px rgba(180, 83, 9, 0.5)',
                        animation: 'lineFadeUp 0.5s ease-out 0.5s both',
                    }}>
                        200 jours bouclés. Chapeau. 🌅🐚
                    </div>
                </div>
            )}

            {showCelebration && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    {SUNSET_PARTICLES.map(p => {
                        const rad = (p.angle * Math.PI) / 180;
                        const shapes = ['50%', '3px', '3px'];
                        const widths = [p.size, p.size, p.size * 0.5];
                        const heights = [p.size, p.size, p.size * 1.6];
                        return (
                            <div key={p.id} style={{
                                position: 'absolute',
                                left: '50%', top: '46%',
                                width: widths[p.shape],
                                height: heights[p.shape],
                                borderRadius: shapes[p.shape],
                                background: p.color,
                                '--dx': Math.cos(rad) * p.distance,
                                '--dy': -Math.sin(rad) * p.distance,
                                '--grav': p.grav,
                                animation: `day200Confetti ${p.duration}ms forwards ${p.delay}ms`,
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
    introKey: 'day200_welcome_shown',
    doneKey: 'day200_sunset_seen',
    keepAmbianceAfterReward: true, // l'ambiance plage perdure même après le coucher de soleil
    activeClasses: ['day200-global'],
    doneClass: null,
    Intro: Day200WelcomeModal,
    Overlay: Day200Overlay,
    Reward: Day200SunsetAnimation,
});
