import React from 'react';
import { Settings as SettingsIcon, PieChart, Users, Shield, Flame, Trophy } from 'lucide-react';

export const DashboardHeader = React.memo(({
    setShowSettings, setShowStats, setShowLeaderboard, setShowClan, pauseCloudSync,
    streakActive, displayStreak, selectedExercise, totalReps
}) => {
    const iconBtnStyle = {
        background: 'var(--surface-hover)', width: 'var(--touch-min)', height: 'var(--touch-min)',
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-primary)', border: 'none', cursor: 'pointer', flexShrink: 0
    };

    return (
        <header className="glass" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: 'clamp(10px, 1.5vh, 16px) clamp(12px, 3vw, 20px)', borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)', minWidth: 0,
            containerType: 'inline-size', containerName: 'header'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
                <img
                    src={`${import.meta.env.BASE_URL}pwa-192x192.webp`} alt="OneUp Logo"
                    className="bounce-on-hover hide-logo-mobile"
                    style={{ width: 'clamp(28px, 4vh, 40px)', height: 'clamp(28px, 4vh, 40px)', flexShrink: 0, borderRadius: '10px', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.3s ease' }}
                />
                <span className="hide-text-mobile" style={{ fontWeight: '600', fontSize: 'clamp(0.8rem, 1.8vh, 1.1rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>OneUp</span>
            </div>

            <div style={{ display: 'flex', gap: 'clamp(4px, 0.8vw, 8px)', alignItems: 'center', flexShrink: 1, minWidth: 0, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowSettings(true)} className="hover-lift" style={iconBtnStyle}>
                    <SettingsIcon size={19} />
                </button>
                <button onClick={() => setShowStats(true)} className="hover-lift" style={iconBtnStyle}>
                    <PieChart size={19} />
                </button>
                <button onClick={() => setShowLeaderboard(true)} className="hover-lift" style={iconBtnStyle}>
                    <Users size={19} />
                </button>
                <button
                    onClick={() => { setShowClan(true); pauseCloudSync?.(); }}
                    title="Clan"
                    className="hover-lift"
                    style={iconBtnStyle}
                >
                    <Shield size={19} />
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
