import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Flame, Trophy, Snowflake } from '@utils/icons';
import { FrozenFlame } from '@components/ui';
import { useUIStore } from '@store/useUIStore';
import { useProgressStore } from '@store/useProgressStore';
import { useAuth } from '@contexts/AuthContext';
import { Card, IconButton } from '@components/ui';
import { StreakFreezeInfo } from './StreakFreezeInfo';

const filterOutIds = (idsToRemove) => (p) => p.filter(particle => !idsToRemove.has(particle.id));

export const DashboardHeader = React.memo(({
    isAdmin,
    streakActive, streakFrozen, displayStreak, selectedExercise, totalReps
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

    const headerRef = useRef(null);
    const rightSideRef = useRef(null);
    const [availableSpace, setAvailableSpace] = useState(500);
    const [particles, setParticles] = useState([]);

    const handleStreakClick = (e) => {
        if (!streakActive || displayStreak == 0 || displayStreak == '0') return;
        const rect = e.currentTarget.getBoundingClientRect();
        const headerRect = headerRef.current.getBoundingClientRect();
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

    useEffect(() => {
        if (!headerRef.current || !rightSideRef.current) return;
        
        const observer = new ResizeObserver(() => {
            if (headerRef.current && rightSideRef.current) {
                const headerWidth = headerRef.current.getBoundingClientRect().width;
                const rightWidth = rightSideRef.current.getBoundingClientRect().width;
                const newSpace = headerWidth - rightWidth - 40;
                
                setAvailableSpace(prev => {
                    // Only update if difference is more than 2px to avoid micro-loops
                    if (Math.abs(prev - newSpace) < 2) return prev;
                    return newSpace;
                });
            }
        });

        observer.observe(headerRef.current);
        observer.observe(rightSideRef.current);

        return () => observer.disconnect();
    }, []);

    const showText = availableSpace >= 93; // Need at least ~90px for Logo + Gap + Text
    const showLogo = availableSpace >= 35;  // Need at least ~35px for Logo alone

    // Streak badge palette by state (avoids nested ternaries in the JSX).
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

    return (
        <Card as="header" ref={headerRef} variant="glass" padding="none"
            className="dashboard-header"
            style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'clamp(10px, 1.5vh, 16px) clamp(12px, 3vw, 20px)',
                minWidth: 0, position: 'relative', zIndex: 10
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexShrink: 1 }}>
                {showLogo && (
                    <img
                        onClick={() => window.location.reload()}
                        src={`${import.meta.env.BASE_URL}logo-64x64.webp`} alt="OneUp Logo"
                        className="bounce-on-hover"
                        style={{ width: 'clamp(28px, 4vh, 40px)', height: 'clamp(28px, 4vh, 40px)', flexShrink: 0, borderRadius: '10px', cursor: 'pointer', transition: 'transform 0.3s ease' }}
                    />
                )}
                {showText && (
                    <span className="app-logo-text" style={{ 
                        fontWeight: '800', fontSize: 'clamp(1.1rem, 2.5vh, 1.5rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0
                    }}>OneUp</span>
                )}
            </div>

            <div ref={rightSideRef} style={{ display: 'flex', gap: 'clamp(4px, 0.8vw, 8px)', alignItems: 'center', flexShrink: 0, justifyContent: 'flex-end' }}>
                {isAdmin && (
                    <IconButton
                        icon={Shield}
                        variant="danger"
                        onClick={() => openModal('admin')}
                        aria-label="Admin Panel"
                        className="hover-lift"
                    />
                )}

                {/* Global streak badge — three states: active (fire), frozen but
                    safe (snowflake/blue), or pending today (grey). */}
                <div
                    onClick={handleStreakClick}
                    style={{
                    background: streakBadge.bg,
                    padding: 'clamp(4px, 0.7vh, 8px) clamp(8px, 1.2vw, 14px)', borderRadius: '16px', fontSize: 'clamp(0.75rem, 1.6vh, 0.95rem)',
                    display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700',
                    border: streakBadge.border,
                    boxShadow: streakBadge.shadow,
                    opacity: streakActive || isStreakFrozen ? 1 : 0.7, flexShrink: 0, cursor: 'pointer'
                }}>
                    {isStreakFrozen
                        ? <FrozenFlame size={16} color={streakBadge.fg} />
                        : <Flame size={16} color={streakBadge.fg} />}
                    <span style={{ color: streakBadge.fg }}>{displayStreak}</span>
                </div>

                {/* Streak Freeze inventory — tap to learn how freezes are earned
                    (and that Pro earns 3× more). Hidden at zero. */}
                {showFreezeBadge && (
                    <button
                        type="button"
                        onClick={() => setShowFreezeInfo(true)}
                        aria-label={t('streakFreeze.available', { count: displayFreezeCount })}
                        title={t('streakFreeze.available', { count: displayFreezeCount })}
                        style={{
                            background: 'linear-gradient(135deg, rgba(56,189,248,0.20), rgba(14,165,233,0.20))',
                            padding: 'clamp(4px, 0.7vh, 8px) clamp(8px, 1.2vw, 14px)', borderRadius: '16px',
                            fontSize: 'clamp(0.75rem, 1.6vh, 0.95rem)', display: 'flex', alignItems: 'center',
                            gap: '5px', fontWeight: '700', border: '1px solid rgba(56,189,248,0.3)', flexShrink: 0,
                            cursor: 'pointer', color: 'inherit', fontFamily: 'inherit',
                            // Match the sibling <div> badges' height exactly: neutralise the
                            // native button box that makes it render taller. Line-height is
                            // left to inherit so the text box matches the sibling divs.
                            boxSizing: 'border-box', margin: 0,
                            appearance: 'none', WebkitAppearance: 'none'
                        }}>
                        <Snowflake size={16} color="#38bdf8" />
                        <span style={{ color: '#38bdf8' }}>{displayFreezeCount}</span>
                    </button>
                )}

                {showFreezeInfo && <StreakFreezeInfo open={showFreezeInfo} onClose={() => setShowFreezeInfo(false)} />}


                {/* Total reps badge */}
                <div className="shimmer" style={{
                    background: `linear-gradient(135deg, ${selectedExercise.color}33, ${selectedExercise.gradient[0]}33)`,
                    padding: 'clamp(4px, 0.7vh, 8px) clamp(8px, 1.2vw, 14px)', borderRadius: '16px', fontSize: 'clamp(0.75rem, 1.6vh, 0.95rem)',
                    display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600',
                    border: '1px solid var(--border-strong)',
                    boxShadow: `0 2px 8px ${selectedExercise.color}33`, flexShrink: 0
                }}>
                    <Trophy size={16} color={selectedExercise.color} />
                    <span>{totalReps}</span>
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
        </Card>
    );
});
