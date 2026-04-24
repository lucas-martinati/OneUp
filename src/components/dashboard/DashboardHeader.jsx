import React, { useRef, useState, useEffect } from 'react';
import { SettingsIcon, PieChart, Users, Shield, Flame, Trophy } from '../../utils/icons';

export const DashboardHeader = React.memo(({
    setShowSettings, setShowStats, setShowLeaderboard,
    streakActive, displayStreak, selectedExercise, totalReps, isDay100
}) => {
    const iconBtnStyle = {
        background: 'var(--surface-muted)', width: 'var(--touch-min)', height: 'var(--touch-min)',
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-primary)', border: '1px solid var(--border-default)', cursor: 'pointer', flexShrink: 0,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    };

    const headerRef = useRef(null);
    const rightSideRef = useRef(null);
    const [availableSpace, setAvailableSpace] = useState(500);

    useEffect(() => {
        if (!headerRef.current || !rightSideRef.current) return;
        
        const observer = new ResizeObserver(() => {
            if (headerRef.current && rightSideRef.current) {
                // Get the total header width and the width taken by the right side (badges + buttons)
                const headerWidth = headerRef.current.getBoundingClientRect().width;
                const rightWidth = rightSideRef.current.getBoundingClientRect().width;
                // padding-left is clamp(12px, 3vw, 20px), we leave a 20px margin of safety
                setAvailableSpace(headerWidth - rightWidth - 40); 
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
            boxShadow: 'var(--shadow-md)', minWidth: 0
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
                {showLogo && (
                    <img
                        onClick={() => window.location.reload()}
                        src={`${import.meta.env.BASE_URL}pwa-192x192.webp`} alt="OneUp Logo"
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
                <button onClick={() => setShowSettings(true)} className="hover-lift" style={iconBtnStyle}>
                    <SettingsIcon size={19} />
                </button>
                <button onClick={() => setShowStats(true)} className="hover-lift" style={iconBtnStyle}>
                    <PieChart size={19} />
                </button>
                <button onClick={() => setShowLeaderboard(true)} className="hover-lift" style={iconBtnStyle}>
                    <Users size={19} />
                </button>


                {/* Global streak badge */}
                <div style={{
                    background: streakActive
                        ? 'linear-gradient(135deg, rgba(249,115,22,0.22), rgba(239,68,68,0.22))'
                        : 'linear-gradient(135deg, rgba(120,120,120,0.18), rgba(90,90,90,0.18))',
                    padding: 'clamp(4px, 0.7vh, 8px) clamp(8px, 1.2vw, 14px)', borderRadius: '16px', fontSize: 'clamp(0.75rem, 1.6vh, 0.95rem)',
                    display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '700',
                    border: streakActive ? '1px solid rgba(249,115,22,0.3)' : '1px solid rgba(120,120,120,0.25)',
                    boxShadow: streakActive ? '0 2px 8px rgba(249,115,22,0.15)' : 'none',
                    opacity: streakActive ? 1 : 0.7, flexShrink: 0
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
        </header>
    );
});
