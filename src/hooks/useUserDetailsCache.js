import { useRef, useCallback } from 'react';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Cache for user details loaded from cloud (leaderboard user profiles).
 * Avoids re-fetching data when the user opens the same profile multiple times.
 *
 * @param {Object} cloudSync - cloud sync service with loadUserDetails(uid)
 * @returns {{ loadUserDetails: (uid: string) => Promise<Object> }}
 */
export function useUserDetailsCache(cloudSync) {
    const cacheRef = useRef(new Map());

    const loadUserDetails = useCallback(async (uid) => {
        const cached = cacheRef.current.get(uid);
        const now = Date.now();

        // Return cached data if still fresh
        if (cached && (now - cached.timestamp) < CACHE_TTL) {
            return cached.data;
        }

        // Fetch fresh data
        const data = await cloudSync.loadUserDetails(uid);

        // Store in cache
        cacheRef.current.set(uid, { data, timestamp: now });

        return data;
    }, [cloudSync]);

    return { loadUserDetails };
}
