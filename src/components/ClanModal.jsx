import { useEffect, useState } from 'react';
import { Users, LogIn, Plus, X, Check, Shield } from 'lucide-react';
import { cloudSync } from '../services/cloudSync';
import { Leaderboard } from './Leaderboard';
import { registerBackHandler } from '../utils/backHandler';
import { CSSConfetti } from './CSSConfetti';

export function ClanModal({ onClose, cloudAuth, settings, updateSettings }) {
    const [userClans, setUserClans] = useState([]);
    const [clanData, setClanData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState('menu'); // 'menu' | 'create' | 'join' | 'dashboard'
    const [inputValue, setInputValue] = useState('');
    const [pseudoInput, setPseudoInput] = useState('');
    const [error, setError] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (cloudAuth?.user) {
            setPseudoInput(settings?.leaderboardPseudo || cloudAuth.user.displayName || '');
        }
    }, [cloudAuth?.user, settings?.leaderboardPseudo]);

    // Initial load
    useEffect(() => {
        const fetchClans = async () => {
            if (cloudAuth?.isSignedIn) {
                const clans = await cloudSync.getUserClans();
                setUserClans(clans);
            }
            setView('menu');
            setIsLoading(false);
        };
        fetchClans();
    }, [cloudAuth?.isSignedIn]);

    // Back handler
    useEffect(() => {
        const unreg = registerBackHandler(() => {
            if (view === 'create' || view === 'join') {
                setView('menu');
                setInputValue('');
                setError('');
                return true;
            }
            if (view === 'dashboard') {
                setView('menu');
                setClanData(null);
                return true;
            }
            onClose();
            return true;
        });
        return unreg;
    }, [view, onClose]);

    const handleOpenClan = async (clanId) => {
        setIsLoading(true);
        const data = await cloudSync.getClanDetails(clanId);
        if (data) {
            setClanData(data);
            setView('dashboard');
        } else {
            setError('Impossible de charger ce clan');
        }
        setIsLoading(false);
    };

    const handleCreate = async () => {
        if (!settings?.leaderboardPseudo && !pseudoInput.trim()) return setError('Un pseudo est requis');
        if (!inputValue.trim()) return setError('Le nom du clan est requis');
        
        setIsLoading(true);
        setError('');

        if (!settings?.leaderboardPseudo && pseudoInput.trim()) {
            updateSettings({ ...settings, leaderboardPseudo: pseudoInput.trim() });
        }

        const res = await cloudSync.createClan(inputValue.trim());
        if (res.success) {
            setShowConfetti(true);
            const clans = await cloudSync.getUserClans();
            setUserClans(clans);
            await handleOpenClan(res.clanId);
        } else {
            setError(res.error || 'Erreur lors de la création');
            setIsLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!settings?.leaderboardPseudo && !pseudoInput.trim()) return setError('Un pseudo est requis');
        if (!inputValue.trim() || inputValue.trim().length !== 6) return setError('Code à 6 caractères requis');
        
        setIsLoading(true);
        setError('');

        if (!settings?.leaderboardPseudo && pseudoInput.trim()) {
            updateSettings({ ...settings, leaderboardPseudo: pseudoInput.trim() });
        }

        const res = await cloudSync.joinClan(inputValue.trim());
        if (res.success) {
            setShowConfetti(true);
            const clans = await cloudSync.getUserClans();
            setUserClans(clans);
            await handleOpenClan(res.clanId);
        } else {
            setError(res.error || 'Code invalide');
            setIsLoading(false);
        }
    };

    const handleLeave = async () => {
        setIsLoading(true);
        const res = await cloudSync.leaveClan(clanData.id);
        if (res.success) {
            setClanData(null);
            const clans = await cloudSync.getUserClans();
            setUserClans(clans);
            setView('menu');
            setInputValue('');
        }
        setIsLoading(false);
    };

    // ── Loader ───────────────────────────────────────────────────────────
    if (isLoading && !clanData && view !== 'create' && view !== 'join') {
        return (
            <div className="fade-in" style={{
                position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.92)',
                zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{ color: 'var(--text-secondary)' }}>Chargement...</div>
            </div>
        );
    }

    // ── Menu / Create / Join ─────────────────────────────────────────────
    if (view !== 'dashboard') {
        return (
            <div className="fade-in" style={{
                position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.92)',
                zIndex: 1000, display: 'flex', flexDirection: 'column',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}>
                <div style={{ padding: 'var(--spacing-md)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} className="glass hover-lift" style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-secondary)'
                    }}><X size={20} /></button>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-lg)', gap: '20px' }}>
                    <Users size={64} color="#f59e0b" style={{ marginBottom: '10px' }} />
                    <h2 style={{
                        fontSize: '1.8rem', fontWeight: '800', textAlign: 'center', margin: 0,
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>Clan OneUp</h2>

                    {view === 'menu' && (
                        <>
                            {!cloudAuth?.isSignedIn ? (
                                <>
                                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                                        Connecte-toi avec Google pour créer ou rejoindre un clan !
                                    </p>
                                    <button onClick={() => cloudSync.signIn()} className="hover-lift" style={{
                                        width: '100%', maxWidth: '300px', padding: '16px', borderRadius: 'var(--radius-lg)',
                                        background: 'linear-gradient(135deg, #818cf8, #6366f1)', border: 'none', color: 'white',
                                        fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}><LogIn size={20} /> Se connecter</button>
                                </>
                            ) : (
                                <>
                                    {userClans.length > 0 && (
                                        <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', textAlign: 'center', marginBottom: '4px' }}>
                                                Tes Clans ({userClans.length})
                                            </div>
                                            {userClans.map(clan => (
                                                <button key={clan.id} onClick={() => handleOpenClan(clan.id)} className="hover-lift" style={{
                                                    width: '100%', padding: '16px', borderRadius: 'var(--radius-lg)',
                                                    background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.15))',
                                                    border: '1px solid rgba(245,158,11,0.3)', color: 'white',
                                                    fontSize: '1.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    boxShadow: '0 4px 12px rgba(245,158,11,0.1)', overflow: 'hidden'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                                                        <div style={{ 
                                                            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                                                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black'
                                                        }}>
                                                            <Shield size={16} />
                                                        </div>
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clan.name}</span>
                                                    </div>
                                                    <span style={{ flexShrink: 0, fontSize: '0.85rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
                                                        <Users size={14} /> {clan.memberCount}
                                                    </span>
                                                </button>
                                            ))}
                                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '12px 0 4px 0' }} />
                                        </div>
                                    )}

                                    {userClans.length === 0 && (
                                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                                            Rejoins tes amis, comparez vos efforts et motivez-vous ensemble !
                                        </p>
                                    )}

                                    <button onClick={() => { setView('join'); setError(''); setInputValue(''); }} className="hover-lift" style={{
                                        width: '100%', maxWidth: '300px', padding: '16px', borderRadius: 'var(--radius-lg)',
                                        background: 'linear-gradient(135deg, #818cf8, #6366f1)', border: 'none', color: 'white',
                                        fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        marginBottom: '12px'
                                    }}><LogIn size={20} /> Rejoindre un clan</button>

                                    <button onClick={() => { setView('create'); setError(''); setInputValue(''); }} className="hover-lift" style={{
                                        width: '100%', maxWidth: '300px', padding: '16px', borderRadius: 'var(--radius-lg)',
                                        background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)',
                                        fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}><Plus size={20} /> Créer un clan</button>
                                </>
                            )}
                        </>
                    )}

                    {(view === 'create' || view === 'join') && (
                        <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {!settings?.leaderboardPseudo && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.85rem' }}>
                                        Choisis un pseudo pour apparaître dans ton clan :
                                    </p>
                                    <input
                                        type="text"
                                        value={pseudoInput}
                                        onChange={(e) => setPseudoInput(e.target.value)}
                                        placeholder="Ton pseudo..."
                                        maxLength={20}
                                        style={{
                                            width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)',
                                            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'white', fontSize: '1.1rem', textAlign: 'center', fontWeight: 'bold'
                                        }}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: !settings?.leaderboardPseudo ? '16px' : '0' }}>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.85rem' }}>
                                    {view === 'create' ? 'Donne un nom épique à ton clan :' : 'Entre le code à 6 caractères :'}
                                </p>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(view === 'join' ? e.target.value.toUpperCase() : e.target.value)}
                                    placeholder={view === 'create' ? "Nom du clan..." : "EX: ABC123"}
                                    maxLength={view === 'join' ? 6 : 20}
                                    style={{
                                        width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
                                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white', fontSize: '1.2rem', textAlign: 'center', fontWeight: '800'
                                    }}
                                />
                            </div>
                            {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}
                            <button onClick={view === 'create' ? handleCreate : handleJoin} disabled={isLoading} className="hover-lift" style={{
                                width: '100%', padding: '16px', borderRadius: 'var(--radius-lg)',
                                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: 'none', color: 'black',
                                fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                opacity: isLoading ? 0.7 : 1
                            }}>
                                {isLoading ? 'Chargement...' : view === 'create' ? 'Créer le clan' : 'Rejoindre'}
                            </button>
                            <button onClick={() => setView('menu')} style={{
                                width: '100%', padding: '12px', background: 'transparent', border: 'none',
                                color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px'
                            }}>Annuler</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── Dashboard ────────────────────────────────────────────────────────
    return (
        <>
            <CSSConfetti active={showConfetti} onDone={() => setShowConfetti(false)} />
            <Leaderboard 
                clanData={clanData} 
                onClose={onClose} 
                cloudSync={cloudSync} 
                cloudAuth={cloudAuth}
                onLeaveClan={handleLeave}
            />
        </>
    );
}
