import { useState, useEffect, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { X, Trophy, Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints, LogOut, Activity } from 'lucide-react';
import { EXERCISES } from '../../config/exercises';
import { WEIGHT_EXERCISES } from '../../config/weights';
import { getLocalDateStr } from '../../utils/dateUtils';
import { ClanInviteCard } from './ClanInviteCard';
import { LeaderboardTabs } from './LeaderboardTabs';
import { LeaderboardRow } from './LeaderboardRow';
import { UserDetail } from './UserDetail';

const ICON_MAP = { Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints };

export function Leaderboard({ onClose, cloudSync, cloudAuth, clanData, onLeaveClan, activeSlide = 0 }) {
    const { t } = useTranslation();

    const [domain, setDomain] = useState(activeSlide === 1 ? 'weights' : 'classic');

    const VISIBLE_TABS = useMemo(() => {
        const combinedTab = { 
            id: 'global_combined', 
            labelKey: 'common.global', 
            color: '#ec4899', 
            icon: Activity,
            isSpecial: true
        };

        if (domain === 'weights') { 
            return [
                combinedTab,
                { id: 'global_weights', customLabel: `${t('common.global')} ${t('common.global_weights')}`, color: '#8b5cf6', icon: Dumbbell },
                ...WEIGHT_EXERCISES.map(ex => ({ id: ex.id, labelKey: 'exercises.' + ex.id, color: ex.color, icon: ICON_MAP[ex.icon] || Dumbbell }))
            ];
        }
        return [
            combinedTab,
            { id: 'global_classic', customLabel: `${t('common.global')} ${t('common.global_classic')}`, color: '#fbbf24', icon: Trophy },
            ...EXERCISES.map(ex => ({ id: ex.id, labelKey: 'exercises.' + ex.id, color: ex.color, icon: ICON_MAP[ex.icon] || Dumbbell }))
        ];
    }, [domain, t]);

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(activeSlide === 1 ? 'global_weights' : 'global_classic');
    const [selectedUser, setSelectedUser] = useState(null);
    const [nudgedMember, setNudgedMember] = useState(null);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const currentUid = cloudSync.getCurrentUserId();
    const todayStr = getLocalDateStr(new Date());

    const handleNudge = async (e, uid) => {
        e.stopPropagation();
        if (nudgedMember === uid) return;
        setNudgedMember(uid);
        await cloudSync.sendClanNotification(uid, 'nudge', t('common.poke'));
        setTimeout(() => setNudgedMember(null), 2000);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            if (clanData) {
                setEntries(clanData.members);
            } else {
                const data = await cloudSync.loadLeaderboard();
                setEntries(data);
            }
        } catch (e) {
            console.error('Failed to load leaderboard', e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const sorted = useMemo(() => {
        let filteredEntries = entries;
        if (domain === 'weights') {
            filteredEntries = entries.filter(e => e.isPro);
        }
        return [...filteredEntries].sort((a, b) => {
            if (activeTab === 'global_combined') return ((b.totalReps || 0) + (b.weightsTotalReps || 0)) - ((a.totalReps || 0) + (a.weightsTotalReps || 0));
            if (activeTab === 'global_classic') return (b.totalReps || 0) - (a.totalReps || 0);
            if (activeTab === 'global_weights') return (b.weightsTotalReps || 0) - (a.weightsTotalReps || 0);
            return (b.exerciseReps?.[activeTab] || 0) - (a.exerciseReps?.[activeTab] || 0);
        });
    }, [entries, activeTab, domain]);

    const getRank = (index) => {
        if (index === 0) return 1;
        const currentReps = getReps(sorted[index]);
        const previousReps = getReps(sorted[index - 1]);
        if (currentReps === previousReps) return getRank(index - 1);
        return index + 1;
    };

    const getReps = (entry) => {
        if (activeTab === 'global_combined') return (entry.totalReps || 0) + (entry.weightsTotalReps || 0);
        if (activeTab === 'global_classic') return entry.totalReps || 0;
        if (activeTab === 'global_weights') return entry.weightsTotalReps || 0;
        return entry.exerciseReps?.[activeTab] || 0;
    };

    const activeTabConfig = VISIBLE_TABS.find(t => t.id === activeTab) || VISIBLE_TABS[0];

    return (
        <div className="fade-in" style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'var(--overlay-bg)', zIndex: 110,
            display: 'flex', flexDirection: 'column',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            overscrollBehavior: 'none',
            touchAction: 'auto'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--spacing-md) var(--spacing-md) 0'
            }}>
                {clanData ? (
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '2px' }}>
                            {t('leaderboard.yourClan')}
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: 'white' }}>
                            {clanData.name}
                        </h2>
                    </div>
                ) : (
                    <h2 style={{
                        margin: 0, fontSize: '1.8rem', fontWeight: '800',
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        {t('leaderboard.title')}
                    </h2>
                )}
                <button onClick={onClose} className="hover-lift glass" style={{
                    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                    width: 'var(--touch-min)', height: 'var(--touch-min)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white', cursor: 'pointer'
                }}>
                    <X size={22} />
                </button>
            </div>

            <ClanInviteCard clanData={clanData} />

            <LeaderboardTabs 
                domain={domain}
                setDomain={setDomain}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                VISIBLE_TABS={VISIBLE_TABS}
            />

            {/* Content */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '0 var(--spacing-md) var(--spacing-md)',
                display: 'flex', flexDirection: 'column', gap: '6px'
            }}>
                {loading ? (
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-secondary)', flexDirection: 'column', gap: '12px'
                    }}>
                        <div style={{
                            width: '32px', height: '32px', border: '3px solid rgba(251,191,36,0.3)',
                            borderTopColor: '#fbbf24', borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                        }} />
                        <span style={{ fontSize: '0.85rem' }}>{t('leaderboard.loading')}</span>
                    </div>
                ) : sorted.length === 0 ? (
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-secondary)', flexDirection: 'column', gap: '8px',
                        textAlign: 'center', padding: 'var(--spacing-xl)'
                    }}>
                        <Trophy size={40} color="rgba(251,191,36,0.3)" />
                        <p style={{ fontSize: '1rem', fontWeight: '600' }}>{t('leaderboard.empty')}</p>
                        {!cloudAuth?.isSignedIn ? (
                            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{t('leaderboard.signInToAppear')}</p>
                        ) : (
                            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{t('leaderboard.enableToAppear')}</p>
                        )}
                    </div>
                ) : (
                    <>
                        {sorted.map((entry, i) => (
                            <LeaderboardRow 
                                key={entry.uid}
                                entry={entry}
                                rank={getRank(i)}
                                isMe={entry.uid === currentUid}
                                reps={getReps(entry)}
                                activeTabConfig={activeTabConfig}
                                clanData={clanData}
                                nudgedMember={nudgedMember}
                                onNudge={handleNudge}
                                todayStr={todayStr}
                                onSelect={setSelectedUser}
                            />
                        ))}
                    </>
                )}
            </div>

            {/* Footer */}
            {clanData && (
                <div style={{ padding: 'var(--spacing-md)' }}>
                    <button onClick={() => setShowLeaveConfirm(true)} style={{
                        width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)',
                        background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444',
                        fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
                    }}>
                        <LogOut size={16} /> {t('leaderboard.leaveClan')}
                    </button>
                </div>
            )}

            {/* Leave Clan Confirmation */}
            {showLeaveConfirm && (
                <div className="fade-in" style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)',
                    zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 'var(--spacing-lg)'
                }}>
                    <div className="scale-in" style={{
                        background: 'linear-gradient(135deg, rgba(30,30,30,0.95), rgba(20,20,20,0.95))',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 'var(--radius-xl)', padding: '24px',
                        width: '100%', maxWidth: '320px', textAlign: 'center',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                    }}>
                        <LogOut size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.4rem', color: 'white' }}>{t('leaderboard.leaveClanConfirm')}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
                            <Trans i18nKey="leaderboard.leaveClanWarning" values={{ name: clanData.name }}>
                                Es-tu sûr de vouloir quitter <strong>{{name: clanData.name}}</strong> ? Tes statistiques personnelles sont protégées, mais tu n'apparaîtras plus dans leur classement.
                            </Trans>
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setShowLeaveConfirm(false)} className="hover-lift" style={{
                                flex: 1, padding: '14px', borderRadius: 'var(--radius-lg)',
                                background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                                fontWeight: '600', cursor: 'pointer', minHeight: 'var(--touch-min)'
                            }}>{t('common.cancel')}</button>
                            <button onClick={() => { setShowLeaveConfirm(false); onLeaveClan(); }} className="hover-lift" style={{
                                flex: 1, padding: '14px', borderRadius: 'var(--radius-lg)',
                                background: '#ef4444', border: 'none', color: 'white',
                                fontWeight: '700', cursor: 'pointer', minHeight: 'var(--touch-min)'
                            }}>{t('leaderboard.leaveClan')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Detail Modal */}
            {selectedUser && (
                <UserDetail
                    entry={selectedUser}
                    rank={getRank(sorted.findIndex(e => e.uid === selectedUser.uid))}
                    isMe={selectedUser.uid === currentUid}
                    onClose={() => setSelectedUser(null)}
                    cloudSync={cloudSync}
                />
            )}
        </div>
    );
}
