/**
 * Registre des événements spéciaux du dashboard.
 *
 * Pour ajouter un événement : crée son fichier via `makeEventManager(...)`
 * puis ajoute-le à `EVENT_MANAGERS` ci-dessous. `<DashboardEvents />` les rend
 * tous avec le même contexte — plus aucune duplication de props côté Dashboard.
 */
import React from 'react';
import { Day100EventManager } from './Day100Event';
import { Day200EventManager } from './Day200Event';
import { Day300EventManager } from './Day300Event';

// Emplacement du HUD d'événement (thermomètre, constellation…) à placer dans le
// layout des hôtes qui doivent l'afficher (Dashboard, ExercisePanel).
export { EventHud } from './EventHud';

const EVENT_MANAGERS = [
    Day100EventManager,
    Day200EventManager,
    Day300EventManager,
];

/**
 * @param {object} props - contexte partagé : { dayNumber, today, getExerciseCount, getConfig, completions }
 */
export function DashboardEvents(props) {
    return (
        <>
            {EVENT_MANAGERS.map((EventManager, i) => (
                <EventManager key={i} {...props} />
            ))}
        </>
    );
}
