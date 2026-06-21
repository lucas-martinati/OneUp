import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, LogIn, Plus, Shield } from '@utils/icons';
import { CSSConfetti } from '../feedback/CSSConfetti';
import { GoogleSignInButton } from '@components/ui/GoogleSignInButton';
import { useAuth } from '@contexts/AuthContext';
import { useSettingsStore } from '@store/useSettingsStore';
import { useCloudSyncStore } from '@store/useCloudSyncStore';
import { cloudSync } from '@services/cloudSync';

export function ClanManager({ onClanJoined }) {
    const cloudAuth = useAuth();
    const settings = useSettingsStore(s => s.settings);
    const updateSettings = useSettingsStore(s => s.updateSettings);
    const userClans = useCloudSyncStore(s => s.userClans);
    const refreshUserClans = useCloudSyncStore(s => s.refreshUserClans);
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [view, setView] = useState('menu'); // 'menu' | 'create' | 'join'
    const [inputValue, setInputValue] = useState('');
    const [pseudoInput, setPseudoInput] = useState('');
    const [error, setError] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);

    // Sync pseudo input when user/settings change
    useEffect(() => {
        if (cloudAuth?.user) {
            const newPseudo = settings?.leaderboardPseudo || cloudAuth.user.displayName || '';
            queueMicrotask(() => setPseudoInput(newPseudo));
        }
    }, [cloudAuth?.user, settings?.leaderboardPseudo]);

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
            await refreshUserClans();
            if (onClanJoined) onClanJoined(res.clanId);
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
            await refreshUserClans();
            if (onClanJoined) onClanJoined(res.clanId);
        } else {
            setError(res.error || t('clan.invalidCode'));
            setIsLoading(false);
        }
    };

    // ── Loader ───────────────────────────────────────────────────────────
    if (isLoading && view !== 'create' && view !== 'join') {
        return (
            <div className="fade-in" style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</div>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{
            flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto'
        }}>
            <CSSConfetti active={showConfetti} onDone={() => setShowConfetti(false)} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--spacing-lg)', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Users size={56} color="#f59e0b" />
                    <h2 className="panel-title" style={{
                        margin: 0,
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>{t('clan.title')}</h2>
                </div>

                {view === 'menu' && (
                    <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {!cloudAuth?.isSignedIn ? (
                            <>
                                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 0, lineHeight: '1.5' }}>
                                    {t('clan.signInRequired')}
                                </p>
                                <GoogleSignInButton onClick={() => cloudAuth.signIn()} />
                            </>
                        ) : (
                            <>
                                {userClans.length > 0 && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', textAlign: 'center' }}>
                                            {t('clan.yourClans', { count: userClans.length })}
                                        </div>
                                        {userClans.map(clan => (
                                            <button key={clan.id} onClick={() => { if(onClanJoined) onClanJoined(clan.id) }} className="hover-lift" style={{
                                                width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)',
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
                                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
                                    </div>
                                )}

                                {userClans.length === 0 && (
                                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 0, lineHeight: '1.5' }}>
                                        {t('clan.joinFriends')}
                                    </p>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <button onClick={() => { setView('join'); setError(''); setInputValue(''); }} className="hover-lift" style={{
                                        width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)',
                                        background: 'linear-gradient(135deg, #818cf8, #6366f1)', border: 'none', color: 'white',
                                        fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}><LogIn size={20} /> {t('clan.joinClan')}</button>

                                    <button onClick={() => { setView('create'); setError(''); setInputValue(''); }} className="hover-lift" style={{
                                        width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)',
                                        background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)',
                                        fontSize: '1rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}><Plus size={20} /> {t('clan.createClan')}</button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {(view === 'create' || view === 'join') && (
                    <div className="scale-in" style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {!settings?.leaderboardPseudo && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.85rem' }}>
                                    {t('clan.choosePseudo')}
                                </p>
                                <input
                                    type="text"
                                    value={pseudoInput}
                                    onChange={(e) => setPseudoInput(e.target.value)}
                                    placeholder={t('common.yourPseudo')}
                                    maxLength={20}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
                                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white', fontSize: '1.1rem', textAlign: 'center', fontWeight: 'bold'
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                                    width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
                                    background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white', fontSize: '1.2rem', textAlign: 'center', fontWeight: '800'
                                }}
                            />
                        </div>
                        
                        {error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                            {/* Submit Button */}
                            {(() => {
                                let submitLabel = t('clan.join');
                                if (isLoading) {
                                    submitLabel = t('common.loading');
                                } else if (view === 'create') {
                                    submitLabel = t('clan.createButton');
                                }
                                return (
                                    <button onClick={view === 'create' ? handleCreate : handleJoin} disabled={isLoading} className="hover-lift" style={{
                                        width: '100%', padding: '14px', borderRadius: 'var(--radius-lg)',
                                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: 'none', color: 'black',
                                        fontSize: '1rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        opacity: isLoading ? 0.7 : 1
                                    }}>
                                        {submitLabel}
                                    </button>
                                );
                            })()}
                            <button onClick={() => setView('menu')} style={{
                                width: '100%', padding: '14px', background: 'transparent', border: 'none',
                                color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer'
                            }}>{t('common.cancel')}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
