import React, { createContext, useContext, useCallback } from 'react';

const AchievementContext = createContext(null);

export function AchievementProvider({ children, setHasShared, showAchievement }) {
    const grantAchievement = useCallback((badgeId) => {
        if (badgeId === 'first_share') {
            setHasShared();
        }
        showAchievement(badgeId);
    }, [setHasShared, showAchievement]);

    return (
        <AchievementContext.Provider value={{ grantAchievement }}>
            {children}
        </AchievementContext.Provider>
    );
}

export function useGrantAchievement() {
    const context = useContext(AchievementContext);
    if (!context) {
        throw new Error('useGrantAchievement must be used within an AchievementProvider');
    }
    return context.grantAchievement;
}