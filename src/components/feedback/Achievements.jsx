import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Flame, Zap, Target, Crown, Activity, Star, Rocket, Trophy, Medal, Gem, Heart, Moon, Sun, Calendar, Clock, TrendingUp, Users, Zap as Lightning, Star as StarIcon, Ghost, Lock } from 'lucide-react';

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

    // Memoize the badge list calculation
    const badges = useMemo(() => [
        // SERIES
        { id: 'first_blood', titleKey: 'achievements.badges.first_blood.title', descKey: 'achievements.badges.first_blood.desc', icon: Target, color: '#3b82f6', unlocked: totalDays >= 1, category: 'streak' },
        { id: 'consistent', titleKey: 'achievements.badges.consistent.title', descKey: 'achievements.badges.consistent.desc', icon: Flame, color: '#f97316', unlocked: maxStreak >= 3, category: 'streak' },
        { id: 'week_warrior', titleKey: 'achievements.badges.week_warrior.title', descKey: 'achievements.badges.week_warrior.desc', icon: Calendar, color: '#8b5cf6', unlocked: maxStreak >= 7, category: 'streak' },
        { id: 'two_weeks', titleKey: 'achievements.badges.two_weeks.title', descKey: 'achievements.badges.two_weeks.desc', icon: TrendingUp, color: '#06b6d4', unlocked: maxStreak >= 14, category: 'streak' },
        { id: 'month_warrior', titleKey: 'achievements.badges.month_warrior.title', descKey: 'achievements.badges.month_warrior.desc', icon: Zap, color: '#eab308', unlocked: maxStreak >= 30, category: 'streak' },
        { id: 'two_months', titleKey: 'achievements.badges.two_months.title', descKey: 'achievements.badges.two_months.desc', icon: Trophy, color: '#dc2626', unlocked: maxStreak >= 60, category: 'streak' },
        { id: 'quarter_year', titleKey: 'achievements.badges.quarter_year.title', descKey: 'achievements.badges.quarter_year.desc', icon: Medal, color: '#7c3aed', unlocked: maxStreak >= 90, category: 'streak' },
        { id: 'half_year', titleKey: 'achievements.badges.half_year.title', descKey: 'achievements.badges.half_year.desc', icon: Gem, color: '#059669', unlocked: maxStreak >= 180, category: 'streak' },
        { id: 'year_beast', titleKey: 'achievements.badges.year_beast.title', descKey: 'achievements.badges.year_beast.desc', icon: Rocket, color: '#db2777', unlocked: maxStreak >= 365, category: 'streak' },
        // QUANTITY
        { id: 'ten_sessions', titleKey: 'achievements.badges.ten_sessions.title', descKey: 'achievements.badges.ten_sessions.desc', icon: StarIcon, color: '#22c55e', unlocked: totalDays >= 10, category: 'quantite' },
        { id: 'fifty_sessions', titleKey: 'achievements.badges.fifty_sessions.title', descKey: 'achievements.badges.fifty_sessions.desc', icon: Award, color: '#14b8a6', unlocked: totalDays >= 50, category: 'quantite' },
        { id: 'hundred_sessions', titleKey: 'achievements.badges.hundred_sessions.title', descKey: 'achievements.badges.hundred_sessions.desc', icon: Crown, color: '#f472b6', unlocked: totalDays >= 100, category: 'quantite' },
        { id: 'two_hundred_sessions', titleKey: 'achievements.badges.two_hundred_sessions.title', descKey: 'achievements.badges.two_hundred_sessions.desc', icon: Star, color: '#fb923c', unlocked: totalDays >= 200, category: 'quantite' },
        { id: 'five_hundred_sessions', titleKey: 'achievements.badges.five_hundred_sessions.title', descKey: 'achievements.badges.five_hundred_sessions.desc', icon: Gem, color: '#a855f7', unlocked: totalDays >= 500, category: 'quantite' },
        // VOLUME
        { id: 'rep_500', titleKey: 'achievements.badges.rep_500.title', descKey: 'achievements.badges.rep_500.desc', icon: Activity, color: '#ef4444', unlocked: totalRepsAll >= 500, category: 'volume' },
        { id: 'rep_1000', titleKey: 'achievements.badges.rep_1000.title', descKey: 'achievements.badges.rep_1000.desc', icon: Zap, color: '#facc15', unlocked: totalRepsAll >= 1000, category: 'volume' },
        { id: 'rep_5000', titleKey: 'achievements.badges.rep_5000.title', descKey: 'achievements.badges.rep_5000.desc', icon: Flame, color: '#f97316', unlocked: totalRepsAll >= 5000, category: 'volume' },
        { id: 'rep_10000', titleKey: 'achievements.badges.rep_10000.title', descKey: 'achievements.badges.rep_10000.desc', icon: Trophy, color: '#eab308', unlocked: totalRepsAll >= 10000, category: 'volume' },
        { id: 'rep_50000', titleKey: 'achievements.badges.rep_50000.title', descKey: 'achievements.badges.rep_50000.desc', icon: Rocket, color: '#ec4899', unlocked: totalRepsAll >= 50000, category: 'volume' },
        // PERFECTION
        { id: 'perfect_one', titleKey: 'achievements.badges.perfect_one.title', descKey: 'achievements.badges.perfect_one.desc', icon: StarIcon, color: '#22d3d1', unlocked: perfectDays >= 1, category: 'perfection' },
        { id: 'perfect_five', titleKey: 'achievements.badges.perfect_five.title', descKey: 'achievements.badges.perfect_five.desc', icon: Medal, color: '#a78bfa', unlocked: perfectDays >= 5, category: 'perfection' },
        { id: 'perfect_fifty', titleKey: 'achievements.badges.perfect_fifty.title', descKey: 'achievements.badges.perfect_fifty.desc', icon: Crown, color: '#fbbf24', unlocked: perfectDays >= 50, category: 'perfection' },
        { id: 'perfect_hundred', titleKey: 'achievements.badges.perfect_hundred.title', descKey: 'achievements.badges.perfect_hundred.desc', icon: Gem, color: '#c084fc', unlocked: perfectDays >= 100, category: 'perfection' },
        { id: 'perfect_two_hundred', titleKey: 'achievements.badges.perfect_two_hundred.title', descKey: 'achievements.badges.perfect_two_hundred.desc', icon: Gem, color: '#c084fc', unlocked: perfectDays >= 200, category: 'perfection' },
        { id: 'all_exercises', titleKey: 'achievements.badges.all_exercises.title', descKey: 'achievements.badges.all_exercises.desc', icon: Target, color: '#8b5cf6', unlocked: hasCompletedAllExercisesOnce, category: 'quantite' },
        // TIMES
        { id: 'weekday_warrior', titleKey: 'achievements.badges.weekday_warrior.title', descKey: 'achievements.badges.weekday_warrior.desc', icon: Sun, color: '#f59e0b', unlocked: weekdayWorkouts >= 25, category: 'quantite' },
        { id: 'weekend_warrior', titleKey: 'achievements.badges.weekend_warrior.title', descKey: 'achievements.badges.weekend_warrior.desc', icon: Moon, color: '#6366f1', unlocked: weekendWorkouts >= 25, category: 'quantite' },
        { id: 'balanced', titleKey: 'achievements.badges.balanced.title', descKey: 'achievements.badges.balanced.desc', icon: Users, color: '#14b8a6', unlocked: weekdayWorkouts >= 10 && weekendWorkouts >= 10, category: 'quantite' },
        { id: 'morning_5', titleKey: 'achievements.badges.morning_5.title', descKey: 'achievements.badges.morning_5.desc', icon: Sun, color: '#fb923c', unlocked: morningWorkouts >= 5, category: 'horaires' },
        { id: 'morning_10', titleKey: 'achievements.badges.morning_10.title', descKey: 'achievements.badges.morning_10.desc', icon: Sun, color: '#f59e0b', unlocked: morningWorkouts >= 10, category: 'horaires' },
        { id: 'morning_25', titleKey: 'achievements.badges.morning_25.title', descKey: 'achievements.badges.morning_25.desc', icon: Sun, color: '#d97706', unlocked: morningWorkouts >= 25, category: 'horaires' },
        { id: 'afternoon_5', titleKey: 'achievements.badges.afternoon_5.title', descKey: 'achievements.badges.afternoon_5.desc', icon: Zap, color: '#22c55e', unlocked: afternoonWorkouts >= 5, category: 'horaires' },
        { id: 'afternoon_10', titleKey: 'achievements.badges.afternoon_10.title', descKey: 'achievements.badges.afternoon_10.desc', icon: Zap, color: '#16a34a', unlocked: afternoonWorkouts >= 10, category: 'horaires' },
        { id: 'afternoon_25', titleKey: 'achievements.badges.afternoon_25.title', descKey: 'achievements.badges.afternoon_25.desc', icon: Zap, color: '#15803d', unlocked: afternoonWorkouts >= 25, category: 'horaires' },
        { id: 'evening_5', titleKey: 'achievements.badges.evening_5.title', descKey: 'achievements.badges.evening_5.desc', icon: Moon, color: '#6366f1', unlocked: eveningWorkouts >= 5, category: 'horaires' },
        { id: 'evening_10', titleKey: 'achievements.badges.evening_10.title', descKey: 'achievements.badges.evening_10.desc', icon: Moon, color: '#4f46e5', unlocked: eveningWorkouts >= 10, category: 'horaires' },
        { id: 'evening_25', titleKey: 'achievements.badges.evening_25.title', descKey: 'achievements.badges.evening_25.desc', icon: Moon, color: '#4338ca', unlocked: eveningWorkouts >= 25, category: 'horaires' },
        // SECRETS
        { id: 'ghost', titleKey: ghostWorkout ? 'achievements.badges.ghost.title' : null, descKey: ghostWorkout ? 'achievements.badges.ghost.desc' : null, icon: Ghost, color: '#6b7280', unlocked: ghostWorkout, secret: true, category: 'secrets' },
        { id: 'perfectionist', titleKey: perfectStreak >= 30 ? 'achievements.badges.perfectionist_secret.title' : null, descKey: perfectStreak >= 30 ? 'achievements.badges.perfectionist_secret.desc' : null, icon: Star, color: '#6b7280', unlocked: perfectStreak >= 30, secret: true, category: 'secrets' },
        { id: 'beast', titleKey: totalRepsAll >= 100000 ? 'achievements.badges.beast.title' : null, descKey: totalRepsAll >= 100000 ? 'achievements.badges.beast.desc' : null, icon: Rocket, color: '#6b7280', unlocked: totalRepsAll >= 100000, secret: true, category: 'secrets' }
    ], [totalDays, maxStreak, totalRepsAll, perfectDays, hasCompletedAllExercisesOnce, weekdayWorkouts, weekendWorkouts, morningWorkouts, afternoonWorkouts, eveningWorkouts, ghostWorkout, perfectStreak]);

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
