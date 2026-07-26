import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, TrendingUp, Footprints, Bike, MapPin, Gauge } from '@utils/icons';
import { useCardio } from './useCardio';

function ActivityCard({ icon: Icon, title, color, stats, hasData, totalSessionsCount, t }) {
    return (
        <div
            className="glass-premium scale-in"
            style={{
                position: 'relative',
                overflow: 'hidden',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--surface-section)',
                border: '1px solid var(--border-subtle)',
            }}
        >
            {/* Soft corner glow matching StatCard */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: '-32px',
                    right: '-32px',
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${color}26 0%, transparent 70%)`,
                    pointerEvents: 'none',
                }}
            />

            {/* Header row */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-4)',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                        style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: `${color}1f`,
                            border: `1px solid ${color}3a`,
                            color: color,
                        }}
                    >
                        <Icon size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {title}
                        </div>
                        {hasData && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {t('cardio.overSessions', { count: totalSessionsCount })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Grid Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', position: 'relative', zIndex: 1 }}>
                {stats.map((stat, idx) => {
                    const StatIcon = stat.icon;
                    return (
                        <div
                            key={idx}
                            style={{
                                padding: '12px 10px',
                                borderRadius: 'var(--radius-lg)',
                                background: 'var(--surface-muted)',
                                border: '1px solid var(--border-subtle)',
                                textAlign: 'center',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    marginBottom: '6px',
                                }}
                            >
                                <StatIcon size={14} color={color} />
                                <span
                                    style={{
                                        fontSize: '0.68rem',
                                        fontWeight: '600',
                                        color: 'var(--text-secondary)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                    }}
                                >
                                    {stat.label}
                                </span>
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.1 }}>
                                {stat.value}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function CardioStatsPanel() {
    const { allSessions, loading } = useCardio();
    const { t } = useTranslation();

    const stats = useMemo(() => {
        let runningTime = 0;
        let cyclingTime = 0;
        let runningDistance = 0;
        let cyclingDistance = 0;
        let runningCount = 0;
        let cyclingCount = 0;

        allSessions.forEach(s => {
            if (s.type === 'running') {
                runningCount++;
                runningDistance += s.distance || 0;
                if (s.movingTime) runningTime += s.movingTime;
            } else if (s.type === 'cycling') {
                cyclingCount++;
                cyclingDistance += s.distance || 0;
                if (s.movingTime) cyclingTime += s.movingTime;
            }
        });

        const formatTime = (seconds) => {
            if (!seconds || seconds <= 0) return '0h 00m';
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
        };

        // Running Pace
        let runningPaceStr = '—';
        if (runningTime > 0 && runningDistance > 0) {
            const secondsPerKm = runningTime / (runningDistance / 1000);
            const paceMins = Math.floor(secondsPerKm / 60);
            const paceSecs = Math.floor(secondsPerKm % 60);
            runningPaceStr = `${paceMins}:${paceSecs.toString().padStart(2, '0')} ${t('cardio.units.minKm')}`;
        }

        // Cycling Speed
        const cyclingSpeedVal = cyclingTime > 0 ? (cyclingDistance / 1000) / (cyclingTime / 3600) : 0;
        const cyclingSpeedStr = cyclingSpeedVal > 0 ? `${cyclingSpeedVal.toFixed(1)} ${t('cardio.units.kmh')}` : '—';

        return {
            running: {
                distanceKm: (runningDistance / 1000).toFixed(1),
                timeStr: formatTime(runningTime),
                paceStr: runningPaceStr,
                count: runningCount,
            },
            cycling: {
                distanceKm: (cyclingDistance / 1000).toFixed(1),
                timeStr: formatTime(cyclingTime),
                speedStr: cyclingSpeedStr,
                count: cyclingCount,
            }
        };
    }, [allSessions, t]);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>{t('cardio.loading')}</div>;
    }

    const kmUnit = t('cardio.units.km');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {/* 🏃 Course à pied */}
            <ActivityCard
                icon={Footprints}
                title={t('exercises.running')}
                color="#f97316"
                stats={[
                    { label: t('cardio.distance'), value: `${stats.running.distanceKm} ${kmUnit}`, icon: MapPin },
                    { label: t('cardio.duration'), value: stats.running.timeStr, icon: Clock },
                    { label: t('cardio.pace'), value: stats.running.paceStr, icon: Gauge },
                ]}
                hasData={stats.running.count > 0}
                totalSessionsCount={stats.running.count}
                t={t}
            />

            {/* 🚴 Cyclisme */}
            <ActivityCard
                icon={Bike}
                title={t('exercises.cycling')}
                color="#06b6d4"
                stats={[
                    { label: t('cardio.distance'), value: `${stats.cycling.distanceKm} ${kmUnit}`, icon: MapPin },
                    { label: t('cardio.duration'), value: stats.cycling.timeStr, icon: Clock },
                    { label: t('cardio.avgSpeed'), value: stats.cycling.speedStr, icon: TrendingUp },
                ]}
                hasData={stats.cycling.count > 0}
                totalSessionsCount={stats.cycling.count}
                t={t}
            />
        </div>
    );
}