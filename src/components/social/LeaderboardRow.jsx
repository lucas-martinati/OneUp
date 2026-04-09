import React from 'react';
import { ChevronRight, Shield, HeartHandshake, Check, Star } from '../../utils/icons';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../ui/Avatar';
import { getTierBadgeConfigs } from '../../utils/entitlements';

export function LeaderboardRow({
    entry,
    rank,
    isMe,
    reps,
    activeTabConfig,
    clanData,
    nudgedMember,
    onNudge,
    todayStr,
    onSelect
}) {
    const { t } = useTranslation();

    const rankBgColors = {
        1: 'linear-gradient(135deg, rgba(255,215,0,0.25), rgba(255,215,0,0.1))',
        2: 'linear-gradient(135deg, rgba(192,192,192,0.2), rgba(192,192,192,0.08))',
        3: 'linear-gradient(135deg, rgba(205,127,50,0.2), rgba(205,127,50,0.08))'
    };
    const rankBorderColors = {
        1: '1px solid rgba(255,215,0,0.4)',
        2: '1px solid rgba(192,192,192,0.3)',
        3: '1px solid rgba(205,127,50,0.3)'
    };

    const isPerfect = entry.isPerfectToday;
    const isTopThree = rank <= 3;
    
    const bg = rankBgColors[rank] || (isPerfect
        ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(212, 175, 55, 0.08))'
        : isMe
            ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.06))'
            : 'rgba(255, 255, 255, 0.03)');
    const border = rankBorderColors[rank] || (isPerfect
        ? '1px solid rgba(255, 215, 0, 0.2)'
        : isMe
            ? '1px solid rgba(251, 191, 36, 0.25)'
            : '1px solid rgba(255, 255, 255, 0.05)');

    return (
        <div
            onClick={() => onSelect(entry)}
            className={`hover-lift ${isPerfect ? 'perfect-day-row' : ''} ${rank === 1 ? 'top-rank-1' : (rank === 2 ? 'top-rank-2' : (rank === 3 ? 'top-rank-3' : ''))}`}
            style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: 'var(--radius-md)',
                background: bg,
                border: border,
                boxShadow: isPerfect ? '0 0 10px rgba(255, 215, 0, 0.08)' : 'none',
                cursor: 'pointer', transition: 'all 0.2s ease',
                position: 'relative', overflow: 'hidden'
            }}
        >
            {isPerfect && (
                <>
                    <Star className="sparkle-icon" size={10} fill="#FFD700" style={{ top: '10%', left: '15%', animationDelay: '0s' }} />
                    <Star className="sparkle-icon" size={8} fill="#FFD700" style={{ top: '60%', left: '40%', animationDelay: '1.2s' }} />
                    <Star className="sparkle-icon" size={12} fill="#FFD700" style={{ top: '25%', right: '20%', animationDelay: '2.5s' }} />
                    <Star className="sparkle-icon" size={7} fill="#FFD700" style={{ bottom: '15%', right: '10%', animationDelay: '3.8s' }} />
                </>
            )}
            {/* Rank */}
            <span style={{
                width: '28px', textAlign: 'center',
                fontSize: '0.85rem', fontWeight: '700',
                color: isMe ? '#fbbf24' : 'var(--text-secondary)'
            }}>
                {rank}
            </span>

            {/* Avatar */}
            <Avatar
                photoURL={entry.photoURL}
                name={entry.pseudo}
                size={32}
                borderColor={isMe ? 'rgba(251,191,36,0.4)' : null}
            />

            {/* Name */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: '0.85rem', fontWeight: '600',
                    color: isMe ? '#fbbf24' : 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap'
                }}>
                    <span style={{ 
                        maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                        {isMe ? `${entry.pseudo} (${t('common.you')})` : entry.pseudo}
                    </span>
                    {getTierBadgeConfigs(entry).map(badge => {
                        const BadgeIcon = badge.icon;
                        return (
                            <span key={badge.key} style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                background: badge.bgColor, borderRadius: '10px',
                                padding: '1px 6px', gap: '3px',
                                border: `1px solid ${badge.borderColor}`
                            }}>
                                <BadgeIcon size={10} color={badge.color} fill={badge.fill} />
                            </span>
                        );
                    })}
                    {isPerfect && (
                        <Star 
                            size={12} 
                            color="#fbbf24" 
                            fill="#fbbf24" 
                            style={{ filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))' }} 
                        />
                    )}
                    {entry.lastActiveDay === todayStr && <Shield size={12} color="#10b981" />}
                </div>
            </div>

            {/* Reps */}
            <span style={{
                fontSize: '0.85rem', fontWeight: '700',
                color: activeTabConfig?.color || '#fbbf24',
                flexShrink: 0
            }}>
                {reps.toLocaleString()}
            </span>

            <ChevronRight size={16} color="var(--text-secondary)" style={{ opacity: 0.4, flexShrink: 0 }} />

            {clanData && !isMe && (
                <button 
                    onClick={(e) => onNudge(e, entry.uid)}
                    disabled={nudgedMember === entry.uid}
                    className="hover-lift" 
                    style={{
                        width: 'var(--touch-min)', height: 'var(--touch-min)', borderRadius: '50%',
                        background: nudgedMember === entry.uid ? '#10b981' : 'rgba(99,102,241,0.1)',
                        border: 'none', color: nudgedMember === entry.uid ? 'white' : '#818cf8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0, marginLeft: '4px'
                    }}
                >
                    {nudgedMember === entry.uid ? <Check size={18} /> : <HeartHandshake size={18} />}
                </button>
            )}
        </div>
    );
}
