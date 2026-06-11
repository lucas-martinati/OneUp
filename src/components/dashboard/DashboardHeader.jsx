import React, { useRef, useState, useEffect } from 'react';
import { SettingsIcon, PieChart, Users, Shield, Flame, Trophy } from '../../utils/icons';
import { useUIStore } from '../../store/useUIStore';

export const DashboardHeader = React.memo(({
    isAdmin,
    streakActive, displayStreak, selectedExercise, totalReps, isDay100
}) => {
    const openModal = useUIStore(s => s.openModal);
    const iconBtnStyle = {
        background: 'var(--surface-muted)', width: 'var(--touch-min)', height: 'var(--touch-min)',
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-primary)', border: '1px solid var(--border-default)', cursor: 'pointer', flexShrink: 0,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    };

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
        
        setTimeout(() => {
            setParticles(p => p.filter(particle => !newParticles.find(np => np.id === particle.id)));
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

    return (
        <header ref={headerRef} className={`glass ${isDay100 ? 'day100-header' : ''}`} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: 'clamp(10px, 1.5vh, 16px) clamp(12px, 3vw, 20px)', borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)', minWidth: 0, position: 'relative',
            zIndex: 10
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
                {showLogo && (
                    <img
                        onClick={() => window.location.reload()}
                        src={`${import.meta.env.BASE_URL}logo-64x64.webp`} alt="OneUp Logo"
                        className="bounce-on-hover"
                        style={{ width: 'clamp(28px, 4vh, 40px)', height: 'clamp(28px, 4vh, 40px)', flexShrink: 0, borderRadius: '10px', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.3s ease' }}
                    />
                )}
                {showText && (
                    <span style={{ 
                        fontWeight: '800', fontSize: 'clamp(1.1rem, 2.5vh, 1.5rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
                        ...(isDay100 ? { fontFamily: "'Courier New', monospace", color: '#ef4444', textShadow: '0 0 8px rgba(239,68,68,0.5)' } : {})
                    }}>{isDay100 ? 'HACKED' : 'OneUp'}</span>
                )}
            </div>

            <div ref={rightSideRef} style={{ display: 'flex', gap: 'clamp(4px, 0.8vw, 8px)', alignItems: 'center', flexShrink: 0, justifyContent: 'flex-end' }}>
                {isAdmin && (
                    <button onClick={() => openModal('admin')} aria-label="Admin Panel" className="hover-lift" style={{ ...iconBtnStyle, color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                        <Shield size={19} />
                    </button>
                )}
                <button onClick={() => openModal('settings')} aria-label="Settings" className="hover-lift" style={iconBtnStyle}>
                    <SettingsIcon size={19} />
                </button>
                <button onClick={() => openModal('stats')} aria-label="Statistics" className="hover-lift" style={iconBtnStyle}>
                    <PieChart size={19} />
                </button>
                <button onClick={() => openModal('leaderboard')} aria-label="Leaderboard" className="hover-lift" style={iconBtnStyle}>
                    <Users size={19} />
                </button>


                {/* Global streak badge */}
                <div 
                    onClick={handleStreakClick}
                    style={{
                    background: streakActive
                        ? 'linear-gradient(135deg, rgba(249,115,22,0.22), rgba(239,68,68,0.22))'
                        : 'linear-gradient(135deg, rgba(120,120,120,0.18), rgba(90,90,90,0.18))',
                    padding: 'clamp(4px, 0.7vh, 8px) clamp(8px, 1.2vw, 14px)', borderRadius: '16px', fontSize: 'clamp(0.75rem, 1.6vh, 0.95rem)',
                    display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700',
                    border: streakActive ? '1px solid rgba(249,115,22,0.3)' : '1px solid rgba(120,120,120,0.25)',
                    boxShadow: streakActive ? '0 2px 8px rgba(249,115,22,0.15)' : 'none',
                    opacity: streakActive ? 1 : 0.7, flexShrink: 0, cursor: 'pointer'
                }}>
                    <Flame size={16} color={streakActive ? '#f97316' : '#888'} />
                    <span style={{ color: streakActive ? '#f97316' : '#888' }}>{displayStreak}</span>
                </div>

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
        </header>
    );
});
