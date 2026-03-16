import { useState, useEffect } from 'react';
import { X, Trophy, Medal, Crown, ChevronRight, ChevronLeft, User, Award, Flame, Calendar, TrendingUp, Activity, HeartHandshake, Link, UserPlus, LogOut, Check, Shield } from 'lucide-react';
import { Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints } from 'lucide-react';
import { EXERCISES } from '../config/exercises';
import { Avatar } from './Avatar';
import { registerBackHandler } from '../utils/backHandler';
import { isDayDoneFromCompletions, getLocalDateStr, calculateStreak } from '../utils/dateUtils';

const ICON_MAP = { Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints };

// Tab config: "global" + one per exercise
const TABS = [
    { id: 'global', label: 'Global', color: '#fbbf24', icon: Trophy },
    ...EXERCISES.map(ex => ({ id: ex.id, label: ex.label, color: ex.color, icon: ICON_MAP[ex.icon] || Dumbbell }))
];

export function Leaderboard({ onClose, cloudSync, cloudAuth, clanData, onLeaveClan }) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('global');
    const [selectedUser, setSelectedUser] = useState(null);
    const [copied, setCopied] = useState(false);
    const [nudgedMember, setNudgedMember] = useState(null);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const currentUid = cloudSync.getCurrentUserId();
    const todayStr = getLocalDateStr(new Date());

    const handleCopyCode = () => {
        if (!clanData?.code) return;
        navigator.clipboard.writeText(clanData.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNudge = async (e, uid) => {
        e.stopPropagation();
        if (nudgedMember === uid) return;
        setNudgedMember(uid);
        await cloudSync.sendClanNotification(uid, 'nudge', `t'a envoyé un poke !`);
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

    // Sort entries based on active tab
    const sorted = [...entries].sort((a, b) => {
        if (activeTab === 'global') return b.totalReps - a.totalReps;
        return (b.exerciseReps?.[activeTab] || 0) - (a.exerciseReps?.[activeTab] || 0);
    });

    // Compute ranks with ties (same score = same rank)
    const getRank = (index) => {
        if (index === 0) return 1;
        const currentReps = getReps(sorted[index]);
        const previousReps = getReps(sorted[index - 1]);
        if (currentReps === previousReps) return getRank(index - 1);
        return index + 1;
    };

    const getReps = (entry) => {
        if (activeTab === 'global') return entry.totalReps;
        return entry.exerciseReps?.[activeTab] || 0;
    };

    const activeTabConfig = TABS.find(t => t.id === activeTab);
    const TabIcon = activeTabConfig?.icon || Trophy;

    return (
        <div className="fade-in" style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(5, 5, 5, 0.97)', zIndex: 110,
            display: 'flex', flexDirection: 'column',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
            {/* ── Header ──────────────────────────────────────────── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--spacing-md) var(--spacing-md) 0'
            }}>
                {clanData ? (
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '2px' }}>
                            Ton Clan
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
                        Classement
                    </h2>
                )}
                <button onClick={onClose} className="hover-lift glass" style={{
                    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                    width: '40px', height: '40px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white', cursor: 'pointer'
                }}>
                    <X size={22} />
                </button>
            </div>

            {/* Invite Code Card */}
            {clanData && (
                <div style={{ padding: 'var(--spacing-md) var(--spacing-md) 0' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.1))',
                        border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: 'var(--radius-lg)', padding: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <UserPlus size={14} /> Code d'invitation
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '2px', color: '#fbbf24' }}>
                                {clanData.code}
                            </div>
                        </div>
                        <button onClick={handleCopyCode} className="hover-lift" style={{
                            padding: '10px 16px', borderRadius: 'var(--radius-md)',
                            background: copied ? '#10b981' : 'rgba(255,255,255,0.1)',
                            border: copied ? 'none' : '1px solid rgba(255,255,255,0.1)',
                            color: 'white', fontSize: '0.85rem', fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                        }}>
                            {copied ? <><Check size={16} /> Copié</> : <><Link size={16} /> Copier</>}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Tabs (wrapping) ───────────────────────────────── */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '6px',
                padding: 'var(--spacing-sm) var(--spacing-md)'
            }}>
                {TABS.map(tab => {
                    const isActive = tab.id === activeTab;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '6px 12px', borderRadius: '20px',
                                background: isActive
                                    ? `linear-gradient(135deg, ${tab.color}30, ${tab.color}18)`
                                    : 'rgba(255,255,255,0.05)',
                                border: isActive
                                    ? `1.5px solid ${tab.color}60`
                                    : '1.5px solid rgba(255,255,255,0.08)',
                                color: isActive ? tab.color : 'var(--text-secondary)',
                                fontSize: '0.75rem', fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Icon size={14} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ── Content ─────────────────────────────────────────── */}
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
                        <span style={{ fontSize: '0.85rem' }}>Chargement...</span>
                    </div>
                ) : sorted.length === 0 ? (
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-secondary)', flexDirection: 'column', gap: '8px',
                        textAlign: 'center', padding: 'var(--spacing-xl)'
                    }}>
                        <Trophy size={40} color="rgba(251,191,36,0.3)" />
                        <p style={{ fontSize: '1rem', fontWeight: '600' }}>Personne ici pour l'instant</p>
                        {!cloudAuth?.isSignedIn ? (
                            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                                Connecte-toi avec Google pour apparaître dans le classement !
                            </p>
                        ) : (
                            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                                Active le leaderboard dans les paramètres pour apparaître !
                            </p>
                        )}
                    </div>
                ) : (
                    <>
                        {/* ── All ranks (simple list) ───────────────────── */}
                        {sorted.map((entry, i) => {
                            const rank = getRank(i);
                            const isMe = entry.uid === currentUid;
                            const reps = getReps(entry);
                            const rankBgColors = {
                                1: 'linear-gradient(135deg, rgba(255,215,0,0.25), rgba(255,215,0,0.1))',
                                2: 'linear-gradient(135deg, rgba(192,192,192,0.2), rgba(192,192,192,0.08))',
                                3: 'linear-gradient(135deg, rgba(205,127,50,0.2), rgba(205,127,50,0.08))'
                            };
                            const rankBorderColors = {
                                1: '1px solid rgba(255,215,0,0.35)',
                                2: '1px solid rgba(192,192,192,0.3)',
                                3: '1px solid rgba(205,127,50,0.3)'
                            };
                            const bg = rankBgColors[rank] || (isMe
                                ? 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06))'
                                : 'rgba(255,255,255,0.03)');
                            const border = rankBorderColors[rank] || (isMe
                                ? '1px solid rgba(251,191,36,0.25)'
                                : '1px solid rgba(255,255,255,0.05)');
                            return (
                                <div
                                    key={entry.uid}
                                    onClick={() => setSelectedUser(entry)}
                                    className="hover-lift"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '10px 12px', borderRadius: 'var(--radius-md)',
                                        background: bg,
                                        border: border,
                                        cursor: 'pointer', transition: 'all 0.2s ease'
                                    }}
                                >
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
                                            overflow: 'hidden', textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px'
                                        }}>
                                            {isMe ? `${entry.pseudo} (toi)` : entry.pseudo}
                                            {entry.lastActiveDay === todayStr && <Shield size={12} color="#10b981" />}
                                        </div>
                                    </div>

                                    {/* Reps */}
                                    <span style={{
                                        fontSize: '0.85rem', fontWeight: '700',
                                        color: activeTabConfig?.color || '#fbbf24',
                                        flexShrink: 0
                                    }}>
                                        {reps.toLocaleString('fr-FR')}
                                    </span>

                                    <ChevronRight size={16} color="var(--text-secondary)" style={{ opacity: 0.4, flexShrink: 0 }} />

                                    {clanData && !isMe && (
                                        <button 
                                            onClick={(e) => handleNudge(e, entry.uid)}
                                            disabled={nudgedMember === entry.uid}
                                            className="hover-lift" 
                                            style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
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
                        })}
                    </>
                )}
            </div>

            {/* ── Footer ───────────────────────────────── */}
            {clanData && (
                <div style={{ padding: 'var(--spacing-md)' }}>
                    <button onClick={() => setShowLeaveConfirm(true)} style={{
                        width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)',
                        background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444',
                        fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
                    }}>
                        <LogOut size={16} /> Quitter le clan
                    </button>
                </div>
            )}

            {/* ── Leave Clan Confirmation Modal ─────────── */}
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
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.4rem', color: 'white' }}>Quitter le clan ?</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
                            Es-tu sûr de vouloir quitter <strong>{clanData.name}</strong> ? Tes statistiques personnelles sont protégées, mais tu n'apparaîtras plus dans leur classement.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setShowLeaveConfirm(false)} className="hover-lift" style={{
                                flex: 1, padding: '14px', borderRadius: 'var(--radius-lg)',
                                background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                                fontWeight: '600', cursor: 'pointer'
                            }}>Annuler</button>
                            <button onClick={() => { setShowLeaveConfirm(false); onLeaveClan(); }} className="hover-lift" style={{
                                flex: 1, padding: '14px', borderRadius: 'var(--radius-lg)',
                                background: '#ef4444', border: 'none', color: 'white',
                                fontWeight: '700', cursor: 'pointer'
                            }}>Quitter</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── User Detail Modal ───────────────────────────────── */}
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

/* ── User Detail Sub-Component (with lazy-loaded progress) ──────────── */
function UserDetail({ entry, rank, isMe, onClose, cloudSync }) {
    const rankColors = { 1: '#fbbf24', 2: '#c0c0c0', 3: '#cd7f32' };
    const rankColor = rankColors[rank] || '#818cf8';

    // Lazy-loaded detail data
    const [details, setDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(true);

    useEffect(() => {
        const unregister = registerBackHandler(() => {
            onClose();
            return true;
        });
        return unregister;
    }, [onClose]);

    // Load user details on mount (lazy)
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoadingDetails(true);
            try {
                const data = await cloudSync.loadUserDetails(entry.uid);
                if (!cancelled) setDetails(data);
            } catch (e) {
                console.error('Failed to load user details', e);
            }
            if (!cancelled) setLoadingDetails(false);
        };
        load();
        return () => { cancelled = true; };
    }, [entry.uid]);

    // Compute stats from details
    const stats = computeStats(details);

    return (
        <div
            onClick={onClose}
            className="fade-in"
            style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 'var(--spacing-md)', zIndex: 120
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="glass-premium slide-up"
                style={{
                    width: '100%', maxWidth: '400px',
                    borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-lg)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    maxHeight: '90vh', display: 'flex', flexDirection: 'column'
                }}
            >
                {/* Back button */}
                <button
                    onClick={onClose}
                    className="hover-lift"
                    style={{
                        background: 'rgba(255,255,255,0.08)', border: 'none',
                        borderRadius: '50%', width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '12px',
                        flexShrink: 0
                    }}
                >
                    <ChevronLeft size={18} />
                </button>

                {/* Profile header */}
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '8px', marginBottom: 'var(--spacing-md)'
                }}>
                    <Avatar
                        photoURL={entry.photoURL}
                        name={entry.pseudo}
                        size={64}
                        borderColor={rankColor}
                    />

                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            fontSize: '1.1rem', fontWeight: '700',
                            color: isMe ? rankColor : 'var(--text-primary)'
                        }}>
                            {entry.pseudo} {isMe && '(toi)'}
                        </div>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '3px 10px', borderRadius: '12px', marginTop: '4px',
                            background: `${rankColor}18`, border: `1px solid ${rankColor}30`
                        }}>
                            {rank <= 3 ? (
                                <Medal size={14} color={rankColor} />
                            ) : (
                                <span style={{ fontSize: '0.75rem', color: rankColor, fontWeight: '700' }}>#</span>
                            )}
                            <span style={{
                                fontSize: '0.8rem', fontWeight: '700', color: rankColor
                            }}>{rank}</span>
                        </div>
                    </div>
                </div>

                {/* ── Stats Grid ── */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '8px', marginBottom: 'var(--spacing-md)'
                }}>
                    {/* Multiplier (if not default) */}
                    {entry.difficultyMultiplier && entry.difficultyMultiplier !== 1 && (
                        <StatCard
                            icon={<Zap size={16} color="#6366f1" />}
                            label="Difficulté"
                            value={`x${entry.difficultyMultiplier}`}
                            color="#6366f1"
                        />
                    )}
                    {/* Total reps */}
                    <StatCard
                        icon={<Trophy size={16} color="#fbbf24" />}
                        label="Reps totales"
                        value={entry.totalReps.toLocaleString('fr-FR')}
                        color="#fbbf24"
                    />
                    {/* Achievements */}
                    <StatCard
                        icon={<Award size={16} color="#a855f7" />}
                        label="Succès"
                        value={entry.achievements || 0}
                        color="#a855f7"
                    />
                    {/* Streak (from lazy-loaded data) */}
                    <StatCard
                        icon={<Flame size={16} color="#f97316" />}
                        label="Meilleure série"
                        value={loadingDetails ? '…' : (stats.maxStreak || 0)}
                        color="#f97316"
                    />
                    {/* Total days */}
                    <StatCard
                        icon={<Calendar size={16} color="#22d3ee" />}
                        label="Jours actifs"
                        value={loadingDetails ? '…' : (stats.totalDays || 0)}
                        color="#22d3ee"
                    />
                    {/* Current streak */}
                    <StatCard
                        icon={<TrendingUp size={16} color="#10b981" />}
                        label="Série en cours"
                        value={loadingDetails ? '…' : (stats.currentStreak || 0)}
                        color="#10b981"
                    />
                    {/* Perfect days */}
                    <StatCard
                        icon={<Activity size={16} color="#ec4899" />}
                        label="Jours parfaits"
                        value={loadingDetails ? '…' : (stats.perfectDays || 0)}
                        color="#ec4899"
                    />
                </div>

                {/* Per-exercise breakdown */}
                <div style={{
                    display: 'flex', flexDirection: 'column', gap: '6px',
                    flex: 1, overflowY: 'auto', scrollbarWidth: 'thin'
                }}>
                    {EXERCISES.map(ex => {
                        const ExIcon = ICON_MAP[ex.icon] || Dumbbell;
                        const reps = entry.exerciseReps?.[ex.id] || 0;
                        const maxReps = Math.max(
                            ...EXERCISES.map(e => entry.exerciseReps?.[e.id] || 0),
                            1
                        );
                        const barWidth = (reps / maxReps) * 100;
                        const exDays = loadingDetails ? null : (stats.exerciseDays?.[ex.id] || 0);
                        return (
                            <div key={ex.id} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 10px', borderRadius: 'var(--radius-md)',
                                background: `${ex.color}08`
                            }}>
                                <ExIcon size={16} color={ex.color} style={{ flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between',
                                        alignItems: 'center', marginBottom: '3px'
                                    }}>
                                        <span style={{
                                            fontSize: '0.75rem', fontWeight: '600', color: ex.color
                                        }}>{ex.label}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {!loadingDetails && (stats.exerciseStreaks?.[ex.id] || 0) > 0 && (
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: '2px',
                                                    background: stats.exerciseDoneToday?.[ex.id]
                                                        ? 'rgba(249,115,22,0.12)'
                                                        : 'rgba(120,120,120,0.08)',
                                                    padding: '2px 6px', borderRadius: '8px'
                                                }}>
                                                    <span style={{
                                                        fontSize: '0.6rem',
                                                        opacity: stats.exerciseDoneToday?.[ex.id] ? 1 : 0.5,
                                                        filter: stats.exerciseDoneToday?.[ex.id] ? 'none' : 'grayscale(1)'
                                                    }}>🔥</span>
                                                    <span style={{
                                                        fontSize: '0.65rem', fontWeight: '700',
                                                        color: stats.exerciseDoneToday?.[ex.id] ? '#f97316' : '#888'
                                                    }}>{stats.exerciseStreaks[ex.id]}j</span>
                                                </div>
                                            )}
                                            {exDays !== null && (
                                                <span style={{
                                                    fontSize: '0.65rem', color: 'var(--text-secondary)',
                                                    opacity: 0.7
                                                }}>
                                                    {exDays}j
                                                </span>
                                            )}
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: '700',
                                                color: 'var(--text-primary)'
                                            }}>
                                                {reps.toLocaleString('fr-FR')}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{
                                        height: '3px', borderRadius: '2px',
                                        background: 'rgba(255,255,255,0.05)', overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            height: '100%', borderRadius: '2px',
                                            width: `${barWidth}%`,
                                            background: `linear-gradient(90deg, ${ex.color}, ${ex.color}88)`,
                                            transition: 'width 0.4s ease'
                                        }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ── Stat Card ─────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, color }) {
    return (
        <div style={{
            padding: '10px', borderRadius: 'var(--radius-md)',
            background: `${color}08`,
            border: `1px solid ${color}15`,
            textAlign: 'center'
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '4px', marginBottom: '4px'
            }}>
                {icon}
                <span style={{
                    fontSize: '0.6rem', textTransform: 'uppercase',
                    letterSpacing: '1px', color: 'var(--text-secondary)'
                }}>{label}</span>
            </div>
            <div style={{
                fontSize: '1.3rem', fontWeight: '800', color
            }}>
                {value}
            </div>
        </div>
    );
}

/* ── Compute stats from user progress data ──────────────────────────── */
function computeStats(details) {
    if (!details?.completions) {
        return { maxStreak: 0, currentStreak: 0, totalDays: 0, perfectDays: 0, exerciseDays: {} };
    }

    const completions = details.completions;
    const today = getLocalDateStr(new Date());

    // Total active days (at least one exercise done)
    let totalDays = 0;
    let perfectDays = 0;
    const exerciseDays = {};

    EXERCISES.forEach(ex => { exerciseDays[ex.id] = 0; });

    for (const date in completions) {
        const day = completions[date];
        if (!day || typeof day !== 'object') continue;

        let anyDone = false;
        let allDone = true;
        for (const ex of EXERCISES) {
            if (day[ex.id]?.isCompleted) {
                anyDone = true;
                exerciseDays[ex.id]++;
            } else {
                allDone = false;
            }
        }
        if (anyDone) totalDays++;
        if (allDone) perfectDays++;
    }

    // Streak calculation
    let maxStreak = 0;
    let currentStreak = 0;
    let temp = 0;
    for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = getLocalDateStr(d);
        if (isDayDoneFromCompletions(completions, dateStr)) {
            temp++;
            if (temp > maxStreak) maxStreak = temp;
        } else {
            if (i === 0) {
                // Today not done — still count from yesterday
            } else {
                break;
            }
            temp = 0;
        }
    }

    // Current streak
    currentStreak = calculateStreak(completions, today);

    // Per-exercise streaks & today-done
    const exerciseStreaks = {};
    const exerciseDoneToday = {};
    for (const ex of EXERCISES) {
        exerciseDoneToday[ex.id] = !!completions[today]?.[ex.id]?.isCompleted;
        // Streak: count consecutive days backward
        let streak = 0;
        for (let i = 0; i < 365; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = getLocalDateStr(d);
            if (completions[dateStr]?.[ex.id]?.isCompleted) {
                streak++;
            } else if (i === 0) {
                // Today not done — check from yesterday
            } else {
                break;
            }
        }
        exerciseStreaks[ex.id] = streak;
    }

    return { maxStreak, currentStreak, totalDays, perfectDays, exerciseDays, exerciseStreaks, exerciseDoneToday };
}
