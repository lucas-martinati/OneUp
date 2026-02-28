import { useState, useEffect } from 'react';
import { X, Trophy, Medal, Crown, ChevronRight, ChevronLeft, User } from 'lucide-react';
import { Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints } from 'lucide-react';
import { EXERCISES } from '../config/exercises';

const ICON_MAP = { Dumbbell, ArrowDownUp, ArrowUp, Zap, ChevronsUp, Footprints };

// Tab config: "global" + one per exercise
const TABS = [
    { id: 'global', label: 'Global', color: '#fbbf24', icon: Trophy },
    ...EXERCISES.map(ex => ({ id: ex.id, label: ex.label, color: ex.color, icon: ICON_MAP[ex.icon] || Dumbbell }))
];

export function Leaderboard({ onClose, cloudSync }) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('global');
    const [selectedUser, setSelectedUser] = useState(null);
    const currentUid = cloudSync.getCurrentUserId();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await cloudSync.loadLeaderboard();
            setEntries(data);
        } catch (e) {
            console.error('Failed to load leaderboard', e);
        }
        setLoading(false);
    };

    // Sort entries based on active tab
    const sorted = [...entries].sort((a, b) => {
        if (activeTab === 'global') return b.totalReps - a.totalReps;
        return (b.exerciseReps?.[activeTab] || 0) - (a.exerciseReps?.[activeTab] || 0);
    });

    const getReps = (entry) => {
        if (activeTab === 'global') return entry.totalReps;
        return entry.exerciseReps?.[activeTab] || 0;
    };

    const activeTabConfig = TABS.find(t => t.id === activeTab);
    const TabIcon = activeTabConfig?.icon || Trophy;

    return (
        <div className="fade-in" style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(5, 5, 5, 0.97)', backdropFilter: 'blur(16px)', zIndex: 110,
            display: 'flex', flexDirection: 'column',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
            {/* ── Header ──────────────────────────────────────────── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--spacing-md) var(--spacing-md) 0'
            }}>
                <h2 style={{
                    margin: 0, fontSize: '1.8rem', fontWeight: '800',
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Classement
                </h2>
                <button onClick={onClose} className="hover-lift glass" style={{
                    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                    width: '40px', height: '40px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white', cursor: 'pointer'
                }}>
                    <X size={22} />
                </button>
            </div>

            {/* ── Tabs (scrollable) ───────────────────────────────── */}
            <div style={{
                display: 'flex', gap: '6px', overflowX: 'auto',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch'
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
                                cursor: 'pointer', whiteSpace: 'nowrap',
                                transition: 'all 0.2s ease', flexShrink: 0
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
                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                            Active le leaderboard dans les paramètres pour apparaître !
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ── All ranks (simple list) ───────────────────── */}
                        {sorted.map((entry, i) => {
                            const rank = i + 1;
                            const isMe = entry.uid === currentUid;
                            const reps = getReps(entry);
                            return (
                                <div
                                    key={entry.uid}
                                    onClick={() => setSelectedUser(entry)}
                                    className="hover-lift"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '10px 12px', borderRadius: 'var(--radius-md)',
                                        background: isMe
                                            ? 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06))'
                                            : 'rgba(255,255,255,0.03)',
                                        border: isMe
                                            ? '1px solid rgba(251,191,36,0.25)'
                                            : '1px solid rgba(255,255,255,0.05)',
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
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        overflow: 'hidden', flexShrink: 0,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: isMe ? '1.5px solid rgba(251,191,36,0.4)' : '1.5px solid rgba(255,255,255,0.08)'
                                    }}>
                                        {entry.photoURL ? (
                                            <img src={entry.photoURL} alt="" style={{
                                                width: '100%', height: '100%', objectFit: 'cover'
                                            }} />
                                        ) : (
                                            <div style={{
                                                width: '100%', height: '100%', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <User size={16} color="var(--text-secondary)" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Name */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <span style={{
                                            fontSize: '0.85rem', fontWeight: '600',
                                            color: isMe ? '#fbbf24' : 'var(--text-primary)',
                                            overflow: 'hidden', textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap', display: 'block'
                                        }}>
                                            {isMe ? `${entry.pseudo} (toi)` : entry.pseudo}
                                        </span>
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
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* ── User Detail Modal ───────────────────────────────── */}
            {selectedUser && (
                <UserDetail
                    entry={selectedUser}
                    rank={sorted.findIndex(e => e.uid === selectedUser.uid) + 1}
                    isMe={selectedUser.uid === currentUid}
                    onClose={() => setSelectedUser(null)}
                />
            )}
        </div>
    );
}

/* ── User Detail Sub-Component ──────────────────────────────────────── */
function UserDetail({ entry, rank, isMe, onClose }) {
    const rankColors = { 1: '#fbbf24', 2: '#c0c0c0', 3: '#cd7f32' };
    const rankColor = rankColors[rank] || '#818cf8';

    return (
        <div
            onClick={onClose}
            className="fade-in"
            style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 'var(--spacing-md)', zIndex: 120
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="glass-premium slide-up"
                style={{
                    width: '100%', maxWidth: '380px',
                    borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-lg)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
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
                        color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '12px'
                    }}
                >
                    <ChevronLeft size={18} />
                </button>

                {/* Profile header */}
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '8px', marginBottom: 'var(--spacing-md)'
                }}>
                    {/* Avatar */}
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%',
                        overflow: 'hidden', border: `2px solid ${rankColor}`,
                        boxShadow: `0 0 20px ${rankColor}33`,
                        background: 'rgba(255,255,255,0.05)'
                    }}>
                        {entry.photoURL ? (
                            <img src={entry.photoURL} alt="" style={{
                                width: '100%', height: '100%', objectFit: 'cover'
                            }} />
                        ) : (
                            <div style={{
                                width: '100%', height: '100%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center'
                            }}>
                                <User size={28} color={rankColor} />
                            </div>
                        )}
                    </div>

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

                {/* Total reps hero */}
                <div style={{
                    textAlign: 'center', marginBottom: 'var(--spacing-md)',
                    padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(245,158,11,0.05))'
                }}>
                    <div style={{
                        fontSize: '0.6rem', textTransform: 'uppercase',
                        letterSpacing: '1.5px', color: 'var(--text-secondary)', marginBottom: '2px'
                    }}>
                        Reps totales
                    </div>
                    <div style={{
                        fontSize: '2rem', fontWeight: '900', color: '#fbbf24'
                    }}>
                        {entry.totalReps.toLocaleString('fr-FR')}
                    </div>
                </div>

                {/* Per-exercise breakdown */}
                <div style={{
                    display: 'flex', flexDirection: 'column', gap: '6px'
                }}>
                    {EXERCISES.map(ex => {
                        const ExIcon = ICON_MAP[ex.icon] || Dumbbell;
                        const reps = entry.exerciseReps?.[ex.id] || 0;
                        const maxReps = Math.max(
                            ...EXERCISES.map(e => entry.exerciseReps?.[e.id] || 0),
                            1
                        );
                        const barWidth = (reps / maxReps) * 100;
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
                                        <span style={{
                                            fontSize: '0.75rem', fontWeight: '700',
                                            color: 'var(--text-primary)'
                                        }}>
                                            {reps.toLocaleString('fr-FR')}
                                        </span>
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