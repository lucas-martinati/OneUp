import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, LogIn, Plus, X, Check, Shield } from 'lucide-react';
import { cloudSync } from '../../services/cloudSync';
import { Leaderboard } from './Leaderboard';
import { registerBackHandler } from '../../utils/backHandler';
import { CSSConfetti } from '../feedback/CSSConfetti';
import { Z_INDEX } from '../../utils/zIndex';

export function ClanModal({ onClose, cloudAuth, settings, updateSettings }) {
    const { t } = useTranslation();
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
                // If a user is selected in the leaderboard, the Leaderboard common back handler 
                // (registered via UserDetail) will catch it first because it was registered later.
                // If we reach here, no user is selected, so we go back to menu.
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
            setError(t('clan.cannotLoad'));
        }
        setIsLoading(false);
    };

    const handleCreate = async () => {
        if (!settings?.leaderboardPseudo && !pseudoInput.trim()) return setError(t('clan.pseudoRequired'));
        if (!inputValue.trim()) return setError(t('clan.nameRequired'));
        
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
            setError(res.error || t('clan.createError'));
            setIsLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!settings?.leaderboardPseudo && !pseudoInput.trim()) return setError(t('clan.pseudoRequired'));
        if (!inputValue.trim() || inputValue.trim().length !== 6) return setError(t('clan.codeRequired'));
        
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
            setError(res.error || t('clan.invalidCode'));
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
                zIndex: Z_INDEX.TOAST, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{ color: 'var(--text-secondary)' }}>{t('clan.loading')}</div>
            </div>
        );
    }

    // ── Menu / Create / Join ─────────────────────────────────────────────
    if (view !== 'dashboard') {
        return (
            <div className="fade-in" style={{
                position: 'fixed', inset: 0, background: 'rgba(5,5,5,0.92)',
                zIndex: Z_INDEX.TOAST, display: 'flex', flexDirection: 'column',
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
                        WebkitBackgroundClip: 'text', backgroundClip: 'text',                         WebkitTextFillColor: 'transparent'
                    }}>{t('clan.title')}</h2>

                    {view === 'menu' && (
                        <>
                            {!cloudAuth?.isSignedIn ? (
                                <>
                                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                                        {t('clan.signInRequired')}
                                    </p>
                                    <button onClick={() => cloudAuth.signIn()} className="hover-lift" style={{
                                        width: '100%', maxWidth: '300px', padding: '16px', borderRadius: 'var(--radius-lg)',
                                        background: 'linear-gradient(135deg, #818cf8, #6366f1)', border: 'none', color: 'white',
                                        fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}><LogIn size={20} /> {t('clan.signIn')}</button>
                                </>
                            ) : (
                                <>
                                    {userClans.length > 0 && (
                                        <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', textAlign: 'center', marginBottom: '4px' }}>
                                                {t('clan.yourClans', { count: userClans.length })}
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
                                            {t('clan.joinFriends')}
                                        </p>
                                    )}

                                    <button onClick={() => { setView('join'); setError(''); setInputValue(''); }} className="hover-lift" style={{
                                        width: '100%', maxWidth: '300px', padding: '16px', borderRadius: 'var(--radius-lg)',
                                        background: 'linear-gradient(135deg, #818cf8, #6366f1)', border: 'none', color: 'white',
                                        fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        marginBottom: '12px'
                                    }}><LogIn size={20} /> {t('clan.joinClan')}</button>

                                    <button onClick={() => { setView('create'); setError(''); setInputValue(''); }} className="hover-lift" style={{
                                        width: '100%', maxWidth: '300px', padding: '16px', borderRadius: 'var(--radius-lg)',
                                        background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)',
                                        fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}><Plus size={20} /> {t('clan.createClan')}</button>
                                </>
                            )}
                        </>
                    )}

                    {(view === 'create' || view === 'join') && (
                        <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {!settings?.leaderboardPseudo && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.85rem' }}>
                                        {t('clan.choosePseudo')}
                                    </p>
                                    <input
                                        type="text"
                                        value={pseudoInput}
                                        onChange={(e) => setPseudoInput(e.target.value)}
                                        placeholder={t('clan.yourPseudo')}
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
                                    {view === 'create' ? t('clan.clanNamePrompt') : t('clan.enterCode')}
                                </p>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(view === 'join' ? e.target.value.toUpperCase() : e.target.value)}
                                    placeholder={view === 'create' ? t('clan.clanNamePlaceholder') : "EX: ABC123"}
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
                                {isLoading ? t('clan.loadingBtn') : view === 'create' ? t('clan.createButton') : t('clan.join')}
                            </button>
                            <button onClick={() => setView('menu')} style={{
                                width: '100%', padding: '12px', background: 'transparent', border: 'none',
                                color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px'
                            }}>{t('common.cancel')}</button>
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
