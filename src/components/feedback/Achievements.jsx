import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Lock } from 'lucide-react';
import { BADGE_DEFINITIONS } from '../../config/badgeDefinitions';

const CATEGORIES = [
    { id: 'streak', titleKey: 'achievements.categories.streak', color: '#f97316' },
    { id: 'quantite', titleKey: 'achievements.categories.quantity', color: '#22c55e' },
    { id: 'volume', titleKey: 'achievements.categories.volume', color: '#ef4444' },
    { id: 'perfection', titleKey: 'achievements.categories.perfection', color: '#22d3d1' },
    { id: 'horaires', titleKey: 'achievements.categories.horaires', color: '#fb923c' },
    { id: 'secrets', titleKey: 'achievements.categories.secrets', color: '#6b7280' }
];

const BadgeItem = React.memo(({ badge }) => {
    const { t } = useTranslation();
    const Icon = badge.icon;
    const displayTitle = badge.titleKey ? t(badge.titleKey) : (badge.secret ? t('achievements.badges.secret') : '???');
    const displayDesc = badge.descKey && badge.unlocked ? t(badge.descKey) : (badge.secret ? '🔒 ??????' : (badge.descKey ? t(badge.descKey) : ''));
    
    return (
        <div
            style={{
                padding: '16px 12px',
                borderRadius: 'var(--radius-xl)',
                textAlign: 'center',
                background: badge.unlocked ? `${badge.color}15` : 'var(--surface-muted)',
                border: badge.unlocked ? `1px solid ${badge.color}44` : '1px solid var(--border-subtle)',
                opacity: badge.unlocked ? 1 : 0.6,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                minHeight: '140px'
            }}>
            
            <div style={{
                width: '46px', height: '46px', borderRadius: '50%',
                background: badge.unlocked ? `${badge.color}15` : 'var(--surface-hover)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '12px'
            }}>
                <Icon size={22} color={badge.unlocked ? badge.color : 'var(--text-secondary)'} />
            </div>
            
            <div style={{
                fontSize: '0.85rem', fontWeight: '800',
                color: badge.unlocked ? 'var(--text-primary)' : 'var(--text-secondary)',
                marginBottom: '4px', lineHeight: 1.2
            }}>
                {displayTitle}
            </div>
            
            <div style={{
                fontSize: '0.65rem', color: badge.unlocked ? 'var(--text-secondary)' : 'var(--text-tertiary)', 
                lineHeight: 1.3, flex: 1, display: 'flex', alignItems: 'center'
            }}>
                {displayDesc}
            </div>
            
            {badge.unlocked && (
                <div style={{
                    marginTop: '10px', fontSize: '0.6rem',
                    background: `${badge.color}15`, 
                    color: badge.color,
                    padding: '3px 8px', borderRadius: '12px', fontWeight: '800',
                    textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>
                    {t('achievements.validated')}
                </div>
            )}
        </div>
    );
});

export function Achievements({ completions, exercises, onClose, settings, getDayNumber, computedStats }) {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    
    // Use refs for drag state to avoid React re-renders which causes jank with long lists
    const sheetRef = useRef(null);
    const overlayRef = useRef(null);
    const startY = useRef(0);
    const isDragging = useRef(false);
    
    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => onClose(), 300); // 300ms to allow spring animation to run
    }, [onClose]);

    useEffect(() => {
        requestAnimationFrame(() => {
            setIsVisible(true);
        });
    }, []);

    useEffect(() => {
        history.pushState({ sheetOpen: true }, '');
        const handlePopState = () => handleClose();
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [handleClose]);

    // Touch/Mouse Handlers optimized with DOM refs
    const handleStart = (y) => {
        const contentEl = sheetRef.current?.querySelector('[data-scroll-content]');
        // Only allow dragging if we are at the top of the scroll content, or clicking the header area (y < 100)
        const canScrollUp = contentEl ? contentEl.scrollTop > 0 : false;
        
        if (!canScrollUp || y < 100) {
            startY.current = y;
            isDragging.current = true;
            // Removed transition='none' here so it doesn't mutate DOM on simple clicks
        }
    };
    
    const handleMove = (y) => {
        if (!isDragging.current) return;
        const diff = y - startY.current;
        if (diff > 0) {
            // First time it moves, remove transition for instant drag follow
            if (sheetRef.current && sheetRef.current.style.transition !== 'none') {
                sheetRef.current.style.transition = 'none';
            }
            if (overlayRef.current && overlayRef.current.style.transition !== 'none') {
                overlayRef.current.style.transition = 'none';
            }
            
            const dragPx = diff * 0.6; // Resistance factor
            if (sheetRef.current) {
                sheetRef.current.style.transform = `translateY(${dragPx}px)`;
            }
            if (overlayRef.current) {
                const opacity = Math.max(0, 1 - (dragPx / 300));
                overlayRef.current.style.opacity = opacity.toString();
            }
        }
    };
    
    const handleEnd = () => {
        if (!isDragging.current) return;
        isDragging.current = false;
        
        const currentTransform = sheetRef.current?.style.transform;
        const dragPx = currentTransform ? parseFloat(currentTransform.replace('translateY(', '').replace('px)', '')) : 0;
        
        if (dragPx > 80) { // threshold for closing
            handleClose();
        } else if (dragPx > 0) {
            // Rebound dynamically ONLY if it actually moved
            if (sheetRef.current) {
                sheetRef.current.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                sheetRef.current.style.transform = 'translateY(0px)';
            }
            if (overlayRef.current) {
                overlayRef.current.style.transition = 'opacity 0.4s ease';
                overlayRef.current.style.opacity = '1';
                setTimeout(() => {
                    // Clean up inline styles so React state can take over cleanly
                    if (overlayRef.current) {
                        overlayRef.current.style.transition = '';
                        overlayRef.current.style.opacity = '';
                    }
                    if (sheetRef.current) {
                        sheetRef.current.style.transform = '';
                    }
                }, 400);
            }
        }
    };

    // Extract stats
    const {
        totalDays, maxStreak, totalRepsAll, perfectDays,
        hasCompletedAllExercisesOnce, weekdayWorkouts, weekendWorkouts,
        morningWorkouts, afternoonWorkouts, eveningWorkouts,
        ghostWorkout, perfectStreak
    } = computedStats;

    // Memoize the badge list from the single source of truth
    const statsSnapshot = useMemo(() => ({
        totalDays, maxStreak, totalRepsAll, perfectDays,
        hasCompletedAllExercisesOnce, weekdayWorkouts, weekendWorkouts,
        morningWorkouts, afternoonWorkouts, eveningWorkouts,
        ghostWorkout, perfectStreak
    }), [totalDays, maxStreak, totalRepsAll, perfectDays, hasCompletedAllExercisesOnce, weekdayWorkouts, weekendWorkouts, morningWorkouts, afternoonWorkouts, eveningWorkouts, ghostWorkout, perfectStreak]);

    const badges = useMemo(() => BADGE_DEFINITIONS.map(def => ({
        id: def.id,
        icon: def.icon,
        color: def.color,
        category: def.category,
        secret: def.secret || false,
        titleKey: def.secret && !def.test(statsSnapshot) ? null : `achievements.badges.${def.key}.title`,
        descKey: def.secret && !def.test(statsSnapshot) ? null : `achievements.badges.${def.key}.desc`,
        unlocked: def.test(statsSnapshot),
    })), [statsSnapshot]);

    const unlockedCount = useMemo(() => badges.filter(b => b.unlocked).length, [badges]);

    return (
        <>
            <div 
                ref={overlayRef}
                onClick={handleClose} 
                style={{
                    position: 'fixed', inset: 0, zIndex: 199,
                    background: 'rgba(0,0,0,0.5)',
                    opacity: isClosing ? 0 : (isVisible ? 1 : 0),
                    transition: isClosing ? 'opacity 0.3s ease' : 'opacity 0.4s ease'
                }} 
            />
            
            <div ref={sheetRef}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => handleStart(e.touches[0].clientY)}
                onTouchMove={(e) => handleMove(e.touches[0].clientY)}
                onTouchEnd={handleEnd}
                onMouseDown={(e) => handleStart(e.clientY)}
                onMouseMove={(e) => handleMove(e.clientY)}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
                    background: 'var(--card-bg)',
                    borderRadius: 'calc(var(--radius-xl) * 1.5) calc(var(--radius-xl) * 1.5) 0 0',
                    padding: '24px 20px',
                    paddingBottom: 'calc(var(--spacing-lg) + env(safe-area-inset-bottom))',
                    boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
                    transform: isClosing ? 'translateY(100%)' : (isVisible ? 'translateY(0%)' : 'translateY(100%)'),
                    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                    willChange: 'transform'
                }}>
                
                <div style={{
                    width: '48px', height: '5px', borderRadius: '3px',
                    background: 'var(--sheet-handle)', margin: '0 auto 20px',
                    cursor: 'grab', opacity: 0.7
                }} />

                <div data-scroll-content style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
                    {/* Progress Overview Section (Minimalist Eco Mode) */}
                    <div style={{
                        padding: '24px 20px',
                        borderRadius: 'var(--radius-xl)', 
                        textAlign: 'center',
                        marginBottom: 'var(--spacing-xl)',
                        background: 'rgba(251, 191, 36, 0.05)',
                        border: '1px solid rgba(251, 191, 36, 0.15)'
                    }}>
                        <Award size={48} color="#fbbf24" style={{ marginBottom: '12px' }} />
                        
                        <div style={{ fontSize: '3rem', fontWeight: '900', color: '#fbbf24', lineHeight: 1, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '6px' }}>
                            {unlockedCount} <span style={{fontSize: '1.4rem', opacity: 0.6, fontWeight: '700', color: 'var(--text-primary)'}}>/ {badges.length}</span>
                        </div>
                        
                        <div style={{ 
                            fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', 
                            textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' 
                        }}>
                            {t('achievements.badgesUnlocked')}
                        </div>
                        
                        {/* Simple Progress Bar */}
                        <div style={{
                            width: '100%', height: '6px', background: 'var(--surface-hover)',
                            borderRadius: '3px', marginTop: '16px', overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${(unlockedCount / badges.length) * 100}%`,
                                height: '100%',
                                background: '#fbbf24',
                                borderRadius: '3px',
                                transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s'
                            }} />
                        </div>
                    </div>

                    {/* Categories Listing */}
                    {CATEGORIES.map(cat => {
                        const catBadges = badges.filter(b => b.category === cat.id);
                        if (catBadges.length === 0) return null;
                        
                        return (
                            <div key={cat.id} style={{ marginBottom: '32px' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    marginBottom: '16px', paddingLeft: '4px'
                                }}>
                                    <div style={{
                                        fontSize: '0.85rem', fontWeight: '800',
                                        color: cat.color, textTransform: 'uppercase',
                                        letterSpacing: '1px'
                                    }}>
                                        {t(cat.titleKey)}
                                    </div>
                                    <div style={{ flex: 1, height: '1px', background: 'var(--border-muted)' }} />
                                </div>
                                <div style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px'
                                }}>
                                    {catBadges.map((badge) => (
                                        <BadgeItem
                                            key={badge.id}
                                            badge={badge}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
