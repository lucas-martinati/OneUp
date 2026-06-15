import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Lock } from '../../utils/icons';
import { BADGE_DEFINITIONS, getBadgeIconFromDef, isBadgeUnlocked } from '../../config/badgeDefinitions';
import { useBackHandler } from '../../hooks/useBackHandler';
import { SegmentedControl } from '../ui/SegmentedControl';

const CATEGORY_COLORS = {
    streak: '#f97316',
    quantite: '#22c55e',
    volume: '#ef4444',
    perfection: '#22d3d1',
    horaires: '#fb923c',
    secrets: '#6b7280',
    social: '#3b82f6',
};

const CATEGORY_TITLES = {
    streak: 'achievements.categories.streak',
    quantite: 'achievements.categories.quantity',
    volume: 'achievements.categories.volume',
    perfection: 'achievements.categories.perfection',
    horaires: 'achievements.categories.horaires',
    secrets: 'achievements.categories.secrets',
    social: 'achievements.categories.social',
};

// Visual-only progress metadata: [stat key, goal]. Lets locked numeric badges
// show how close they are. Unlock logic stays in badgeDefinitions (test()).
const PROGRESS_META = {
    first_blood: ['totalDays', 1],
    consistent: ['maxStreak', 3], week_warrior: ['maxStreak', 7], two_weeks: ['maxStreak', 14],
    month_warrior: ['maxStreak', 30], two_months: ['maxStreak', 60], quarter_year: ['maxStreak', 90],
    half_year: ['maxStreak', 180], year_beast: ['maxStreak', 365],
    ten_sessions: ['totalDays', 10], fifty_sessions: ['totalDays', 50], hundred_sessions: ['totalDays', 100],
    two_hundred_sessions: ['totalDays', 200], five_hundred_sessions: ['totalDays', 500],
    rep_500: ['totalRepsAll', 500], rep_1000: ['totalRepsAll', 1000], rep_5000: ['totalRepsAll', 5000],
    rep_10000: ['totalRepsAll', 10000], rep_50000: ['totalRepsAll', 50000],
    perfect_one: ['perfectDays', 1], perfect_five: ['perfectDays', 5], perfect_fifty: ['perfectDays', 50], perfect_hundred: ['perfectDays', 100],
    weekday_warrior: ['weekdayWorkouts', 25], weekend_warrior: ['weekendWorkouts', 25],
    morning_5: ['morningWorkouts', 5], morning_10: ['morningWorkouts', 10], morning_25: ['morningWorkouts', 25],
    afternoon_5: ['afternoonWorkouts', 5], afternoon_10: ['afternoonWorkouts', 10], afternoon_25: ['afternoonWorkouts', 25],
    evening_5: ['eveningWorkouts', 5], evening_10: ['eveningWorkouts', 10], evening_25: ['eveningWorkouts', 25],
};

const fmt = (n) => n.toLocaleString();

const BadgeItem = React.memo(({ badge }) => {
    const { t } = useTranslation();
    const Icon = badge.icon;
    const { unlocked, secret, color } = badge;
    const title = badge.titleKey ? t(badge.titleKey) : (secret ? t('achievements.badges.secret') : '???');
    const desc = badge.descKey ? t(badge.descKey) : (secret ? '???' : '');
    const showProgress = !unlocked && !secret && badge.goal != null && badge.progress != null;

    return (
        <div
            className={unlocked ? 'hover-lift' : ''}
            style={{
                position: 'relative', overflow: 'hidden',
                padding: '16px 12px 14px',
                borderRadius: 'var(--radius-xl)',
                textAlign: 'center',
                background: unlocked ? `linear-gradient(160deg, ${color}26, ${color}0a)` : 'var(--surface-muted)',
                border: unlocked ? `1px solid ${color}55` : '1px solid var(--border-subtle)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                minHeight: '156px'
            }}>

            {/* Corner glow + check medal for unlocked */}
            {unlocked && (
                <>
                    <div aria-hidden="true" style={{
                        position: 'absolute', top: '-30px', right: '-30px',
                        width: '92px', height: '92px', borderRadius: '50%',
                        background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`, pointerEvents: 'none'
                    }} />
                    <div style={{
                        position: 'absolute', top: '8px', right: '8px',
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: color, color: '#fff', fontSize: '0.7rem', fontWeight: 900,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 2px 8px ${color}66`, zIndex: 2
                    }}>✓</div>
                </>
            )}

            {/* Icon chip */}
            <div style={{
                position: 'relative', zIndex: 1,
                width: '52px', height: '52px', borderRadius: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: unlocked ? `${color}22` : 'var(--surface-hover)',
                border: unlocked ? `1px solid ${color}44` : '1px solid var(--border-subtle)',
                boxShadow: unlocked ? `0 4px 16px ${color}33` : 'none'
            }}>
                {(!unlocked && secret)
                    ? <Lock size={22} color="var(--text-secondary)" />
                    : <Icon size={24} color={unlocked ? color : 'var(--text-secondary)'} />}
                {(!unlocked && !secret) && (
                    <div style={{
                        position: 'absolute', bottom: '-5px', right: '-5px',
                        width: '19px', height: '19px', borderRadius: '50%',
                        background: 'var(--sheet-bg)', border: '1px solid var(--border-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Lock size={10} color="var(--text-secondary)" />
                    </div>
                )}
            </div>

            {/* Title */}
            <div style={{
                position: 'relative', zIndex: 1,
                fontSize: '0.82rem', fontWeight: '800', lineHeight: 1.2,
                color: unlocked ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}>
                {title}
            </div>

            {/* Description */}
            <div style={{
                position: 'relative', zIndex: 1,
                fontSize: '0.64rem', lineHeight: 1.3, color: 'var(--text-secondary)',
                opacity: unlocked ? 0.9 : 0.6, flex: 1,
                display: 'flex', alignItems: 'center'
            }}>
                {desc}
            </div>

            {/* Progress toward unlock (locked numeric badges) */}
            {showProgress && (
                <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
                    <div style={{ height: '5px', borderRadius: '3px', background: 'var(--progress-track-thin)', overflow: 'hidden' }}>
                        <div style={{
                            width: `${Math.round(badge.progress * 100)}%`, height: '100%', borderRadius: '3px',
                            background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                            transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }} />
                    </div>
                    <div style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', marginTop: '5px', fontWeight: '700' }}>
                        {fmt(badge.current)} / {fmt(badge.goal)}
                    </div>
                </div>
            )}
        </div>
    );
});

export function Achievements({ /* completions, exercises, settings, getDayNumber, */ onClose, computedStats }) {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    // Once the entrance slide finishes we drop the persistent transform +
    // will-change: a permanently composited, transformed scroll container makes
    // the webview intermittently fail to repaint badges scrolled back into view.
    const [entered, setEntered] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all' | 'unlocked' | 'locked'
    
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

    useBackHandler(() => {
        handleClose();
        return true;
    }, true);

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
        ghostWorkout, perfectStreak, hasShared, achievements
    } = computedStats;

    // Memoize the badge list from the single source of truth
    const statsSnapshot = useMemo(() => ({
        totalDays, maxStreak, totalRepsAll, perfectDays,
        hasCompletedAllExercisesOnce, weekdayWorkouts, weekendWorkouts,
        morningWorkouts, afternoonWorkouts, eveningWorkouts,
        ghostWorkout, perfectStreak, hasShared, achievements
    }), [totalDays, maxStreak, totalRepsAll, perfectDays, hasCompletedAllExercisesOnce, weekdayWorkouts, weekendWorkouts, morningWorkouts, afternoonWorkouts, eveningWorkouts, ghostWorkout, perfectStreak, hasShared, achievements]);

    const badges = useMemo(() => BADGE_DEFINITIONS.map(def => {
        const IconComp = getBadgeIconFromDef(def);
        const unlocked = isBadgeUnlocked(def.id, statsSnapshot, statsSnapshot.achievements);
        const meta = PROGRESS_META[def.id];
        const current = meta ? (statsSnapshot[meta[0]] || 0) : null;
        const goal = meta ? meta[1] : null;
        return {
            id: def.id,
            icon: IconComp,
            color: def.color,
            category: def.category,
            secret: def.secret || false,
            titleKey: def.secret && !unlocked ? null : `achievements.badges.${def.id}.title`,
            descKey: def.secret && !unlocked ? null : `achievements.badges.${def.id}.desc`,
            unlocked,
            current,
            goal,
            progress: goal != null ? Math.min(current / goal, 1) : null,
        };
    }), [statsSnapshot]);

    const unlockedCount = useMemo(() => badges.filter(b => b.unlocked).length, [badges]);

    const categories = useMemo(() => {
        const catIds = [...new Set(badges.map(b => b.category))];
        return catIds.map(id => ({
            id,
            titleKey: CATEGORY_TITLES[id] || `achievements.categories.${id}`,
            color: CATEGORY_COLORS[id] || '#888',
        }));
    }, [badges]);

    return (
        <div className="modal-overlay" style={{
            background: 'transparent', zIndex: 199,
            overflow: 'hidden', pointerEvents: 'none'
        }}>
            <div 
                ref={overlayRef}
                onClick={handleClose} 
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    opacity: isClosing ? 0 : (isVisible ? 1 : 0),
                    transition: isClosing ? 'opacity 0.3s ease' : 'opacity 0.4s ease',
                    pointerEvents: 'auto'
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
                onTransitionEnd={(e) => { if (e.propertyName === 'transform' && isVisible && !isClosing) setEntered(true); }}
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
                    background: 'var(--sheet-bg)',
                    borderRadius: 'calc(var(--radius-xl) * 1.5) calc(var(--radius-xl) * 1.5) 0 0',
                    boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
                    transform: isClosing ? 'translateY(100%)' : (entered ? 'none' : (isVisible ? 'translateY(0%)' : 'translateY(100%)')),
                    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                    willChange: entered ? 'auto' : 'transform',
                    pointerEvents: 'auto'
                }}>

                {/* Background extension below the sheet: the spring easing
                    overshoots past bottom:0, lifting the sheet up and briefly
                    exposing a gap underneath. This fills that gap. */}
                <div aria-hidden style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, height: '40vh',
                    background: 'var(--sheet-bg)', pointerEvents: 'none'
                }} />

                <div style={{
                    width: '48px', height: '5px', borderRadius: '3px',
                    background: 'var(--sheet-handle)', margin: 'var(--spacing-sm) auto',
                    cursor: 'grab', opacity: 0.7
                }} />

                <div data-scroll-content className="modal-content no-scrollbar" style={{
                    flex: 1, overflowY: 'auto',
                    paddingTop: 0
                }}>
                    {/* ── Hero: circular progress ring ─────────────────────── */}
                    {(() => {
                        const total = badges.length || 1;
                        const pct = unlockedCount / total;
                        const R = 54;
                        const C = 2 * Math.PI * R;
                        return (
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                padding: 'var(--spacing-sm) 0 var(--spacing-lg)', marginBottom: 'var(--spacing-md)'
                            }}>
                                <div style={{ position: 'relative', width: '132px', height: '132px' }}>
                                    <svg width="132" height="132" viewBox="0 0 132 132" style={{ transform: 'rotate(-90deg)' }}>
                                        <circle cx="66" cy="66" r={R} fill="none" stroke="var(--progress-track)" strokeWidth="8" />
                                        <circle
                                            cx="66" cy="66" r={R} fill="none"
                                            stroke="url(#achHeroGrad)" strokeWidth="8" strokeLinecap="round"
                                            strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
                                            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s' }}
                                        />
                                        <defs>
                                            <linearGradient id="achHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#fbbf24" />
                                                <stop offset="100%" stopColor="#f59e0b" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div style={{
                                        position: 'absolute', inset: 0, display: 'flex',
                                        flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Award size={20} color="#fbbf24" style={{ marginBottom: '2px' }} />
                                        <div style={{ fontSize: '2.1rem', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1 }}>
                                            {unlockedCount}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                            / {badges.length}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    marginTop: '12px', fontSize: '0.78rem', textTransform: 'uppercase',
                                    letterSpacing: '1.5px', fontWeight: '800', color: '#fbbf24'
                                }}>
                                    {t('achievements.badgesUnlocked')}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    {Math.round(pct * 100)}%
                                </div>
                            </div>
                        );
                    })()}

                    {/* ── Filter ───────────────────────────────────────────── */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-lg)' }}>
                        <SegmentedControl
                            options={[
                                { id: 'all', label: t('achievements.filterAll') },
                                { id: 'unlocked', label: t('achievements.filterUnlocked') },
                                { id: 'locked', label: t('achievements.filterLocked') },
                            ]}
                            value={filter}
                            onChange={setFilter}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* ── Categories Listing ───────────────────────────────── */}
                    {categories.map(cat => {
                        const catBadges = badges.filter(b => b.category === cat.id);
                        if (catBadges.length === 0) return null;
                        const shown = catBadges.filter(b =>
                            filter === 'all' || (filter === 'unlocked' ? b.unlocked : !b.unlocked)
                        );
                        if (shown.length === 0) return null;
                        const catUnlocked = catBadges.filter(b => b.unlocked).length;

                        return (
                            <div key={cat.id} style={{ marginBottom: 'var(--spacing-xl)' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    marginBottom: 'var(--spacing-sm)', paddingLeft: '4px'
                                }}>
                                    <div style={{
                                        fontSize: '0.82rem', fontWeight: '800',
                                        color: cat.color, textTransform: 'uppercase', letterSpacing: '1px'
                                    }}>
                                        {t(cat.titleKey)}
                                    </div>
                                    <div style={{
                                        fontSize: '0.62rem', fontWeight: '700', color: 'var(--text-secondary)',
                                        background: `${cat.color}1a`, border: `1px solid ${cat.color}33`,
                                        padding: '2px 8px', borderRadius: '20px'
                                    }}>
                                        {catUnlocked}/{catBadges.length}
                                    </div>
                                    <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${cat.color}40, transparent)` }} />
                                </div>
                                <div style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px'
                                }}>
                                    {shown.map((badge) => (
                                        <BadgeItem key={badge.id} badge={badge} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
