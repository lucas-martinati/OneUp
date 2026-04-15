import { useState, useEffect, useRef, useCallback } from 'react';
import { BADGE_DEFINITIONS, getBadgeIconFromDef, isBadgeUnlocked } from '../config/badgeDefinitions';

/**
 * Hook de détection des nouveaux badges débloqués.
 * Retourne l'objet achievement à afficher dans le toast.
 * 
 * @param {Object} computedStats - Les stats calculées (badgeCount, totalDays, etc.)
 * @param {Object} t - Fonction de traduction
 * @returns {Object|null} L achievement à afficher ou null
 */
export function useNewAchievement(computedStats, t) {
    const prevUnlockedIdsRef = useRef(null);
    const [newAchievement, setNewAchievement] = useState(null);

    useEffect(() => {
        // Collect current stats needed for badge testing
        const statsSnapshot = {
            totalDays: computedStats.totalDays,
            maxStreak: computedStats.maxStreak,
            totalRepsAll: computedStats.totalRepsAll,
            perfectDays: computedStats.perfectDays,
            hasCompletedAllExercisesOnce: computedStats.hasCompletedAllExercisesOnce,
            weekdayWorkouts: computedStats.weekdayWorkouts,
            weekendWorkouts: computedStats.weekendWorkouts,
            morningWorkouts: computedStats.morningWorkouts,
            afternoonWorkouts: computedStats.afternoonWorkouts,
            eveningWorkouts: computedStats.eveningWorkouts,
            ghostWorkout: computedStats.ghostWorkout,
            perfectStreak: computedStats.perfectStreak,
            hasShared: computedStats.hasShared,
        };

        const currentManual = computedStats.manualBadges || {};
        
        // Calculate current set of unlocked IDs
        const currentUnlockedIds = new Set();
        for (const def of BADGE_DEFINITIONS) {
            if (isBadgeUnlocked(def.id, statsSnapshot, currentManual)) {
                currentUnlockedIds.add(def.id);
            }
        }

        // Skip detection on first run, just initialize the ref
        if (prevUnlockedIdsRef.current === null) {
            prevUnlockedIdsRef.current = currentUnlockedIds;
            return;
        }

        // Find difference: IDs in current but not in prev
        const newIds = [...currentUnlockedIds].filter(id => !prevUnlockedIdsRef.current.has(id));

        if (newIds.length > 0) {
            // Find the badge definition for the first new ID
            const newBadge = BADGE_DEFINITIONS.find(b => b.id === newIds[0]);
            
            if (newBadge) {
                const IconComponent = getBadgeIconFromDef(newBadge);
                queueMicrotask(() => setNewAchievement({
                    id: newBadge.id,
                    title: t(`achievements.badges.${newBadge.id}.title`, newBadge.id),
                    color: newBadge.color,
                    icon: IconComponent
                }));
            }
        }

        // Update the ref for next comparison
        prevUnlockedIdsRef.current = currentUnlockedIds;
    }, [
        computedStats.badgeCount, computedStats.totalDays, computedStats.maxStreak, computedStats.totalRepsAll,
        computedStats.perfectDays, computedStats.hasCompletedAllExercisesOnce, computedStats.weekdayWorkouts,
        computedStats.weekendWorkouts, computedStats.morningWorkouts, computedStats.afternoonWorkouts,
        computedStats.eveningWorkouts, computedStats.ghostWorkout, computedStats.perfectStreak,
        computedStats.hasShared, computedStats.manualBadges, t
    ]);

    // Callback pour fermer le toast
    const clearAchievement = useCallback(() => setNewAchievement(null), []);

    return { achievement: newAchievement, clearAchievement };
}