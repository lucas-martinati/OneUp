import React from 'react';
import { ChevronRight, Shield, ShieldAlert, HeartHandshake, Check, Star } from '../../utils/icons';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../ui/Avatar';
import { getTierBadgeConfigs } from '../../utils/entitlements';
import styles from './Leaderboard.module.css';

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

    const isPerfect = entry.isPerfectToday && entry.lastActiveDay === todayStr;

    // Shield logic: server-computed (immune to client clock manipulation).
    const shieldFresh = entry.shieldDate === todayStr;
    const showVerifiedShield = !!entry.shieldGreen && shieldFresh;
    const showSuspiciousShield = !!entry.shieldOrange && shieldFresh;

    const rowCls = [styles.row];
    if (isPerfect) rowCls.push(styles.rowPerfect, 'perfect-day-row');
    else if (isMe) rowCls.push(styles.rowMe);

    const borderColor = isPerfect ? '#ffd700' : isMe ? 'var(--accent-glow)' : null;

    return (
        <div className={rowCls.join(' ')} onClick={() => onSelect(entry)}>
            {isPerfect && (
                <>
                    <Star className="sparkle-icon" size={9} fill="#FFD700" style={{ top: '18%', left: '30%', animationDelay: '0s' }} />
                    <Star className="sparkle-icon" size={7} fill="#FFD700" style={{ top: '55%', left: '52%', animationDelay: '1.6s' }} />
                    <Star className="sparkle-icon" size={10} fill="#FFD700" style={{ top: '22%', right: '22%', animationDelay: '3s' }} />
                </>
            )}
            <span className={`${styles.rank} ${isMe ? styles.rankMe : ''}`} style={isPerfect ? { color: '#fcd34d' } : undefined}>{rank}</span>

            <Avatar photoURL={entry.photoURL} name={entry.pseudo} size={34} borderColor={borderColor} />

            <div className={styles.nameWrap}>
                <div className={styles.nameRow}>
                    <span className={`${styles.name} ${isPerfect ? styles.namePerfect : isMe ? styles.nameMe : ''}`}>
                        {isMe ? `${entry.pseudo} (${t('common.you')})` : entry.pseudo}
                    </span>
                    {isPerfect && <Star size={13} color="#fbbf24" fill="#fbbf24" className={styles.perfectStar} />}
                    {getTierBadgeConfigs(entry).map(badge => {
                        const BadgeIcon = badge.icon;
                        return (
                            <span key={badge.key} className={styles.tierBadge} style={{ background: badge.bgColor, borderColor: badge.borderColor }}>
                                <BadgeIcon size={10} color={badge.color} fill={badge.fill} />
                            </span>
                        );
                    })}
                    {showVerifiedShield && <Shield size={12} color="#10b981" />}
                    {showSuspiciousShield && <ShieldAlert size={12} color="#f59e0b" />}
                </div>
            </div>

            <span className={styles.reps} style={{ color: activeTabConfig?.color || '#fbbf24' }}>
                {reps.toLocaleString()}
            </span>

            <ChevronRight size={16} color="var(--text-secondary)" className={styles.chevron} />

            {clanData && !isMe && (
                <button
                    onClick={(e) => onNudge(e, entry.uid)}
                    disabled={nudgedMember === entry.uid}
                    aria-label="nudge"
                    className={`${styles.nudgeBtn} ${nudgedMember === entry.uid ? styles.nudgeBtnDone : ''}`}
                >
                    {nudgedMember === entry.uid ? <Check size={18} /> : <HeartHandshake size={18} />}
                </button>
            )}
        </div>
    );
}
