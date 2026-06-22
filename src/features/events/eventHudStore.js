import { create } from 'zustand';

/**
 * Petit store qui transporte le HUD de l'événement actif (thermomètre Jour 200,
 * constellation Jour 300…) du gestionnaire d'event vers les hôtes qui l'AFFICHENT
 * réellement dans leur propre layout (le Dashboard et l'ExercisePanel).
 *
 * Pourquoi : le HUD doit être INTÉGRÉ à l'interface (et non flotter en overlay
 * fixe par-dessus tout), pour ne jamais se superposer au contenu quel que soit
 * l'appareil. Le gestionnaire publie ici { Component, props } ; les emplacements
 * (`<EventHud />`) le rendent là où il y a de la place.
 */
export const useEventHudStore = create((set) => ({
    hud: null, // { Component, props } | null
    setHud: (hud) => set({ hud }),
}));
