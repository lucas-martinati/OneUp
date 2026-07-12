import { useState, useEffect, useRef, useCallback } from 'react';
import { BADGE_DEFINITIONS, getBadgeIconFromDef, isBadgeUnlocked, getBadgeById } from '@config/badgeDefinitions';

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
    const [isReady, setIsReady] = useState(false);

    // Initial timeout to prevent flashes of achievements on page load
    // due to asynchronous context hydration (e.g., custom exercises or cloud sync).
    useEffect(() => {
        const timer = setTimeout(() => setIsReady(true), 2500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Badge testing reads the shared snapshot (@shared/achievementStats.js) so
        // the toast fires for exactly the badges the leaderboard count reflects.
        const statsSnapshot = computedStats.badgeStats || {};

        const currentManual = computedStats.achievements || {};
        
        // Calculate current set of unlocked IDs
        const currentUnlockedIds = new Set();
        for (const def of BADGE_DEFINITIONS) {
            if (isBadgeUnlocked(def.id, statsSnapshot, currentManual)) {
                currentUnlockedIds.add(def.id);
            }
        }

        // Skip detection on first run or during hydration phase, just initialize the ref
        if (!isReady || prevUnlockedIdsRef.current === null) {
            prevUnlockedIdsRef.current = currentUnlockedIds;
            return;
        }

        // Find difference: IDs in current but not in prev
        const newIds = [...currentUnlockedIds].filter(id => !prevUnlockedIdsRef.current.has(id));

        if (newIds.length > 0) {
            // Find the badge definition for the first new ID
            const newBadge = getBadgeById(newIds[0]);
            
            if (newBadge) {
                const IconComponent = getBadgeIconFromDef(newBadge);
                setNewAchievement({
                    id: newBadge.id,
                    title: t(`achievements.badges.${newBadge.id}.title`, newBadge.id),
                    color: newBadge.color,
                    icon: IconComponent
                });
            }
        }

        // Update the ref for next comparison
        prevUnlockedIdsRef.current = currentUnlockedIds;
    }, [computedStats.badgeCount, computedStats.badgeStats, computedStats.achievements, t, isReady]);

    // Callback pour fermer le toast
    const clearAchievement = useCallback(() => setNewAchievement(null), []);

    return { achievement: newAchievement, clearAchievement };
}