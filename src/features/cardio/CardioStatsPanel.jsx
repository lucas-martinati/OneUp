import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, TrendingUp } from '@utils/icons';
import { useCardio } from './useCardio';

export function CardioStatsPanel() {
    const { allSessions, loading } = useCardio();
    const { t } = useTranslation();

    const stats = useMemo(() => {
        let runningTime = 0;
        let cyclingTime = 0;
        let runningDistance = 0;
        let cyclingDistance = 0;

        allSessions.forEach(s => {
            if (s.movingTime) {
                if (s.type === 'running') {
                    runningTime += s.movingTime;
                    runningDistance += s.distance || 0;
                }
                if (s.type === 'cycling') {
                    cyclingTime += s.movingTime;
                    cyclingDistance += s.distance || 0;
                }
            }
        });

        const runningHours = Math.floor(runningTime / 3600);
        const runningMins = Math.floor((runningTime % 3600) / 60);
        const cyclingHours = Math.floor(cyclingTime / 3600);
        const cyclingMins = Math.floor((cyclingTime % 3600) / 60);

        let runningPaceStr = '—';
        if (runningTime > 0 && runningDistance > 0) {
            const secondsPerKm = runningTime / (runningDistance / 1000);
            const paceMins = Math.floor(secondsPerKm / 60);
            const paceSecs = Math.floor(secondsPerKm % 60);
            runningPaceStr = `${paceMins}:${paceSecs.toString().padStart(2, '0')} ${t('cardio.units.minKm')}`;
        }

        const cyclingSpeed = cyclingTime > 0 ? (cyclingDistance / 1000) / (cyclingTime / 3600) : 0;

        return {
            runningTimeStr: `${runningHours}h ${runningMins}m`,
            cyclingTimeStr: `${cyclingHours}h ${cyclingMins}m`,
            runningPaceStr: runningPaceStr,
            cyclingSpeed: cyclingSpeed > 0 ? `${cyclingSpeed.toFixed(1)} ${t('cardio.units.kmh')}` : '—',
        };
    }, [allSessions, t]);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>{t('cardio.loading')}</div>;
    }

    const statCardStyle = (bg1, bg2) => ({
        padding: '14px 12px', borderRadius: 'var(--radius-lg)',
        background: `linear-gradient(135deg, ${bg1}, ${bg2})`, textAlign: 'center'
    });

    const statLabelStyle = {
        fontSize: 'clamp(0.6rem, 1.5vw, 0.7rem)', color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px'
    };

    return (
        <div className="fade-in">
            {/* 🏃 Course */}
            <div className="glass-premium" style={{
                padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                marginBottom: 'var(--spacing-md)',
                background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(239,68,68,0.08))'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🏃</span>
                    <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{t('exercises.running')}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div className="glass-premium scale-in" style={statCardStyle('rgba(249,115,22,0.15)', 'rgba(239,68,68,0.15)')}>
                        <Clock size={20} color="#f97316" style={{ marginBottom: '4px' }} />
                        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f97316', lineHeight: 1 }}>{stats.runningTimeStr}</div>
                        <div style={statLabelStyle}>{t('cardio.duration')}</div>
                    </div>
                    <div className="glass-premium scale-in" style={statCardStyle('rgba(249,115,22,0.15)', 'rgba(239,68,68,0.15)')}>
                        <TrendingUp size={20} color="#f97316" style={{ marginBottom: '4px' }} />
                        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f97316', lineHeight: 1 }}>{stats.runningPaceStr}</div>
                        <div style={statLabelStyle}>{t('cardio.pace') || t('cardio.avgSpeed')}</div>
                    </div>
                </div>
            </div>

            {/* 🚴 Vélo */}
            <div className="glass-premium" style={{
                padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                marginBottom: 'var(--spacing-md)',
                background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(6,182,212,0.08))'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🚴</span>
                    <span style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{t('exercises.cycling')}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div className="glass-premium scale-in" style={statCardStyle('rgba(6,182,212,0.15)', 'rgba(6,182,212,0.15)')}>
                        <Clock size={20} color="#06b6d4" style={{ marginBottom: '4px' }} />
                        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#06b6d4', lineHeight: 1 }}>{stats.cyclingTimeStr}</div>
                        <div style={statLabelStyle}>{t('cardio.duration')}</div>
                    </div>
                    <div className="glass-premium scale-in" style={statCardStyle('rgba(6,182,212,0.15)', 'rgba(6,182,212,0.15)')}>
                        <TrendingUp size={20} color="#06b6d4" style={{ marginBottom: '4px' }} />
                        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#06b6d4', lineHeight: 1 }}>{stats.cyclingSpeed}</div>
                        <div style={statLabelStyle}>{t('cardio.avgSpeed') || t('cardio.speed')}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}