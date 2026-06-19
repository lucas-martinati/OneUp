import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Sparkles } from '../utils/icons';
import { BADGE_DEFINITIONS, BADGE_ICONS, getBadgeIconFromDef } from '../config/badgeDefinitions';
import { useToastGestures } from './useToastGestures';
import { getToastRoot } from '../components/feedback/toastRoot';

const TOAST_DURATION_MS = 5000;

/**
 * Affiche une notification de succès en haut de l'écran (composant interne)
 */
function AchievementNotification({ achievement, count = 1, onClose, onView }) {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    // Auto-dismiss + swipe-to-dismiss are shared with the poke toast.
    const { exit, cardProps } = useToastGestures({
        onClose,
        onTap: onView,
        duration: TOAST_DURATION_MS,
    });
    const { style: gestureStyle, ...gestureHandlers } = cardProps;

    useEffect(() => {
        const id = requestAnimationFrame(() => setIsVisible(true));
        return () => cancelAnimationFrame(id);
    }, []);

    if (!achievement) return null;

    const Icon = achievement.icon;

    return createPortal(
        <div style={{
            order: 0, // achievements sit on top of the shared toast stack
            // While leaving, drop out of the flex flow so the poke below rises
            // to the top immediately instead of waiting for the exit to finish.
            ...(exit ? { position: 'absolute', left: 0, right: 0, top: 0, margin: '0 auto' } : null),
            transform: `translateY(${isVisible ? '0' : '-24px'})`,
            opacity: isVisible ? 1 : 0,
            transition: 'transform 0.34s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease',
            pointerEvents: isVisible && !exit ? 'auto' : 'none',
            maxWidth: 'min(360px, calc(100vw - 32px))', width: '100%',
            display: 'flex', justifyContent: 'center'
        }}>
            <div
                {...gestureHandlers}
                className="hover-lift"
                style={{
                    position: 'relative', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 18px 16px 14px', borderRadius: '18px',
                    background: `linear-gradient(135deg, ${achievement.color}26, rgba(0,0,0,0)) , var(--tooltip-bg)`,
                    border: `1px solid ${achievement.color}55`,
                    boxShadow: `0 10px 34px rgba(0,0,0,0.45), 0 6px 22px ${achievement.color}3a`,
                    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                    minWidth: '290px', cursor: 'pointer',
                    ...gestureStyle,
                }}
            >
                {/* One-shot light sweep on appear */}
                <span aria-hidden style={{
                    position: 'absolute', top: 0, bottom: 0, left: 0, width: '45%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)',
                    animation: 'toastSheen 1.3s cubic-bezier(0.22,1,0.36,1) 0.25s 1 forwards',
                    opacity: 0,
                    pointerEvents: 'none'
                }} />

                {/* Glossy medallion */}
                <div style={{
                    position: 'relative', flexShrink: 0,
                    width: '46px', height: '46px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `radial-gradient(circle at 32% 26%, ${achievement.color}, ${achievement.color}cc)`,
                    border: `2px solid ${achievement.color}`,
                    boxShadow: `0 4px 16px ${achievement.color}66, inset 0 1px 2px rgba(255,255,255,0.4)`
                }}>
                    <Icon size={23} color="#fff" />
                    <span style={{
                        position: 'absolute', top: '-3px', right: '-3px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Sparkles size={14} color="#fff" fill="#fff" style={{ filter: `drop-shadow(0 0 4px ${achievement.color})` }} />
                    </span>
                    {count > 1 && (
                        <span className="scale-in" style={{
                            position: 'absolute', top: '-7px', left: '-7px',
                            minWidth: '20px', height: '20px', padding: '0 5px',
                            borderRadius: '10px', display: 'grid', placeItems: 'center',
                            fontSize: '0.68rem', fontWeight: 900, color: '#fff',
                            background: achievement.color,
                            border: '2px solid var(--tooltip-bg)',
                            boxShadow: `0 2px 8px ${achievement.color}88`
                        }}>
                            ×{count}
                        </span>
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        fontSize: '0.62rem', fontWeight: 800, color: achievement.color,
                        textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px'
                    }}>
                        <Sparkles size={11} />
                        {t('achievementToast.title')}
                    </div>
                    <div style={{
                        fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)',
                        lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                        {achievement.title}
                    </div>
                </div>

                <ChevronRight size={20} color="var(--text-secondary)" style={{ flexShrink: 0, opacity: 0.7 }} />

                {/* Auto-dismiss countdown bar */}
                {!exit && (
                    <span aria-hidden style={{
                        position: 'absolute', left: 0, bottom: 0, height: '3px', width: '100%',
                        transformOrigin: 'left', background: achievement.color, opacity: 0.85,
                        animation: `toastCountdown ${TOAST_DURATION_MS}ms linear forwards`,
                        pointerEvents: 'none'
                    }} />
                )}
            </div>
        </div>,
        getToastRoot()
    );
}

/**
 * Hook pour afficher des notifications de succès
 * 
 * Usage:
 * const { showAchievement, AchievementToast } = useAchievementToast(onViewAchievement, onValidateBadge)
 * 
 * showAchievement('first_share') - affiche le toast du badge
 * 
 * Écout aussi les événements window pour les tests console:
 * - show-achievement: { badgeId }
 * - show-achievement-custom: { title, color }
 * 
 * Le composant AchievementToast doit être rendu dans le JSX
 */
export function useAchievementToast(onViewAchievement, onValidateBadge) {
    // toast = { achievement, count, seq } — while one is showing, further
    // unlocks bump `count` and show the latest badge instead of stacking.
    const [toast, setToast] = useState(null);
    const { t } = useTranslation();

    const pushAchievement = useCallback((achievement) => {
        setToast(prev => ({
            achievement,
            count: prev ? prev.count + 1 : 1,
            seq: (prev?.seq || 0) + 1,
        }));
    }, []);

    const showAchievement = useCallback((badgeId) => {
        const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId);
        if (!badge) {
            console.warn('Badge not found:', badgeId);
            return;
        }

        const IconComponent = getBadgeIconFromDef(badge);
        pushAchievement({
            id: badge.id,
            title: t(`achievements.badges.${badge.id}.title`, badge.id),
            color: badge.color,
            icon: IconComponent
        });

        // Validate badge after showing notification
        if (onValidateBadge) {
            onValidateBadge(badgeId);
        }
    }, [t, onValidateBadge, pushAchievement]);

    const hideAchievement = useCallback(() => {
        setToast(null);
    }, []);

    const handleView = useCallback(() => {
        const viewedId = toast?.achievement?.id;
        hideAchievement();
        onViewAchievement?.(viewedId);
    }, [hideAchievement, onViewAchievement, toast]);

    // Écoute les événements globaux pour afficher des achievements
    // Permet aux composants enfants (ex: ShareModal) de trigger un toast sans prop drilling
    useEffect(() => {
        const handleShowAchievement = (e) => {
            const { badgeId } = e.detail || {};
            if (badgeId) {
                showAchievement(badgeId);
            }
        };

        const handleShowCustom = (e) => {
            const { title, color } = e.detail || {};
            if (title) {
                pushAchievement({
                    id: 'custom',
                    title,
                    color: color || '#fbbf24',
                    icon: BADGE_ICONS.Star
                });
            }
        };

        window.addEventListener('show-achievement', handleShowAchievement);
        window.addEventListener('show-achievement-custom', handleShowCustom);

        return () => {
            window.removeEventListener('show-achievement', handleShowAchievement);
            window.removeEventListener('show-achievement-custom', handleShowCustom);
        };
    }, [showAchievement, pushAchievement]);

    return {
        showAchievement,
        hideAchievement,
        AchievementToast: toast ? (
            <AchievementNotification
                key={toast.seq}
                achievement={toast.achievement}
                count={toast.count}
                onClose={hideAchievement}
                onView={handleView}
            />
        ) : null
    };
}
