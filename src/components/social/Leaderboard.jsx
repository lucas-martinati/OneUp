import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { X, Trophy, LogOut, Activity } from '../../utils/icons';
import { IconButton, Spinner } from '../ui';
import { EXERCISES } from '../../config/exercises';
import { WEIGHT_EXERCISES } from '../../config/weights';
import { getLocalDateStr } from '../../utils/dateUtils';
import { ClanInviteCard } from './ClanInviteCard';
import { LeaderboardTabs } from './LeaderboardTabs';
import { LeaderboardRow } from './LeaderboardRow';
import { LeaderboardPodium } from './LeaderboardPodium';
import styles from './Leaderboard.module.css';
import { Z_INDEX } from '../../utils/zIndex';
import { UserDetail } from './UserDetail';
import { getIcon } from '../../utils/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCloudSyncStore } from '../../store/useCloudSyncStore';
import { cloudSync } from '../../services/cloudSync';
import { useSwipe } from '../../hooks/useSwipe';
import { ClanManager } from './ClanManager';
import { useBackHandler } from '../../hooks/useBackHandler';
import { SegmentedControl } from '../ui/SegmentedControl';

// Flip to false to disable the top-3 podium and render everyone as plain rows
// (handy to preview how rows look — e.g. a perfect day outside the podium).
const SHOW_PODIUM = true;

export function Leaderboard({ onClose, activeSlide = 0, initialClanData = null, onLeaveClan }) {

    // ── Store consumption ──
    const cloudAuth = useAuth();
    const settings = useSettingsStore(s => s.settings);
    const refreshUserClans = useCloudSyncStore(s => s.refreshUserClans);
    const { t } = useTranslation();

    const [domain, setDomain] = useState(activeSlide === 2 ? 'weights' : 'bodyweight');

    const VISIBLE_TABS = useMemo(() => {
        const combinedTab = { 
            id: 'global_combined', 
            labelKey: 'common.global', 
            color: '#ec4899', 
            icon: Activity,
            isSpecial: true,
            isGlobal: true
        };

        if (domain === 'weights') { 
            return [
                combinedTab,
                { id: 'weights', customLabel: `${t('common.global')} ${t('common.weights')}`, color: '#8b5cf6', icon: getIcon('Dumbbell'), isGlobal: true },
                ...WEIGHT_EXERCISES.map(ex => ({ id: ex.id, labelKey: 'exercises.' + ex.id, color: ex.color, icon: getIcon(ex.icon) }))
            ];
        }
        return [
            combinedTab,
            { id: 'bodyweight', customLabel: `${t('common.global')} ${t('common.bodyweight')}`, color: '#fbbf24', icon: Trophy, isGlobal: true },
            ...EXERCISES.map(ex => ({ id: ex.id, labelKey: 'exercises.' + ex.id, color: ex.color, icon: getIcon(ex.icon) }))
        ];
    }, [domain, t]);

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(activeSlide === 2 ? 'weights' : 'bodyweight');
    const [selectedUser, setSelectedUser] = useState(null);
    const [nudgedMember, setNudgedMember] = useState(null);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    
    // Community context state
    const [communityContext, setCommunityContext] = useState(initialClanData ? initialClanData.id : 'global'); // 'global' | 'manage' | clanId

    // Handle back button to close internal modals or sub-views
    useBackHandler(() => {
        if (selectedUser) {
            setSelectedUser(null);
            return true;
        }
        if (showLeaveConfirm) {
            setShowLeaveConfirm(false);
            return true;
        }
        if (communityContext !== 'global' && communityContext !== 'manage') {
            setCommunityContext('manage');
            return true;
        }
        if (communityContext === 'manage') {
            setCommunityContext('global');
            return true;
        }
        onClose();
        return true;
    }, true);
    const [clanData, setClanData] = useState(initialClanData);

    // Swipe gesture handling
    const swipeHandlers = useSwipe({
        onSwipeLeft: () => {
            if (communityContext === 'global') setCommunityContext('manage');
        },
        onSwipeRight: () => {
            if (communityContext === 'manage') setCommunityContext('global');
        }
    });

    const currentUid = cloudSync.getCurrentUserId();
    const todayStr = getLocalDateStr(new Date());

    const handleNudge = async (e, uid) => {
        e.stopPropagation();
        if (nudgedMember === uid) return;
        setNudgedMember(uid);
        await cloudSync.sendClanNotification(uid, 'nudge', t('common.poke'));
        setTimeout(() => setNudgedMember(null), 2000);
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            if (communityContext === 'global') {
                setClanData(null);
                const data = await cloudSync.loadLeaderboard();
                setEntries(data);
            } else if (communityContext !== 'manage') {
                const data = await cloudSync.getClanDetails(communityContext);
                setClanData(data);
                if (data) setEntries(data.members);
            }
        } catch (e) {
            console.error('Failed to load leaderboard', e);
        }
        setLoading(false);
    }, [communityContext]);

    useEffect(() => {
        if (communityContext !== 'manage') {
            const timer = setTimeout(() => {
                loadData();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [loadData, communityContext]);

    const sorted = useMemo(() => {
        const filteredEntries = domain === 'weights' ? entries.filter(e => e.isPro || e.weightsTotalReps > 0) : entries;
        return [...filteredEntries].sort((a, b) => {
            if (activeTab === 'global_combined') return ((b.totalReps || 0) + (b.weightsTotalReps || 0)) - ((a.totalReps || 0) + (a.weightsTotalReps || 0));
            if (activeTab === 'bodyweight') return (b.totalReps || 0) - (a.totalReps || 0);
            if (activeTab === 'weights') return (b.weightsTotalReps || 0) - (a.weightsTotalReps || 0);
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
        if (activeTab === 'bodyweight') return entry.totalReps || 0;
        if (activeTab === 'weights') return entry.weightsTotalReps || 0;
        return entry.exerciseReps?.[activeTab] || 0;
    };

    const activeTabConfig = VISIBLE_TABS.find(t => t.id === activeTab) || VISIBLE_TABS[0];

    // Top 3 feed the podium hero; everyone else falls into the list below.
    // When the podium is disabled, everyone is rendered as plain rows instead.
    const usePodium = SHOW_PODIUM;
    const podiumCount = usePodium ? 3 : 0;
    const podiumItems = sorted.slice(0, podiumCount).map((entry, i) => ({
        entry: entry.uid === currentUid ? { ...entry, exerciseDifficulties: settings.exerciseDifficulties } : entry,
        rank: getRank(i),
        reps: getReps(entry)
    }));
    const restEntries = sorted.slice(podiumCount);

    return (
        <div 
            className="fade-in modal-overlay" 
            {...swipeHandlers}
            style={{ zIndex: Z_INDEX.MODAL }}
        >
            <div className={`modal-content ${styles.shell}`}>
                {/* Header with Switch */}
            <div className={`${styles.header} ${styles.rise} ${styles.rise1}`}>
                <div className={styles.headerLeft}>
                    <h2 className="panel-title" style={{ margin: 0 }}>
                        {t('leaderboard.title')}
                    </h2>

                    <SegmentedControl
                        value={communityContext === 'global' ? 'global' : 'clans'}
                        onChange={(val) => {
                            if (val === 'global') setCommunityContext('global');
                            else setCommunityContext('manage');
                        }}
                        options={[
                            { id: 'global', label: t('common.global'), activeBg: '#fbbf24', activeColor: '#000' },
                            { id: 'clans', label: t('clan.title'), activeBg: '#8b5cf6', activeColor: '#fff' }
                        ]}
                    />
                </div>

                <IconButton icon={X} variant="glass" onClick={onClose} className="hover-lift" aria-label="Close" style={{ flexShrink: 0 }} />
            </div>

            {/* Back button and Clan Name when viewing a specific clan */}
            {communityContext !== 'global' && communityContext !== 'manage' && (
                <div className={`fade-in ${styles.clanBar}`}>
                    <button onClick={() => setCommunityContext('manage')} className={styles.backBtn}>
                        ← {t('onboarding.back')}
                    </button>
                    <span className={styles.clanName}>{clanData?.name}</span>
                </div>
            )}

            {communityContext === 'manage' ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, marginTop: '12px' }}>
                    <ClanManager onClanJoined={(clanId) => {
                        setCommunityContext(clanId);
                    }} />
                </div>
            ) : (
                <>
                    {clanData && <ClanInviteCard clanData={clanData} />}

            {/* Domain filter - stays fixed */}
            <LeaderboardTabs 
                domain={domain}
                setDomain={setDomain}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                VISIBLE_TABS={VISIBLE_TABS}
                showDomainFilter={true}
                showExerciseTabs={false}
            />

            {/* Content - exercise tabs + podium + users list scroll together */}
            <div className={styles.list}>
                <LeaderboardTabs
                    domain={domain}
                    setDomain={setDomain}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    VISIBLE_TABS={VISIBLE_TABS}
                    showDomainFilter={false}
                    showExerciseTabs={true}
                />
                {loading ? (
                    <div className={styles.center}>
                        <Spinner label={t('common.loading')} />
                    </div>
                ) : sorted.length === 0 ? (
                    <div className={styles.center}>
                        <div className={styles.emptyIcon}>
                            <Trophy size={30} color="#fbbf24" />
                        </div>
                        <p className={styles.emptyTitle}>{t('leaderboard.empty')}</p>
                        <p className={styles.emptyHint}>
                            {!cloudAuth?.isSignedIn ? t('leaderboard.signInToAppear') : t('leaderboard.enableToAppear')}
                        </p>
                    </div>
                ) : (
                    <>
                        {usePodium && (
                            <LeaderboardPodium
                                items={podiumItems}
                                currentUid={currentUid}
                                todayStr={todayStr}
                                onSelect={setSelectedUser}
                                clanData={clanData}
                                nudgedMember={nudgedMember}
                                onNudge={handleNudge}
                                t={t}
                            />
                        )}

                        {restEntries.map((entry, i) => (
                            <LeaderboardRow
                                key={entry.uid}
                                entry={entry.uid === currentUid ? {
                                    ...entry,
                                    exerciseDifficulties: settings.exerciseDifficulties
                                } : entry}
                                rank={getRank(i + podiumCount)}
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
            {clanData && communityContext !== 'manage' && (
                <div style={{ paddingTop: 'var(--spacing-sm)' }}>
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
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                    zIndex: Z_INDEX.DELETE_MODAL, display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                            <button onClick={async () => { 
                                setShowLeaveConfirm(false); 
                                const res = await cloudSync.leaveClan(clanData.id);
                                if (res.success) {
                                    await refreshUserClans();
                                    setCommunityContext('global');
                                }
                                if (onLeaveClan) onLeaveClan(); 
                            }} className="hover-lift" style={{
                                flex: 1, padding: '14px', borderRadius: 'var(--radius-lg)',
                                background: '#ef4444', border: 'none', color: 'white',
                                fontWeight: '700', cursor: 'pointer', minHeight: 'var(--touch-min)'
                            }}>{t('leaderboard.leaveClan')}</button>
                        </div>
                    </div>
                </div>
            )}

                </>
            )}

            {/* User Detail Modal */}
            {selectedUser && (
                <UserDetail
                    entry={selectedUser}
                    rank={getRank(sorted.findIndex(e => e.uid === selectedUser.uid))}
                    isMe={selectedUser.uid === currentUid}
                    onClose={() => setSelectedUser(null)}
                />
            )}
            </div>
        </div>
    );
}
