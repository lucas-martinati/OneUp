import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { BADGE_DEFINITIONS, BADGE_ICONS, getBadgeIconFromDef } from '../config/badgeDefinitions';
import { Z_INDEX } from '../utils/zIndex';

/**
 * Affiche une notification de succès en haut de l'écran (composant interne)
 */
function AchievementNotification({ achievement, onClose, onView }) {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [translateX, setTranslateX] = useState(0);
    const [noTransition, setNoTransition] = useState(false);
    const startX = useRef(0);
    const isDragging = useRef(false);

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onClose, 300);
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    if (!achievement) return null;

    const Icon = achievement.icon;

    const handleClick = () => {
        if (Math.abs(translateX) > 50) return;
        setIsExiting(true);
        setTimeout(() => {
            onClose();
            onView?.();
        }, 200);
    };

    const handleTouchStart = (e) => {
        startX.current = e.touches[0].clientX;
        isDragging.current = true;
        setNoTransition(true);
    };

    const handleTouchMove = (e) => {
        if (!isDragging.current) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX.current;
        setTranslateX(diff * 0.5);
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        setNoTransition(false);
        if (Math.abs(translateX) > 25) {
            setIsExiting(true);
            setTimeout(onClose, 200);
        } else {
            setTranslateX(0);
        }
    };

    return createPortal(
        <div style={{
            position: 'fixed', top: 'calc(var(--spacing-md) + env(safe-area-inset-top))', left: '50%',
            transform: `translateX(calc(-50% + ${translateX}px)) translateY(${isExiting ? -20 : (isVisible ? 0 : -100)}px)`,
            zIndex: Z_INDEX.DELETE_OVERLAY,
            opacity: isExiting ? 0 : (isVisible ? 1 : 0),
            transition: noTransition ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isVisible && !isExiting ? 'auto' : 'none',
            maxWidth: 'calc(100vw - 32px)'
        }}>
            <div
                onClick={handleClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="glass hover-lift"
                style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: '12px',
                    background: `linear-gradient(135deg, ${achievement.color}33, ${achievement.color}22)`,
                    border: `1px solid ${achievement.color}66`,
                    boxShadow: `0 4px 20px ${achievement.color}44`,
                    minWidth: '280px', cursor: 'pointer'
                }}
            >
                <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: `${achievement.color}44`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                }}>
                    <Icon size={22} color={achievement.color} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {t('achievementToast.title')}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: achievement.color }}>
                        {achievement.title}
                    </div>
                </div>
                <ChevronRight size={20} color={achievement.color} />
            </div>
        </div>,
        document.body
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
    const [currentAchievement, setCurrentAchievement] = useState(null);
    const { t } = useTranslation();

    const showAchievement = useCallback((badgeId) => {
        const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId);
        if (!badge) {
            console.warn('Badge not found:', badgeId);
            return;
        }

        const IconComponent = getBadgeIconFromDef(badge);
        setCurrentAchievement({
            id: badge.id,
            title: t(`achievements.badges.${badge.id}.title`, badge.id),
            color: badge.color,
            icon: IconComponent
        });

        // Validate badge after showing notification
        if (onValidateBadge) {
            onValidateBadge(badgeId);
        }
    }, [t, onValidateBadge]);

    const hideAchievement = useCallback(() => {
        setCurrentAchievement(null);
    }, []);

    const handleView = useCallback(() => {
        hideAchievement();
        onViewAchievement?.();
    }, [hideAchievement, onViewAchievement]);

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
                const IconComponent = BADGE_ICONS.Star;
                setCurrentAchievement({
                    id: 'custom',
                    title: title,
                    color: color || '#fbbf24',
                    icon: IconComponent
                });
            }
        };

        window.addEventListener('show-achievement', handleShowAchievement);
        window.addEventListener('show-achievement-custom', handleShowCustom);

        return () => {
            window.removeEventListener('show-achievement', handleShowAchievement);
            window.removeEventListener('show-achievement-custom', handleShowCustom);
        };
    }, [showAchievement]);

    return {
        showAchievement,
        hideAchievement,
        AchievementToast: currentAchievement ? (
            <AchievementNotification
                achievement={currentAchievement}
                onClose={hideAchievement}
                onView={handleView}
            />
        ) : null
    };
}

/**
 * Version autonome du composant - pour usage direct
 */
export function AchievementToast({ achievement, onClose, onView }) {
    return <AchievementNotification achievement={achievement} onClose={onClose} onView={onView} />;
}