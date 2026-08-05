import React, { useRef, useState, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Flame, Trophy, Snowflake } from '@utils/icons';
import { Card, FrozenFlame, Stack } from '@components/ui';
import { useUIStore } from '@store/useUIStore';
import { useProgressStore } from '@store/useProgressStore';
import { useAuth } from '@contexts/AuthContext';
import { StreakFreezeInfo } from './StreakFreezeInfo';
import { DailySummaryHeader } from './DailySummaryHeader';
import { CATEGORIES } from '@config/categories';

const filterOutIds = (idsToRemove) => (p) => p.filter(particle => !idsToRemove.has(particle.id));

/** Shared style for every pill badge in the header right side. */
const BADGE_BASE = {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: 'clamp(4px, 0.7vh, 8px) clamp(8px, 1.2vw, 14px)',
    borderRadius: '16px', fontSize: 'clamp(0.75rem, 1.6vh, 0.95rem)',
    fontWeight: '700', lineHeight: 1.5, flexShrink: 0, cursor: 'pointer',
    // Button resets — all badges are <button> for accessibility.
    color: 'inherit', fontFamily: 'inherit',
    boxSizing: 'border-box', margin: 0,
    appearance: 'none', WebkitAppearance: 'none',
};

export const DashboardHeader = React.memo(({
    isAdmin,
    streakActive, streakFrozen, displayStreak, selectedExercise, totalReps,
    dayNumber, prevDayNumber, isCounterTransitioning, isDayPerfect, isFuture, effectiveStart,
    currentCatKey
}) => {
    const openModal = useUIStore(s => s.openModal);
    const { t } = useTranslation();
    const auth = useAuth();
    const freezeCount = useProgressStore(s => s.streakFreezes?.count || 0);
    const [showFreezeInfo, setShowFreezeInfo] = useState(false);
    // Guests see a "0" badge that invites them to sign in; signed-in users see
    // their count and the badge hides at zero.
    const showFreezeBadge = !auth.isSignedIn || freezeCount > 0;
    const displayFreezeCount = auth.isSignedIn ? freezeCount : 0;

    // "Frozen but safe": streak preserved by a freeze, not active today. Computed
    // in the stats layer (keeps date math out of render). Falls back to false.
    const isStreakFrozen = !streakActive && !!streakFrozen;
    const isCardio = currentCatKey === CATEGORIES.CARDIO;

    const headerRef = useRef(null);
    const rightSideRef = useRef(null);

    const [availableSpace, setAvailableSpace] = useState(500);
    const [particles, setParticles] = useState([]);

    const handleStreakClick = (e) => {
        if (!streakActive || displayStreak == 0 || displayStreak == '0') return;
        const rect = e.currentTarget.getBoundingClientRect();
        const headerRect = headerRef.current ? headerRef.current.getBoundingClientRect() : { left: 0, top: 0 };
        const cx = (rect.left + rect.width / 2) - headerRect.left;
        const cy = (rect.top + rect.height / 2) - headerRect.top;
        
        const newParticles = Array.from({ length: 12 }).map((_, i) => {
            const angle = Math.random() * Math.PI; // downward half circle
            const distance = 40 + Math.random() * 80;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            return {
                id: Date.now() + i + Math.random(),
                x: cx,
                y: cy,
                tx: `${tx}px`,
                ty: `${ty}px`,
                rot: `${(Math.random() - 0.5) * 120}deg`,
                delay: Math.random() * 0.15,
                size: 16 + Math.random() * 14,
                emoji: Math.random() > 0.3 ? '🔥' : '✨'
            };
        });
        
        setParticles(p => [...p, ...newParticles]);
        
        const idsToRemove = new Set(newParticles.map(np => np.id));
        setTimeout(() => {
            setParticles(filterOutIds(idsToRemove));
        }, 1200);
    };

    useLayoutEffect(() => {
        const updateSpace = () => {
            if (!headerRef.current || !rightSideRef.current) return;
            const w = headerRef.current.getBoundingClientRect().width;
            if (w > 0) {
                const rightWidth = rightSideRef.current.getBoundingClientRect().width;
                const newSpace = w - rightWidth - 40;
                setAvailableSpace(prev => (Math.abs(prev - newSpace) < 2 ? prev : newSpace));
            }
        };

        updateSpace();

        const observer = new ResizeObserver(updateSpace);
        if (headerRef.current) observer.observe(headerRef.current);
        if (rightSideRef.current) observer.observe(rightSideRef.current);

        return () => observer.disconnect();
    }, []);

    const showText = availableSpace >= 93;
    const showLogo = availableSpace >= 35;

    // Streak badge palette by state
    let streakBadge;
    if (streakActive) {
        streakBadge = {
            bg: 'linear-gradient(135deg, rgba(249,115,22,0.22), rgba(239,68,68,0.22))',
            border: '1px solid rgba(249,115,22,0.3)', shadow: '0 2px 8px rgba(249,115,22,0.15)', fg: '#f97316',
        };
    } else if (isStreakFrozen) {
        streakBadge = {
            bg: 'linear-gradient(135deg, rgba(56,189,248,0.22), rgba(14,165,233,0.22))',
            border: '1px solid rgba(56,189,248,0.35)', shadow: '0 2px 8px rgba(56,189,248,0.18)', fg: '#38bdf8',
        };
    } else {
        streakBadge = {
            bg: 'linear-gradient(135deg, rgba(120,120,120,0.18), rgba(90,90,90,0.18))',
            border: '1px solid rgba(120,120,120,0.25)', shadow: 'none', fg: '#888',
        };
    }

    // Entrance glow animation — one-shot slide + glow, no 'forwards' to avoid overriding event themes
    const entranceAnimation = 'headerGlowEntrance 1.8s ease-out';
    const dayPodEntranceAnimation = 'dayPodGlowEntrance 1.8s ease-out';

    return (
        <Stack
            as="header"
            ref={headerRef}
            className="dashboard-header-wrapper"
            align="center"
            style={{
                width: '100%',
                position: 'relative',
                zIndex: 10,
                boxSizing: 'border-box',
                ...(isDayPerfect ? { '--glow-c1': 'rgba(253, 185, 49, 0.2)', '--glow-c2': 'rgba(255, 215, 0, 0.15)' } : {})
            }}
        >
            {/* Top Bar in glass Card */}
            <Card
                as="div"
                variant="glass"
                padding="none"
                className="dashboard-header-top-bar"
                style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: 'clamp(8px, 1.2vh, 12px) clamp(12px, 3vw, 20px)',
                    minWidth: 0,
                    position: 'relative',
                    zIndex: 10,
                    animation: `${entranceAnimation}, headerUnfold 0.5s ease-out forwards`,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0, flexShrink: 1 }}>
                    {showLogo && (
                        <img
                            onClick={() => window.location.reload()}
                            src={`${import.meta.env.BASE_URL}logo-64x64.webp`}
                            alt="OneUp Logo"
                            className="bounce-on-hover"
                            style={{
                                width: 'clamp(28px, 4vh, 40px)',
                                height: 'clamp(28px, 4vh, 40px)',
                                flexShrink: 0,
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'transform 0.3s ease'
                            }}
                        />
                    )}
                    {showText && (
                        <span className="app-logo-text">
                            OneUp
                        </span>
                    )}
                </div>

                <Stack
                    direction="row"
                    align="center"
                    justify="flex-end"
                    ref={rightSideRef}
                    style={{
                        gap: 'clamp(4px, 0.8vw, 8px)',
                        flexShrink: 0,
                        marginLeft: 'auto',
                    }}
                >
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => openModal('admin')}
                            aria-label="Admin Panel"
                            className="hover-lift"
                            style={{
                                ...BADGE_BASE,
                                gap: 0,
                                background: 'linear-gradient(135deg, rgba(239,68,68,0.22), rgba(220,38,38,0.22))',
                                border: '1px solid rgba(239,68,68,0.3)',
                                boxShadow: '0 2px 8px rgba(239,68,68,0.15)'
                            }}
                        >
                            <Shield size={16} color="#ef4444" />
                            <span aria-hidden="true">{'\u200b'}</span>
                        </button>
                    )}

                    {/* Streak Freeze inventory */}
                    {showFreezeBadge && (
                        <button
                            type="button"
                            onClick={() => setShowFreezeInfo(true)}
                            aria-label={t('streakFreeze.available', { count: displayFreezeCount })}
                            title={t('streakFreeze.available', { count: displayFreezeCount })}
                            style={{
                                ...BADGE_BASE,
                                background: 'linear-gradient(135deg, rgba(56,189,248,0.20), rgba(14,165,233,0.20))',
                                border: '1px solid rgba(56,189,248,0.3)',
                                boxShadow: '0 2px 8px rgba(56,189,248,0.15)'
                            }}
                        >
                            <Snowflake size={16} color="#38bdf8" />
                            <span style={{ color: '#38bdf8' }}>{displayFreezeCount}</span>
                        </button>
                    )}

                    {showFreezeInfo && <StreakFreezeInfo open={showFreezeInfo} onClose={() => setShowFreezeInfo(false)} />}

                    {/* Global streak badge */}
                    <button
                        type="button"
                        onClick={handleStreakClick}
                        aria-label="Streak"
                        style={{
                            ...BADGE_BASE,
                            background: streakBadge.bg,
                            border: streakBadge.border,
                            boxShadow: streakBadge.shadow,
                            opacity: streakActive || isStreakFrozen ? 1 : 0.7
                        }}
                    >
                        {isStreakFrozen
                            ? <FrozenFlame size={16} color={streakBadge.fg} />
                            : <Flame size={16} color={streakBadge.fg} />}
                        <span style={{ color: streakBadge.fg }}>{displayStreak}</span>
                    </button>

                    {/* Total reps badge */}
                    <button
                        type="button"
                        tabIndex={-1}
                        className="shimmer"
                        style={{
                            ...BADGE_BASE,
                            cursor: 'default',
                            pointerEvents: 'none',
                            background: `linear-gradient(135deg, ${selectedExercise.color}33, ${selectedExercise.gradient[0]}33)`,
                            border: `1px solid ${selectedExercise.color}44`,
                            boxShadow: `0 2px 8px ${selectedExercise.color}33`
                        }}
                    >
                        <Trophy size={16} color={selectedExercise.color} />
                        <span>{totalReps}</span>
                    </button>
                </Stack>
            </Card>

            {/* Vertical Stem of the T — Centered Glass Pod wrapping Day Hero (separate cube/card) */}
            <div style={{
                display: 'flex', justifyContent: 'center', width: '100%',
                position: 'absolute', top: 'calc(100% - 1px)', left: 0, right: 0,
                zIndex: 5,
                paddingBottom: '24px',
                overflow: 'hidden',
                pointerEvents: isCardio ? 'none' : 'auto',
            }}>
                <div className="glass dashboard-header-day-pod" style={{
                    display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                    padding: '2px clamp(18px, 4vw, 36px) 6px',
                    borderRadius: '0 0 20px 20px',
                    borderTop: 'none',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                    animation: dayPodEntranceAnimation,
                    width: 'fit-content',
                    transform: isCardio ? 'translateY(-100%) scale(0.92)' : 'translateY(0) scale(1)',
                    opacity: isCardio ? 0 : 1,
                    transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out',
                    willChange: 'transform, opacity',
                }}>
                    <DailySummaryHeader
                        dayNumber={dayNumber}
                        prevDayNumber={prevDayNumber}
                        isCounterTransitioning={isCounterTransitioning}
                        isDayPerfect={isDayPerfect}
                        isFuture={isFuture}
                        effectiveStart={effectiveStart}
                        hidden={false}
                    />
                </div>
            </div>

            {/* Render streak easter egg particles */}
            {particles.map(p => (
                <div key={p.id} className="streak-particle" style={{
                    left: p.x, top: p.y,
                    '--tx': p.tx, '--ty': p.ty, '--rot': p.rot,
                    animationDelay: `${p.delay}s`,
                    fontSize: `${p.size}px`,
                }}>
                    {p.emoji}
                </div>
            ))}
        </Stack>
    );
});
