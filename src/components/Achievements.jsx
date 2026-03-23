import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Flame, Zap, Target, Crown, Activity, Star, Rocket, Trophy, Medal, Gem, Heart, Moon, Sun, Calendar, Clock, TrendingUp, Users, Zap as Lightning, Star as StarIcon, Ghost, Lock } from 'lucide-react';

// ── Shared Config ──
const CATEGORIES = [
    { id: 'streak', titleKey: 'achievements.categories.streak', color: '#f97316' },
    { id: 'quantite', titleKey: 'achievements.categories.quantity', color: '#22c55e' },
    { id: 'volume', titleKey: 'achievements.categories.volume', color: '#ef4444' },
    { id: 'perfection', titleKey: 'achievements.categories.perfection', color: '#22d3d1' },
    { id: 'horaires', titleKey: 'achievements.categories.horaires', color: '#fb923c' },
    { id: 'secrets', titleKey: 'achievements.categories.secrets', color: '#6b7280' }
];

// Memoized individual badge to prevent re-renders during drag interactions
const BadgeItem = React.memo(({ badge, isHighlighted, index }) => {
    const { t } = useTranslation();
    const Icon = badge.icon;
    const displayTitle = badge.titleKey ? t(badge.titleKey) : '???';
    const displayDesc = badge.descKey ? t(badge.descKey) : t('achievements.badges.secret');
    return (
        <div
            className={isHighlighted ? 'pulse-glow' : 'glass-premium'}
            style={{
                padding: '14px 10px',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                background: badge.unlocked ? `linear-gradient(135deg, ${badge.color}22, ${badge.color}10)` : 'var(--surface-muted)',
                border: isHighlighted ? `2px solid ${badge.color}` : (badge.unlocked ? `1px solid ${badge.color}44` : '1px solid var(--border-subtle)'),
                opacity: badge.unlocked ? 1 : 0.6,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                boxShadow: isHighlighted ? `0 0 25px ${badge.color}88` : 'none',
                transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
                ['--badge-color']: badge.color,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}>
            <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: badge.unlocked ? `${badge.color}33` : 'var(--surface-hover)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '8px'
            }}>
                <Icon size={20} color={badge.unlocked ? badge.color : 'var(--text-secondary)'} />
            </div>
            <div style={{
                fontSize: '0.8rem', fontWeight: '800',
                color: badge.unlocked ? badge.color : 'var(--text-secondary)',
                marginBottom: '2px', lineHeight: 1.2
            }}>
                {displayTitle}
            </div>
            <div style={{
                fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.2
            }}>
                {displayDesc}
            </div>
            {badge.unlocked && (
                <div style={{
                    marginTop: '6px', fontSize: '0.6rem',
                    background: `${badge.color}22`, color: badge.color,
                    padding: '2px 6px', borderRadius: '8px', fontWeight: '700'
                }}>
                    {t('achievements.validated')}
                </div>
            )}
        </div>
    );
});

export function Achievements({ completions, exercises, onClose, highlightedBadgeId, settings, getDayNumber, computedStats }) {
    const { t } = useTranslation();
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const sheetRef = useRef(null);
    const startY = useRef(0);
    const currentDragY = useRef(0);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => onClose(), 150);
    }, [onClose]);

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    useEffect(() => {
        history.pushState({ sheetOpen: true }, '');
        const handlePopState = () => handleClose();
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [handleClose]);

    // Touch/Mouse Handlers
    const handleStart = (y) => {
        const contentEl = sheetRef.current?.querySelector('[data-scroll-content]');
        const canScrollUp = contentEl ? contentEl.scrollTop > 0 : false;
        if (!canScrollUp || y < 100) {
            startY.current = y;
            setIsDragging(true);
        }
    };
    const handleMove = (y) => {
        if (!isDragging) return;
        const diff = y - startY.current;
        if (diff > 0) {
            const newDragY = diff * 0.13;
            currentDragY.current = newDragY;
            setDragY(newDragY);
        }
    };
    const handleEnd = () => {
        setIsDragging(false);
        if (currentDragY.current > 15) handleClose();
        else {
            currentDragY.current = 0;
            setDragY(0);
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
            <div onClick={handleClose} style={{
                position: 'fixed', inset: 0, zIndex: 199,
                background: 'rgba(0,0,0,0.5)', opacity: isClosing ? 0 : (isVisible ? (dragY > 0 ? Math.max(0, 1 - dragY / 300) : 1) : 0),
                transition: 'opacity 0.15s'
            }} />
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
                    background: 'var(--sheet-bg)',
                    borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                    padding: '20px',
                    paddingBottom: 'calc(var(--spacing-lg) + env(safe-area-inset-bottom))',
                    boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
                    transform: `translateY(${isClosing ? 100 : (isVisible ? dragY : 100)}%)`,
                    transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    maxHeight: '85vh', display: 'flex', flexDirection: 'column'
                }}>
                <div style={{
                    width: '40px', height: '4px', borderRadius: '2px',
                    background: 'var(--sheet-handle)', margin: '0 auto 16px',
                    cursor: 'grab'
                }} />

                <div data-scroll-content style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
                    {/* Progress Overview */}
                    <div className="glass-premium" style={{
                        padding: 'var(--spacing-lg) var(--spacing-md)',
                        borderRadius: 'var(--radius-xl)', textAlign: 'center',
                        marginBottom: 'var(--spacing-md)',
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.12))'
                    }}>
                        <Award size={36} color="#fbbf24" style={{ marginBottom: '8px' }} />
                        <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#fbbf24', lineHeight: 1 }}>
                            {unlockedCount} / {badges.length}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {t('achievements.badgesUnlocked')}
                        </div>
                    </div>

                    {CATEGORIES.map(cat => {
                        const catBadges = badges.filter(b => b.category === cat.id);
                        if (catBadges.length === 0) return null;
                        return (
                            <div key={cat.id} style={{ marginBottom: '20px' }}>
                                <div style={{
                                    fontSize: '0.75rem', fontWeight: '700',
                                    color: cat.color, textTransform: 'uppercase',
                                    letterSpacing: '1px', marginBottom: '10px'
                                }}>
                                    {t(cat.titleKey)}
                                </div>
                                <div style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px'
                                }}>
                                    {catBadges.map((badge, index) => (
                                        <BadgeItem
                                            key={badge.id}
                                            badge={badge}
                                            isHighlighted={badge.id === highlightedBadgeId}
                                            index={index}
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
