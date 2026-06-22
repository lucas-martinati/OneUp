/**
 * eventEngine — Moteur mutualisé des événements spéciaux du dashboard.
 *
 * Chaque événement (Jour 100, Jour 200, Jour 300…) partage exactement le même
 * cycle de vie : une modale d'intro affichée une fois par session, une ambiance
 * qui habille tout le dashboard, et une récompense rejouée une seule fois quand
 * la journée devient parfaite. Toute cette logique vit ici ; un événement ne
 * fournit plus que son DÉCLENCHEUR, ses CLÉS de stockage et ses 3 VUES.
 *
 * Ajouter un événement = créer son fichier avec `makeEventManager(descriptor)`
 * puis l'enregistrer dans `index.jsx`. Rien à dupliquer.
 */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { EXERCISES, getDailyGoal } from '@config/exercises';
import { useEventHudStore } from './eventHudStore';

/** PRNG déterministe (mêmes décors d'un rendu à l'autre, sans état). */
export const seeded = (i, salt = 0) => {
    const x = Math.sin((i + 1) * 9301 + salt * 4957) * 49297;
    return x - Math.floor(x);
};

/**
 * Vrai si TOUS les exercices du jour ont atteint leur objectif (journée parfaite).
 * Calcul identique pour tous les événements ; ne tourne que si l'event est actif.
 */
function useIsDayPerfect(active, { today, dayNumber, getExerciseCount, getConfig, completions }) {
    return useMemo(() => {
        if (!active) return false;
        return EXERCISES.length > 0 && EXERCISES.every(ex => {
            const count = getExerciseCount(today, ex.id);
            const exDiff = getConfig(ex.id, today).difficulty;
            const goal = getDailyGoal(ex, dayNumber, exDiff);
            return completions[today]?.[ex.id]?.isCompleted || count >= goal;
        });
    }, [active, today, completions, dayNumber, getExerciseCount, getConfig]);
}

/**
 * Machine à états commune : intro (1×/session) → ambiance → récompense (1×).
 *
 * @param keepAmbianceAfterReward  Si vrai, l'ambiance reste affichée même après
 *   la récompense (ex. Jour 200 : la plage perdure). Si faux, l'ambiance s'éteint
 *   une fois l'event « terminé » (ex. Jour 100 : la malédiction est levée).
 * @param autoReward  Si vrai (défaut), la récompense se déclenche automatiquement
 *   dès que la journée est parfaite. Si faux, c'est l'ambiance (l'Overlay) qui
 *   décide quand terminer, via le `onSolve` qu'on lui passe — utile pour les
 *   events à mécanique interactive (mini-jeu, défi…) plutôt que « journée parfaite ».
 */
function useEventLifecycle({ active, perfect, introKey, doneKey, keepAmbianceAfterReward, autoReward }) {
    const [introShown, setIntroShown] = useState(() => active && !!sessionStorage.getItem(introKey));
    const [done, setDone] = useState(() => active && !!localStorage.getItem(doneKey));
    const [showReward, setShowReward] = useState(false);
    const rewardTriggered = useRef(false);

    // Journée déjà parfaite AVANT l'intro (bouclée lors d'une session précédente)
    // → on marque l'event terminé silencieusement, sans rejouer la récompense.
    // Réservé aux events « auto » : un event interactif ne se termine qu'à l'action.
    useEffect(() => {
        if (!autoReward) return;
        if (active && perfect && !done && !introShown) {
            setTimeout(() => {
                setDone(true);
                localStorage.setItem(doneKey, '1');
            }, 0);
        }
    }, [autoReward, active, perfect, done, introShown, doneKey]);

    const showIntro = active && !introShown && !done;
    const ambianceActive = active && !showReward &&
        (keepAmbianceAfterReward ? (introShown || done) : (introShown && !done));

    const dismissIntro = useCallback(() => {
        setIntroShown(true);
        sessionStorage.setItem(introKey, '1');
    }, [introKey]);

    // Déclenche la récompense une seule fois (impérativement ou automatiquement).
    const triggerReward = useCallback(() => {
        if (rewardTriggered.current) return;
        rewardTriggered.current = true;
        setShowReward(true);
    }, []);

    // Events « auto » : récompense automatique quand la journée devient parfaite.
    useEffect(() => {
        if (!autoReward) return;
        const themeOn = active && introShown && !done;
        if (!themeOn || !perfect || rewardTriggered.current) return;
        let cancelled = false;
        queueMicrotask(() => { if (!cancelled) triggerReward(); });
        return () => { cancelled = true; };
    }, [autoReward, active, introShown, done, perfect, triggerReward]);

    const completeReward = useCallback(() => {
        setShowReward(false);
        setDone(true);
        localStorage.setItem(doneKey, '1');
    }, [doneKey]);

    return { showIntro, ambianceActive, showReward, done, dismissIntro, completeReward, triggerReward };
}

const resolveKey = (key, ctx) => (typeof key === 'function' ? key(ctx) : key);

/**
 * Construit un gestionnaire d'événement « plug & play » à partir d'un descripteur :
 *
 *   {
 *     isActive(ctx)              → l'event doit-il tourner aujourd'hui ?
 *     introKey / doneKey         → clés de stockage (string ou (ctx) => string)
 *     keepAmbianceAfterReward    → l'ambiance survit-elle à la récompense ?
 *     activeClasses / doneClass  → classes posées sur #root
 *     Intro / Reward             → vues plein écran (onDismiss / onComplete)
 *     Decor                      → ambiance de fond (overlay fixe, atmosphère)
 *     Hud                        → widget INTÉGRÉ (thermomètre, constellation…),
 *                                  publié dans le store et rendu par les hôtes
 *                                  (Dashboard / ExercisePanel) via <EventHud />.
 *     hudProps(ctx)              → props live (reps, validés…) passées au Hud.
 *   }
 */
export function makeEventManager(descriptor) {
    const {
        isActive,
        introKey,
        doneKey,
        keepAmbianceAfterReward = false,
        autoReward = true,
        activeClasses = [],
        doneClass = null,
        // Avancée live (ex. reps/exercices validés). Fonction pure (ctx) => props.
        hudProps: hudPropsFn,
        Intro,
        Decor,
        Hud,
        Reward,
    } = descriptor;

    return function EventManager(ctx) {
        const active = isActive(ctx);
        const perfect = useIsDayPerfect(active, ctx);

        const {
            showIntro, ambianceActive, showReward, done,
            dismissIntro, completeReward, triggerReward,
        } = useEventLifecycle({
            active,
            perfect,
            introKey: resolveKey(introKey, ctx),
            doneKey: resolveKey(doneKey, ctx),
            keepAmbianceAfterReward,
            autoReward,
        });

        useEffect(() => {
            const root = document.getElementById('root');
            if (!root) return;

            if (ambianceActive) root.classList.add(...activeClasses);
            else root.classList.remove(...activeClasses);

            if (doneClass) {
                root.classList.toggle(doneClass, done);
            }

            return () => {
                root.classList.remove(...activeClasses);
                if (doneClass) root.classList.remove(doneClass);
            };
        }, [ambianceActive, done]);

        // ── HUD intégré : on le publie dans le store ; ce sont le Dashboard et
        //    l'ExercisePanel qui le rendent dans leur layout (via <EventHud />). ──
        const hudLive = ambianceActive && Hud && hudPropsFn ? hudPropsFn(ctx) : null;
        const hudKey = hudLive ? JSON.stringify(hudLive) : '';

        useEffect(() => {
            if (!ambianceActive || !Hud) return;
            useEventHudStore.getState().setHud({
                Component: Hud,
                props: { onSolve: triggerReward, ...(hudLive || {}) },
            });
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [ambianceActive, hudKey, triggerReward]);

        // Retire le HUD quand l'ambiance s'éteint (ou au démontage).
        useEffect(() => {
            if (!ambianceActive || !Hud) return undefined;
            return () => useEventHudStore.getState().setHud(null);
        }, [ambianceActive]);

        if (!active) return null;

        return (
            <>
                {showIntro && <Intro onDismiss={dismissIntro} />}
                {showReward && <Reward onComplete={completeReward} />}
                {ambianceActive && Decor && <Decor />}
            </>
        );
    };
}
