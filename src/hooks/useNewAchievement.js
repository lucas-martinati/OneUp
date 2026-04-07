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
    const prevBadgeCountRef = useRef(null);
    const prevManualBadgesRef = useRef({});
    const [newAchievement, setNewAchievement] = useState(null);

    useEffect(() => {
        const prevCount = prevBadgeCountRef.current;
        const newCount = computedStats.badgeCount;

        // Skip on first render (prevCount is null)
        if (prevCount === null) {
            prevBadgeCountRef.current = newCount;
            prevManualBadgesRef.current = computedStats.manualBadges || {};
            return;
        }

        if (newCount > prevCount) {
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
            const prevManual = prevManualBadgesRef.current;

            let newBadge = null;
            for (const def of BADGE_DEFINITIONS) {
                const wasUnlocked = isBadgeUnlocked(def.id, { ...statsSnapshot, ...prevManual }, prevManual);
                const isNowUnlocked = isBadgeUnlocked(def.id, statsSnapshot, currentManual);

                if (!wasUnlocked && isNowUnlocked) {
                    newBadge = def;
                    break;
                }
            }

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

        prevBadgeCountRef.current = newCount;
        prevManualBadgesRef.current = computedStats.manualBadges || {};
    }, [computedStats.badgeCount, computedStats.totalDays, computedStats.maxStreak, computedStats.totalRepsAll,
        computedStats.perfectDays, computedStats.hasCompletedAllExercisesOnce, computedStats.weekdayWorkouts,
        computedStats.weekendWorkouts, computedStats.morningWorkouts, computedStats.afternoonWorkouts,
        computedStats.eveningWorkouts, computedStats.ghostWorkout, computedStats.perfectStreak,
        computedStats.hasShared, computedStats.manualBadges, t]);

    // Callback pour fermer le toast
    const clearAchievement = useCallback(() => setNewAchievement(null), []);

    return { achievement: newAchievement, clearAchievement };
}