import React from 'react';
import { useEventHudStore } from './eventHudStore';

/**
 * Emplacement d'affichage du HUD d'événement, à placer DANS le layout d'un hôte
 * (Dashboard, ExercisePanel). Il rend le HUD publié par l'event actif, intégré
 * au flux de la page — donc sans superposition possible.
 *
 * @param {'dashboard'|'panel'} placement - où l'on se trouve (ajuste le style).
 *
 * N'affiche rien si aucun event n'est actif. Comme seuls le Dashboard et
 * l'ExercisePanel montent ce composant, le HUD n'apparaît QUE là, nulle part ailleurs.
 */
export function EventHud({ placement = 'dashboard', hidden = false }) {
    const hud = useEventHudStore(s => s.hud);
    if (!hud) return null;
    const { Component, props } = hud;
    return <Component {...props} placement={placement} hidden={hidden} />;
}
