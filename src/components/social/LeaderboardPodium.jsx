import React from 'react';
import { Crown, Star, HeartHandshake, Check } from '../../utils/icons';
import { Avatar } from '../ui/Avatar';
import { getTierBadgeConfigs } from '../../utils/entitlements';
import styles from './Leaderboard.module.css';

const MEDALS = {
    1: { cls: styles.gold, border: '#ffd700' },
    2: { cls: styles.silver, border: '#e2e8f0' },
    3: { cls: styles.bronze, border: '#cd9b6a' },
};

/**
 * Top-3 podium hero. `items` is the (up to 3) leaderboard entries ordered by
 * standing: items[0] is the leader (rendered centre & tallest).
 */
export function LeaderboardPodium({ items, currentUid, todayStr, onSelect, clanData, nudgedMember, onNudge, t }) {
    if (!items || items.length === 0) return null;

    return (
        <div className={`${styles.podium} ${styles.rise} ${styles.rise2}`}>
            {items.map(({ entry, rank, reps }, slot) => {
                const medal = MEDALS[rank] || MEDALS[3];
                const isMe = entry.uid === currentUid;
                const isPerfect = entry.isPerfectToday && entry.lastActiveDay === todayStr;
                const avatarSize = slot === 0 ? 66 : 52;
                const pItemCls = slot === 0 ? styles.pItem1 : slot === 1 ? styles.pItem2 : styles.pItem3;
                const pedCls = slot === 0 ? styles.ped1 : slot === 1 ? styles.ped2 : styles.ped3;

                return (
                    <div
                        key={entry.uid}
                        className={`${styles.pItem} ${pItemCls} ${medal.cls}`}
                        onClick={() => onSelect(entry)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(entry); } }}
                    >
                        <div className={`${styles.pAvatarWrap} ${isPerfect ? styles.pPerfect : isMe ? styles.pMe : ''}`}>
                            {slot === 0 && <Crown className={styles.pCrown} size={24} color="#ffd700" fill="#ffd700" />}
                            {isPerfect && (
                                <>
                                    <Star className="sparkle-icon" size={11} fill="#FFD700" style={{ top: '-2px', left: '-4px', animationDelay: '0s' }} />
                                    <Star className="sparkle-icon" size={8} fill="#FFD700" style={{ bottom: '4px', right: '-4px', animationDelay: '1.5s' }} />
                                    <Star className="sparkle-icon" size={9} fill="#FFD700" style={{ top: '45%', right: '-7px', animationDelay: '2.8s' }} />
                                </>
                            )}
                            <Avatar photoURL={entry.photoURL} name={entry.pseudo} size={avatarSize} borderColor={isPerfect ? '#ffd700' : medal.border} />

                            {clanData && !isMe && (
                                <button
                                    onClick={(e) => onNudge(e, entry.uid)}
                                    disabled={nudgedMember === entry.uid}
                                    aria-label="nudge"
                                    className={`${styles.pNudgeBtn} ${nudgedMember === entry.uid ? styles.nudgeBtnDone : ''}`}
                                >
                                    {nudgedMember === entry.uid ? <Check size={14} /> : <HeartHandshake size={14} />}
                                </button>
                            )}
                        </div>

                        <div className={styles.pName}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.pseudo}</span>
                            {isMe && <span className={styles.pYou}>({t('common.you')})</span>}
                            {isPerfect && <Star size={12} color="#fbbf24" fill="#fbbf24" className={styles.perfectStar} />}
                            {getTierBadgeConfigs(entry).map(badge => {
                                const BadgeIcon = badge.icon;
                                return <BadgeIcon key={badge.key} size={11} color={badge.color} fill={badge.fill} />;
                            })}
                        </div>

                        <div className={styles.pReps}>
                            {reps.toLocaleString()}<span className={styles.pRepsUnit}>{t('common.reps')}</span>
                        </div>

                        <div className={`${styles.pedestal} ${pedCls} ${medal.cls}`}>{rank}</div>
                    </div>
                );
            })}
        </div>
    );
}
