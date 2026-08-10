import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Medal, Award, Flame, Calendar, Activity, Star, X } from '@utils/icons';
import { Avatar } from '@components/ui/Avatar';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui';
import { ModalContainer } from '@components/ui/ModalContainer';
import { DifficultyBadge } from '@components/ui/DifficultyBadge';
import { StreakFlame } from '@components/ui/StreakFlame';
import { WeightBadge } from '@components/ui/WeightBadge';
import { EXERCISES, CARDIO_EXERCISES, isBodyweightExercise, isCardioExercise, isWeightExercise } from '@config/exercises';
import { WEIGHT_EXERCISES } from '@config/weights';
import { getLocalDateStr } from '@shared/dateUtils';
import { getIcon } from '@utils/icons';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { cloudSync } from '@services/cloudSync';
import { useComputedStatsFromStore } from '@hooks/useComputedStatsFromStore';
import { getTierBadgeConfigs } from '@utils/entitlements';
import { PALETTE } from '@styles/palette';

export function UserDetail({ entry, rank, isMe, onClose }) {
    const { t } = useTranslation();
    const myStats = useComputedStatsFromStore();
    const rankColors = { 1: PALETTE.amber, 2: PALETTE.silver, 3: PALETTE.bronze };
    const todayStr = getLocalDateStr(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterdayDate);
    const isPerfect = entry.isPerfectToday && entry.lastActiveDay === todayStr;
    const rankColor = rankColors[rank] || PALETTE.indigoLight;

    const [details, setDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [openBadge, setOpenBadge] = useState(null);

    const badgeInfo = {
        supporter: { title: t('tierBadge.supporterTitle'), desc: t('tierBadge.supporterDesc') },
        pro: { title: t('tierBadge.proTitle'), desc: t('tierBadge.proDesc') },
    };

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoadingDetails(true);
            try {
                const data = await cloudSync.loadUserDetailsWithCache(entry.uid);
                if (!cancelled) setDetails(data);
            } catch (e) {
                console.error('Failed to load user details', e);
            }
            if (!cancelled) setLoadingDetails(false);
        };
        load();
        return () => { cancelled = true; };
    }, [entry.uid]);

    const stats = details?.derivedStats || {};

    const maxReps = React.useMemo(() => {
        let max = 1;
        if (!entry.exerciseReps) return 1;
        for (const [key, val] of Object.entries(entry.exerciseReps)) {
            if (isBodyweightExercise(key) || isWeightExercise(key)) {
                if (val > max) max = val;
            }
        }
        return max;
    }, [entry.exerciseReps]);

    const renderExerciseRow = (ex, index) => {
        const ExIcon = getIcon(ex.icon);
        const reps = entry.exerciseReps?.[ex.id] || 0;
        const barWidth = Math.min((reps / maxReps) * 100, 100);
        const isCardioEx = isCardioExercise(ex.id);
        const exDays = loadingDetails ? null : (stats.exerciseDays?.[ex.id] || 0);
        const weight = details?.exerciseWeights?.[ex.id] || ex.defaultWeight;
        const isWeightEx = isWeightExercise(ex.id);

        const doneAtAnchor = !!stats.exerciseDoneToday?.[ex.id];
        const doneToday = doneAtAnchor && entry.lastActiveDay === todayStr;
        const doneYesterday = doneAtAnchor && entry.lastActiveDay === yesterdayStr;
        const streakAlive = doneToday || doneYesterday;

        return (
            <div 
                key={ex.id} 
                style={{
                    padding: '8px 12px', borderRadius: 'var(--radius-md)',
                    background: `${ex.color}10`, border: `1px solid ${ex.color}20`,
                    display: 'flex', flexDirection: 'column', gap: '6px',
                    marginBottom: '6px',
                    animation: 'fadeSlideUp 0.4s ease backwards',
                    animationDelay: `${0.3 + (index * 0.05)}s`
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                        <div style={{ 
                            width: '28px', height: '28px', borderRadius: '8px', 
                            background: `${ex.color}1a`, border: `1px solid ${ex.color}33`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                        }}>
                            <ExIcon size={14} color={ex.color} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getExerciseLabel(ex, t)}</span>
                        
                        {!loadingDetails && (
                            <StreakFlame streak={streakAlive ? (stats.exerciseStreaks?.[ex.id] || 0) : 0} active={doneToday} />
                        )}
                        {exDays !== null && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', opacity: 0.7, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                                {exDays}{t(isCardioEx ? 'common.weeksAbbr' : 'common.daysAbbr')}
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {isWeightEx && <WeightBadge weight={weight} color={ex.color} />}
                        {(() => {
                            const difficulty = details?.exerciseDifficulties?.[ex.id] || 1.0;
                            if (difficulty === 1.0) return null;
                            return <DifficultyBadge difficulty={difficulty} style={{ margin: 0 }} />;
                        })()}
                        <span style={{ fontSize: '0.9rem', fontWeight: '800', color: ex.color, width: '45px', textAlign: 'right' }}>
                            {reps.toLocaleString()}
                        </span>
                    </div>
                </div>
                
                {/* Clean progress bar */}
                <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                    <div style={{ 
                        height: '100%', borderRadius: '2px', width: `${barWidth}%`, 
                        background: `linear-gradient(90deg, ${ex.color}88, ${ex.color})`, 
                        boxShadow: `0 0 10px ${ex.color}66`,
                        transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                    }} />
                </div>
            </div>
        );
    };

    return (
        <ModalContainer open={true} onClose={onClose} ariaLabel="User details" position="center" unstyled>
            <Card
                variant="premium"
                onClick={(e) => { e.stopPropagation(); setOpenBadge(null); }}
                className="slide-up"
                style={{
                    width: '100%', maxWidth: '440px',
                    boxShadow: isPerfect 
                        ? '0 0 40px rgba(255, 215, 0, 0.15), 0 24px 64px rgba(0,0,0,0.7)' 
                        : '0 24px 64px rgba(0,0,0,0.7)',
                    maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                    background: 'var(--surface-sheet, #151522)',
                    border: rank <= 3 ? `1px solid ${rankColor}55` : '1px solid rgba(255,255,255,0.1)',
                    position: 'relative', overflow: 'hidden', padding: 0
                }}
            >
                {/* Header Banner */}
                <div style={{
                    height: '100px',
                    flexShrink: 0,
                    background: rank <= 3 
                        ? `linear-gradient(145deg, ${rankColor}33, ${rankColor}0a)`
                        : 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    position: 'relative'
                }}>
                    {isPerfect && (
                        <>
                            {[
                                { top: '15%', left: '10%', size: 14, delay: '0s' },
                                { top: '25%', right: '15%', size: 10, delay: '1s' },
                                { top: '40%', left: '5%', size: 11, delay: '1.5s' },
                                { top: '50%', right: '5%', size: 8, delay: '2.5s' },
                                { top: '20%', left: '50%', size: 13, delay: '0.5s' },
                            ].map((s, idx) => (
                                <Star 
                                    key={idx}
                                    className="sparkle-icon" 
                                    size={s.size} 
                                    fill={PALETTE.gold} 
                                    style={{ position: 'absolute', top: s.top, left: s.left, right: s.right, animationDelay: s.delay }} 
                                />
                            ))}
                        </>
                    )}
                    <Button
                        iconOnly
                        icon={X}
                        variant="glass"
                        onClick={onClose}
                        aria-label="Close"
                        style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}
                    />
                </div>

                {/* Avatar & Profile Info */}
                <div style={{ padding: '0 var(--space-6)', marginTop: '-42px', position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                        position: 'relative', borderRadius: '50%',
                        background: 'var(--surface-sheet, #151522)', padding: '4px',
                        boxShadow: isPerfect ? '0 0 28px -2px rgba(255,215,0,0.6)' : `0 0 24px -6px ${rankColor}`
                    }}>
                        {isPerfect && (
                            <>
                                <Star className="sparkle-icon" size={14} fill={PALETTE.gold} style={{ position: 'absolute', top: '0', left: '0', animationDelay: '0s', zIndex: 2 }} />
                                <Star className="sparkle-icon" size={12} fill={PALETTE.gold} style={{ position: 'absolute', bottom: '10%', right: '-4px', animationDelay: '1.6s', zIndex: 2 }} />
                            </>
                        )}
                        <Avatar photoURL={entry.photoURL} name={entry.pseudo} size={76} borderColor={isPerfect ? PALETTE.gold : rankColor} />
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                        <div style={{
                            fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-primary)',
                            display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center'
                        }}>
                            <span style={{ wordBreak: 'break-all' }}>
                                {entry.pseudo} {isMe && <span style={{ fontSize: '1rem', opacity: 0.8 }}>({t('common.you')})</span>}
                            </span>
                            {getTierBadgeConfigs(entry).map(badge => {
                                const BadgeIcon = badge.icon;
                                const info = badgeInfo[badge.key];
                                const isOpen = openBadge === badge.key;
                                return (
                                    <span key={badge.key} style={{ position: 'relative', display: 'inline-flex' }}>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setOpenBadge(isOpen ? null : badge.key); }}
                                            aria-label={info?.title}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', background: badge.bgColor, borderRadius: '12px',
                                                padding: '2px 8px', gap: '4px', marginLeft: '4px', border: `1px solid ${badge.borderColor}`,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <BadgeIcon size={12} color={badge.color} fill={badge.fill} />
                                        </button>
                                        {isOpen && info && (
                                            <div role="tooltip" style={{
                                                position: 'absolute', top: 'calc(100% + 9px)', left: '50%', transform: 'translateX(-50%)',
                                                animation: 'tooltipPop 0.18s var(--ease-panel-in)',
                                                width: 'max-content', maxWidth: '200px',
                                                background: 'var(--tooltip-bg)', border: `1px solid ${badge.borderColor}`,
                                                borderRadius: 'var(--radius-md)', padding: '8px 11px',
                                                boxShadow: 'var(--shadow-lg)', zIndex: 5, textAlign: 'center',
                                                WebkitTextFillColor: 'initial'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: '700', color: badge.color }}>
                                                    <BadgeIcon size={14} color={badge.color} fill={badge.fill} />
                                                    {info.title}
                                                </div>
                                                <div style={{ fontSize: '0.68rem', fontWeight: '500', lineHeight: 1.35, color: 'var(--text-secondary)', marginTop: '3px' }}>
                                                    {info.desc}
                                                </div>
                                                <span aria-hidden style={{
                                                    position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                                                    borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                                                    borderBottom: `6px solid ${badge.borderColor}`
                                                }} />
                                            </div>
                                        )}
                                    </span>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                padding: '4px 14px', borderRadius: 'var(--radius-full)',
                                background: rank <= 3 ? `linear-gradient(135deg, ${rankColor}1f, ${rankColor}0a)` : 'rgba(255,255,255,0.04)', 
                                border: `1px solid ${rank <= 3 ? rankColor + '40' : 'rgba(255,255,255,0.08)'}`,
                                boxShadow: rank <= 3 ? `0 0 14px -4px ${rankColor}` : 'none'
                            }}>
                                {rank <= 3 ? <Medal size={14} color={rankColor} /> : <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: '800' }}>#</span>}
                                <span style={{ fontSize: '0.82rem', fontWeight: '800', color: rank <= 3 ? rankColor : 'var(--text-primary)' }}>{rank}</span>
                            </div>
                            
                            {(stats.currentStreak > 0 || stats.displayStreak > 0) && (
                                <StreakFlame 
                                    streak={stats.displayStreak || stats.currentStreak || 0} 
                                    active={isPerfect} 
                                    style={{ transform: 'scale(1.15)', transformOrigin: 'left center', margin: '0 4px' }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Wrapper */}
                <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, zIndex: 1 }}>
                    {/* Top Fade Overlay */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '24px',
                        background: 'linear-gradient(to bottom, var(--surface-sheet, #151522) 0%, transparent 100%)',
                        zIndex: 10, pointerEvents: 'none'
                    }} />

                    <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: 'var(--space-5) var(--space-6)' }}>
                        
                        {/* Primary Highlight Stat */}
                    <div style={{ animation: 'fadeSlideUp 0.4s ease backwards', animationDelay: '0.05s', marginBottom: '12px' }}>
                        <Card interactive style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}>
                            {entry.weightsTotalReps > 0 ? (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f43f5e22', display: 'grid', placeItems: 'center' }}>
                                            <Activity size={24} color="#f43f5e" />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', fontWeight: '700' }}>{t('common.global')}</span>
                                            <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1, marginTop: '2px' }}>
                                                {((entry.totalReps || 0) + (entry.weightsTotalReps || 0)).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '24px', width: '100%', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700' }}>{t('common.bodyweight')}</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: PALETTE.amber }}>{(entry.totalReps || 0).toLocaleString()}</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700' }}>{t('common.weights')}</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#8b5cf6' }}>{(entry.weightsTotalReps || 0).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${PALETTE.amber}22`, display: 'grid', placeItems: 'center' }}>
                                        <Trophy size={24} color={PALETTE.amber} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', fontWeight: '700' }}>{t('common.bodyweight')}</span>
                                        <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1, marginTop: '2px' }}>
                                            {(entry.totalReps || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: 'var(--space-6)' }}>
                        <StatCard icon={<Award size={16} color="#a855f7" />} label={t('common.achievements')} value={(isMe && myStats?.badgeCount != null ? myStats.badgeCount : details?.achievements) || 0} color="#a855f7" delay="0.1s" />
                        <StatCard icon={<Flame size={16} color={PALETTE.orange} />} label={t('common.bestStreak')} value={loadingDetails ? '…' : (stats.maxStreak || 0)} color={PALETTE.orange} delay="0.15s" />
                        <StatCard icon={<Calendar size={16} color="#22d3ee" />} label={t('leaderboard.activeDays')} value={loadingDetails ? '…' : (stats.totalDays || 0)} color="#22d3ee" delay="0.2s" />
                        <StatCard icon={<Activity size={16} color={PALETTE.pink} />} label={t('common.perfectDays')} value={loadingDetails ? '…' : (stats.perfectDays || 0)} color={PALETTE.pink} delay="0.25s" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', paddingBottom: '16px' }}>
                        {CARDIO_EXERCISES && CARDIO_EXERCISES.length > 0 && (
                            <>
                                <div style={{ ...sectionLabelStyle, animationDelay: '0.3s' }}>{t('common.cardio')}</div>
                                {CARDIO_EXERCISES.map((ex, i) => renderExerciseRow(ex, i))}
                            </>
                        )}

                        <div style={{ ...sectionLabelStyle, animationDelay: '0.4s' }}>{t('common.bodyweight')}</div>
                        {EXERCISES.map((ex, i) => renderExerciseRow(ex, i + (CARDIO_EXERCISES?.length || 0)))}
                        
                        {entry.weightsTotalReps > 0 && (
                            <>
                                <div style={{ ...sectionLabelStyle, animationDelay: '0.5s' }}>{t('common.weights')}</div>
                                {WEIGHT_EXERCISES.map((ex, i) => renderExerciseRow(ex, i + EXERCISES.length + (CARDIO_EXERCISES?.length || 0)))}
                            </>
                        )}
                    </div>
                </div>
                </div>
            </Card>
        </ModalContainer>
    );
}

const sectionLabelStyle = {
    fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)',
    textTransform: 'uppercase', marginBottom: '4px', marginTop: '16px', letterSpacing: '1.5px',
    animation: 'fadeSlideUp 0.4s ease backwards'
};

function StatCard({ icon, label, value, color, delay }) {
    return (
        <Card padding="sm" interactive style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.03)',
            animation: 'fadeSlideUp 0.4s ease backwards',
            animationDelay: delay,
            textAlign: 'center'
        }}>
            <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: `${color}1a`, border: `1px solid ${color}33`,
                display: 'grid', placeItems: 'center',
                marginBottom: '2px'
            }}>
                {icon}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
            <div style={{ fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', lineHeight: 1.2 }}>{label}</div>
        </Card>
    );
}
