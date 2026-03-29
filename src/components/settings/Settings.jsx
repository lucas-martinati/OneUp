import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Bell, Volume2, Clock, Check, Users, Settings as SettingsIcon, Lock, Unlock, Gauge, Globe, Heart, RotateCcw, ShoppingBag, ArrowLeft, Sparkles, Star, Smartphone } from 'lucide-react';
import { CloudSyncPanel } from './CloudSyncPanel';
import { Capacitor } from '@capacitor/core';
import { getPurchaseHistory } from '../../services/purchaseService';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { SettingRow } from '../ui/SettingRow';
import { StoreCard } from '../store/StoreCard';

export function Settings({ defaultShowStore = false, settings, onClose, onSave, cloudAuth, cloudSync, conflictData, onResolveConflict, isSupporter, isPro, onPurchaseSupporter, onPurchasePro, onRestorePurchases }) {
    const { t, i18n } = useTranslation();
    const [showSaved, setShowSaved] = useState(false);
    const [showStore, setShowStore] = useState(defaultShowStore);
    const [isMultiplierUnlocked, setIsMultiplierUnlocked] = useState(false);

    const showSavedIndicator = () => {
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 1500);
    };

    const [revenueCatHistory, setRevenueCatHistory] = useState([]);

    const displayHistory = revenueCatHistory || [];

    useEffect(() => {
        if (showStore) {
            getPurchaseHistory().then(hist => {
                setRevenueCatHistory(hist);
            });
        }
    }, [showStore]);

    const handleToggleNotifications = () => {
        const newSettings = { ...settings, notificationsEnabled: !settings.notificationsEnabled };
        onSave(newSettings);
    };

    const handleToggleSounds = () => {
        const newSettings = { ...settings, soundsEnabled: !settings.soundsEnabled };
        onSave(newSettings);
    };

    const handleHourChange = (hour) => {
        const newSettings = {
            ...settings,
            notificationTime: { ...settings.notificationTime, hour: parseInt(hour) }
        };
        onSave(newSettings);
    };

    const handleMinuteChange = (minute) => {
        const newSettings = {
            ...settings,
            notificationTime: { ...settings.notificationTime, minute: parseInt(minute) }
        };
        onSave(newSettings);
    };

    const sectionTitleStyle = {
        marginBottom: 'var(--spacing-md)', fontSize: '0.85rem', fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: '1px',
        color: 'var(--text-secondary)'
    };

    return (
        <div className="fade-in modal-overlay" style={{ zIndex: 110 }}>
            <div className="modal-content" style={{
                maxWidth: '600px', width: '100%', margin: '0 auto',
                padding: 'var(--spacing-md)',
                paddingTop: 'calc(var(--spacing-md) + env(safe-area-inset-top))',
                paddingBottom: 'calc(var(--spacing-lg) + env(safe-area-inset-bottom))'
            }}>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 'var(--spacing-md)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {showStore && (
                        <button onClick={() => setShowStore(false)} className="hover-lift glass" style={{
                            background: 'var(--surface-hover)', border: 'none', borderRadius: '50%',
                            width: 'var(--touch-min)', height: 'var(--touch-min)',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer'
                        }}>
                            <ArrowLeft size={22} />
                        </button>
                    )}
                    <h2 className="rainbow-gradient" style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '800' }}>
                        {showStore ? 'Boutique' : t('settings.title')}
                    </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Auto-save indicator */}
                    {showSaved && (
                        <div className="scale-in" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            background: 'var(--success)',
                            color: 'white',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            boxShadow: 'var(--glow-success)'
                        }}>
                            <Check size={16} />
                            {t('common.saved')}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {!showStore && (
                            <button onClick={() => setShowStore(true)} className="hover-lift" style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                borderRadius: '24px',
                                padding: '0 16px',
                                height: 'var(--touch-min)',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                justifyContent: 'center', color: 'white', cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                fontWeight: '800', fontSize: '0.85rem',
                                letterSpacing: '0.5px'
                            }}>
                                <ShoppingBag size={18} />
                                <span>Boutique</span>
                            </button>
                        )}
                        <button onClick={onClose} className="hover-lift glass" style={{
                            background: 'var(--surface-hover)', border: 'none', borderRadius: '50%',
                            width: 'var(--touch-min)', height: 'var(--touch-min)',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer'
                        }}>
                            <X size={22} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Settings Content ────────────────────────────────────── */}

            {showStore ? (
                /* ── BOUTIQUE VIEW ────────────────────────────────────────── */
                <div className="fade-in slide-up" style={{ animationDuration: '0.4s' }}>
                    <StoreCard
                        isActive={isSupporter}
                        title={t('supporter.title')}
                        icon={Heart}
                        colorMain="#ef4444"
                        colorRGB="239,68,68"
                        colorGradientStart="#ef4444"
                        colorGradientEnd="#dc2626"
                        activeTitle={t('supporter.thankYou')}
                        activeDesc={t('supporter.badgeActive')}
                        idleDescription={t('supporter.description')}
                        idleExplanation={t('supporter.explanation')}
                        buyButtonText={isSupporter ? "Faire un nouveau don" : t('supporter.buyButton')}
                        onPurchase={onPurchaseSupporter}
                        cloudAuth={cloudAuth}
                        allowMultiplePurchases={true}
                    />

                    {/* ── ABONNEMENT PRO ───────────────────────────────────── */}
                    <StoreCard
                        isActive={isPro}
                        title={t('pro.title')}
                        icon={Sparkles}
                        colorMain="#8b5cf6"
                        colorRGB="139,92,246"
                        colorGradientStart="#8b5cf6"
                        colorGradientEnd="#7c3aed"
                        activeTitle={t('pro.activeTitle')}
                        activeDesc={t('pro.activeDesc')}
                        idleDescription={t('pro.description')}
                        idleExplanation={t('pro.explanation')}
                        features={['Exercices 100% Personnalisés', 'Dashboard Musculation (Poids)', 'Leaderboards Exclusifs']}
                        buyButtonText={`${t('pro.buyButton')} — ${t('pro.price')}`}
                        onPurchase={onPurchasePro}
                        cloudAuth={cloudAuth}
                    />

                    {/* Restore purchases button (shared for all tiers) */}
                    <button
                        onClick={onRestorePurchases}
                        style={{
                            width: '100%', padding: '10px',
                            borderRadius: 'var(--radius-md)',
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.8rem', fontWeight: '600',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '6px', cursor: 'pointer',
                            marginBottom: 'var(--spacing-md)'
                        }}
                    >
                        <RotateCcw size={14} />
                        {t('supporter.restore')}
                    </button>

                    {/* --- Historique des achats --- */}
                    {displayHistory && displayHistory.length > 0 && (
                        <div className="glass-premium" style={{
                            padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                            marginBottom: 'var(--spacing-md)',
                            background: 'var(--surface-section)'
                        }}>
                            <div style={{ 
                                fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)',
                                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px'
                            }}>
                                Historique des achats
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {displayHistory.map((receipt, index) => (
                                    <div key={index} style={{
                                        display: 'flex', flexDirection: 'column',
                                        padding: '12px', borderRadius: 'var(--radius-md)',
                                        background: 'var(--surface-muted)', border: '1px solid var(--border-subtle)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                {receipt.title}
                                            </div>
                                            <div style={{ 
                                                fontWeight: '800', fontSize: '0.9rem', 
                                                color: receipt.isActive ? '#10b981' : 'var(--text-secondary)'
                                            }}>
                                                {receipt.price}
                                            </div>
                                        </div>
                                        
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                            {receipt.desc}
                                        </div>

                                        <div style={{ 
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', borderTop: '1px dashed rgba(255,255,255,0.05)',
                                            paddingTop: '8px', opacity: 0.8
                                        }}>
                                            <span style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                                                ID: {receipt.id || 'N/A'}
                                            </span>
                                            <span>
                                                {receipt.date ? new Date(receipt.date).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
            {/* ── Préférences ─────────────────────────────────────────── */}
            <div className="glass-premium" style={{
                padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                marginBottom: 'var(--spacing-md)',
                background: 'var(--surface-section)'
            }}>
                <h3 style={sectionTitleStyle}>{t('settings.preferences')}</h3>

                <SettingRow
                    icon={Bell}
                    title={t('settings.notifications')}
                    description={t('settings.reminder')}
                    color="#8b5cf6"
                    isLast={!settings.notificationsEnabled}
                >
                    <ToggleSwitch
                        enabled={settings.notificationsEnabled}
                        onClick={handleToggleNotifications}
                        activeGradient="linear-gradient(135deg, #8b5cf6, #6d28d9)"
                    />
                </SettingRow>

                {/* Notification Time Picker */}
                {settings?.notificationsEnabled && settings?.notificationTime && (
                    <div className="scale-in" style={{
                        padding: '12px 0 16px 0',
                        borderBottom: '1px solid var(--border-subtle)',
                    }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            marginBottom: '10px', color: 'var(--text-secondary)'
                        }}>
                            <Clock size={14} />
                            <div style={{ fontWeight: '600', fontSize: '0.8rem' }}>{t('settings.reminderTime')}</div>
                        </div>
                        <div style={{
                            display: 'flex', gap: '12px', alignItems: 'center',
                        }}>
                            <select
                                value={settings.notificationTime.hour}
                                onChange={(e) => handleHourChange(e.target.value)}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-subtle)',
                                    background: 'var(--surface-muted)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1.1rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    textAlign: 'center',
                                    flex: 1
                                }}
                            >
                                {Array.from({ length: 24 }, (_, i) => (
                                    <option key={i} value={i} style={{ background: 'var(--surface-muted)', color: 'var(--text-primary)' }}>
                                        {String(i).padStart(2, '0')}
                                    </option>
                                ))}
                            </select>
                            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-secondary)' }}>:</span>
                            <select
                                value={settings.notificationTime.minute}
                                onChange={(e) => handleMinuteChange(e.target.value)}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-subtle)',
                                    background: 'var(--surface-muted)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1.1rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    textAlign: 'center',
                                    flex: 1
                                }}
                            >
                                {[0, 15, 30, 45].map(minute => (
                                    <option key={minute} value={minute} style={{ background: 'var(--surface-muted)', color: 'var(--text-primary)' }}>
                                        {String(minute).padStart(2, '0')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                <SettingRow
                    icon={Volume2}
                    title={t('settings.soundEffects')}
                    description={t('settings.soundsDescription')}
                    color="#0ea5e9"
                    isLast={true}
                >
                    <ToggleSwitch
                        enabled={settings.soundsEnabled}
                        onClick={handleToggleSounds}
                        activeGradient="linear-gradient(135deg, #0ea5e9, #0284c7)"
                    />
                </SettingRow>
            </div>

            {/* ── Langue ── */}
            <div className="glass-premium" style={{
                padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                marginBottom: 'var(--spacing-md)',
                background: 'var(--surface-section)'
            }}>
                <h3 style={sectionTitleStyle}>{t('settings.language')}</h3>
                <SettingRow
                    icon={Globe}
                    title={t('settings.language')}
                    description={t('settings.languageDesc')}
                    color="#06b6d4"
                    isLast={true}
                >
                    <select
                        value={i18n.language}
                        onChange={(e) => {
                            i18n.changeLanguage(e.target.value);
                            localStorage.setItem('oneup_language', e.target.value);
                        }}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: '2px solid var(--border-subtle)',
                            background: '#1a1a2e',
                            color: '#ffffff',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            minHeight: 'var(--touch-min)',
                            minWidth: '140px',
                            outline: 'none'
                        }}
                    >
                        <option value="fr" style={{ background: '#1a1a2e', color: '#ffffff' }}>{t('settings.french')}</option>
                        <option value="en" style={{ background: '#1a1a2e', color: '#ffffff' }}>{t('settings.english')}</option>
                        <option value="es" style={{ background: '#1a1a2e', color: '#ffffff' }}>{t('settings.spanish')}</option>
                        <option value="zh" style={{ background: '#1a1a2e', color: '#ffffff' }}>{t('settings.chinese')}</option>
                        <option value="ru" style={{ background: '#1a1a2e', color: '#ffffff' }}>{t('settings.russian')}</option>
                    </select>
                </SettingRow>
            </div>

            {/* ── Performance ──────────────────────────────────────────── */}
            <div className="glass-premium" style={{
                padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                marginBottom: 'var(--spacing-md)',
                background: 'var(--surface-section)'
            }}>
                <h3 style={sectionTitleStyle}>{t('settings.performance')}</h3>

                <SettingRow
                    icon={Gauge}
                    title={t('settings.graphicsMode')}
                    description={
                        settings.performanceMode === 'low'
                            ? t('settings.reducedEffects')
                            : t('settings.allEffects')
                    }
                    color="#10b981"
                    isLast={true}
                >
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {[
                            { value: 'low', label: t('settings.eco'), color: '#f59e0b' },
                            { value: 'high', label: t('settings.max'), color: '#8b5cf6' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    const newSettings = { ...settings, performanceMode: opt.value };
                                    onSave(newSettings);
                                }}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '10px',
                                    border: settings.performanceMode === opt.value
                                        ? `2px solid ${opt.color}`
                                        : '2px solid var(--border-subtle)',
                                    background: settings.performanceMode === opt.value
                                        ? `${opt.color}20`
                                        : 'transparent',
                                    color: settings.performanceMode === opt.value
                                        ? opt.color
                                        : 'var(--text-secondary)',
                                    fontSize: '0.85rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    minHeight: 'var(--touch-min)'
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </SettingRow>
            </div>

            {/* ── Communauté ──────────────────────────────────────────── */}
            <div className="glass-premium" style={{
                padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                marginBottom: 'var(--spacing-md)',
                background: 'var(--surface-section)'
            }}>
                <h3 style={sectionTitleStyle}>{t('settings.community')}</h3>

                <SettingRow
                    icon={Users}
                    title={t('settings.leaderboard')}
                    description={t('settings.leaderboardDesc')}
                    color="#fbbf24"
                    isLast={!settings.leaderboardEnabled}
                >
                    <ToggleSwitch
                        enabled={settings.leaderboardEnabled}
                        onClick={() => {
                            const newSettings = { ...settings, leaderboardEnabled: !settings.leaderboardEnabled };
                            onSave(newSettings);
                        }}
                        activeGradient="linear-gradient(135deg, #fbbf24, #d97706)"
                    />
                </SettingRow>

                {settings.leaderboardEnabled && (
                    <div className="scale-in" style={{ padding: '12px 0 4px 0' }}>
                        <label style={{
                            fontSize: '0.8rem', color: 'var(--text-secondary)',
                            fontWeight: '600', marginBottom: '8px', display: 'block',
                            textTransform: 'uppercase', letterSpacing: '0.5px'
                        }}>
                            {t('settings.displayName')}
                        </label>
                        <input
                            type="text"
                            value={settings.leaderboardPseudo || ''}
                            onChange={(e) => {
                                const newSettings = { ...settings, leaderboardPseudo: e.target.value.slice(0, 20) };
                                onSave(newSettings);
                            }}
                            onBlur={() => showSavedIndicator()}
                            placeholder={cloudAuth?.user?.displayName || t('settings.yourPseudo')}
                            maxLength={20}
                            style={{
                                width: '100%', padding: '12px 16px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-subtle)',
                                background: 'var(--surface-muted)',
                                color: 'var(--text-primary)',
                                fontSize: '1rem', fontWeight: '600',
                                outline: 'none', boxSizing: 'border-box',
                                transition: 'all 0.2s ease'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#fbbf24';
                                e.target.style.background = 'var(--surface-hover)';
                            }}
                        />
                        <div style={{
                            fontSize: '0.75rem', color: 'var(--text-secondary)',
                            marginTop: '8px', opacity: 0.8
                        }}>
                            {t('settings.maxChars')}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Données & Cloud ─────────────────────────────────────── */}
            {cloudAuth && cloudSync && (
                <div className="glass-premium" style={{
                    padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                    marginBottom: 'var(--spacing-md)',
                    background: 'var(--surface-section)'
                }}>
                    <h3 style={sectionTitleStyle}>{t('settings.dataCloud')}</h3>
                    <CloudSyncPanel
                        authState={cloudAuth}
                        onSignIn={() => cloudSync.signIn()}
                        onSignOut={() => cloudSync.signOut()}
                        onDeleteAccount={async () => {
                            await cloudSync.deleteAccount();
                            onClose();
                        }}
                        conflictData={conflictData}
                        onResolveConflict={onResolveConflict}
                    />
                </div>
            )}



            {/* ── Difficulté (Sensitive Setting) ─────────────────────────── */}
            <div className="glass-premium" style={{
                padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                marginBottom: 'var(--spacing-md)',
                background: 'var(--surface-section)',
                border: isMultiplierUnlocked ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0
            }}>
                <h3 style={{ ...sectionTitleStyle, color: isMultiplierUnlocked ? '#ef4444' : 'var(--text-secondary)' }}>{t('settings.difficulty')}</h3>

                <div style={{ marginBottom: '16px' }}>
                    <div style={{
                        background: isMultiplierUnlocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.05)',
                        border: `1px solid ${isMultiplierUnlocked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.1)'}`,
                        padding: '14px', borderRadius: 'var(--radius-md)', color: '#fca5a5',
                        fontSize: '0.85rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px',
                        transition: 'all 0.3s ease'
                    }}>
                        <p style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
                            <Lock size={14} /> {t('settings.sensitiveParam')}
                        </p>
                        <p style={{ margin: 0, opacity: 0.9 }}>{t('settings.sensitiveWarning')}</p>
                    </div>
                </div>

                {!isMultiplierUnlocked ? (
                    <button
                        onClick={() => setIsMultiplierUnlocked(true)}
                        className="hover-lift"
                        style={{
                            width: '100%', padding: '16px', borderRadius: 'var(--radius-lg)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '2px solid rgba(239, 68, 68, 0.4)',
                            color: '#ef4444', fontWeight: '800', fontSize: '0.9rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '12px', cursor: 'pointer', letterSpacing: '1px',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
                        }}
                    >
                        {t('settings.unlockSettings')} <Lock size={18} />
                    </button>
                ) : (
                    <div className="scale-in">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: '700', color: 'white', fontSize: '0.9rem' }}>{t('settings.multiplier')}</span>
                                <button
                                    onClick={() => setIsMultiplierUnlocked(false)}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px',
                                        padding: '4px 10px', color: 'white', fontSize: '0.7rem', fontWeight: '700',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                    }}
                                >
                                    {t('settings.lock')} <Unlock size={12} />
                                </button>
                            </div>
                            <span style={{ fontWeight: '800', color: '#fbbf24', fontSize: '1.4rem', textShadow: '0 0 10px rgba(251,191,36,0.3)' }}>
                                {settings.difficultyMultiplier || 1.0}x
                            </span>
                        </div>

                        <input
                            type="range"
                            min="0.1" max="1.0" step="0.1"
                            value={settings.difficultyMultiplier || 1.0}
                            onChange={(e) => {
                                const val = Math.min(1.0, Math.max(0.1, parseFloat(e.target.value)));
                                onSave({ ...settings, difficultyMultiplier: val });
                            }}
                            onMouseUp={() => showSavedIndicator()}
                            onTouchEnd={() => showSavedIndicator()}
                            style={{
                                width: '100%',
                                height: '6px',
                                accentColor: '#fbbf24',
                                cursor: 'pointer',
                                filter: 'drop-shadow(0 0 5px rgba(251,191,36,0.2))'
                            }}
                        />
                    </div>
                )}
            </div>
            </>
            )}


        </div>
    </div>
    );
}
