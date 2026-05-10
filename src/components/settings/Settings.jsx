import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Z_INDEX } from '../../utils/zIndex';
import { X, Bell, Volume2, Clock, Users, Lock, Unlock, Gauge, Globe, Heart, RotateCcw, ShoppingBag, ArrowLeft, Sparkles, Smartphone } from '../../utils/icons';
import { CloudSyncPanel } from './CloudSyncPanel';
import { Capacitor } from '@capacitor/core';
import { getPurchaseHistory } from '../../services/purchaseService';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { SettingRow } from '../ui/SettingRow';
import { StoreCard } from '../store/StoreCard';
import { useAuth } from '../../contexts/AuthContext';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCloudSyncStore } from '../../store/useCloudSyncStore';
import { useProgressStore } from '../../store/useProgressStore';
import { cloudSync } from '../../services/cloudSync';
import { useNotificationManager } from '../../hooks/useNotificationManager';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useBackHandler } from '../../hooks/useBackHandler';
import { useExerciseConfig } from '../../hooks/useExerciseConfig';
import { EXERCISES, CARDIO_EXERCISES } from '../../config/exercises';
import { WEIGHT_EXERCISES } from '../../config/weights';
import { getExerciseLabel } from '../../utils/exerciseLabel';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ORDER } from '../../config/categories';

function CategorySeparator({ label, color }) {
    return (
        <div style={{ 
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '0 8px'
        }}>
            <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${color}25)` }} />
            <span style={{ 
                fontSize: '0.7rem', fontWeight: '800', 
                color: `${color}`, textTransform: 'uppercase', 
                letterSpacing: '1.5px', whiteSpace: 'nowrap'
            }}>{label}</span>
            <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${color}25, transparent)` }} />
        </div>
    );
}

export function Settings({ defaultShowStore = false, onClose }) {

    // ── Store consumption ──
    const cloudAuth = useAuth();
    const settings = useSettingsStore(s => s.settings);
    const updateSettings = useSettingsStore(s => s.updateSettings);
    const conflictData = useCloudSyncStore(s => s.conflictData);
    const isDayDone = useProgressStore(s => s.isDayDone);
    const getDayNumber = useProgressStore(s => s.getDayNumber);
    const { scheduleNotification } = useNotificationManager({ isDayDone, getDayNumber });
    const { getConfig, updateConfig } = useExerciseConfig();
    const { isSupporter, isPro, purchaseSupporter: onPurchaseSupporter, purchasePro: onPurchasePro, purchaseProYearly: onPurchaseProYearly, restorePurchases: onRestorePurchases } = useSubscription();

    const onSave = (newSettings) => {
        updateSettings(newSettings);
        if (scheduleNotification) scheduleNotification(newSettings);
    };
    const { t, i18n } = useTranslation();
    const [showStore, setShowStore] = useState(defaultShowStore);
    const [isMultiplierUnlocked, setIsMultiplierUnlocked] = useState(false);

    const [revenueCatHistory, setRevenueCatHistory] = useState([]);

    const displayHistory = revenueCatHistory || [];

    useEffect(() => {
        if (showStore) {
            getPurchaseHistory().then(hist => {
                setRevenueCatHistory(hist);
            });
        }
    }, [showStore]);
    
    // Register back handler to close store before settings
    useBackHandler(() => {
        if (showStore) {
            setShowStore(false);
            return true;
        }
        return false;
    }, showStore);

    const handleToggleNotifications = () => {
        const newSettings = { ...settings, notificationsEnabled: !settings.notificationsEnabled };
        onSave(newSettings);
    };

    const handleToggleSounds = () => {
        const newSettings = { ...settings, soundsEnabled: !settings.soundsEnabled };
        onSave(newSettings);
    };

    const handleToggleScreenOn = () => {
        const newSettings = { ...settings, keepScreenOn: !settings.keepScreenOn };
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
        <div className="fade-in modal-overlay" style={{ zIndex: Z_INDEX.MODAL }}>
            <div className="modal-content">
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
                    <h2 className="panel-title rainbow-gradient" style={{ margin: 0 }}>
                        {showStore ? t('store.title') : t('settings.title')}
                    </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                                <span>{t('store.title')}</span>
                            </button>
                        )}
                        <button onClick={onClose} className="hover-lift glass" style={{
                            background: 'var(--surface-hover)', border: 'none', borderRadius: '50%',
                            width: '40px', height: '40px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-primary)', cursor: 'pointer'
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
                        buyButtonText={isSupporter ? t('supporter.donateAgain') : t('supporter.buyButton')}
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
                        features={[t('pro.features.customExercises'), t('pro.features.weightDashboard'), t('pro.features.exclusiveLeaderboards'), t('pro.features.shareThemes')]}
                        buyButtonText={`${t('pro.buyButton')} — ${t('pro.price')}`}
                        onPurchase={onPurchasePro}
                        cloudAuth={cloudAuth}
                        yearlyBilling={{
                            label: {
                                monthly: t('pro.billingMonthly'),
                                yearly: t('pro.billingYearly'),
                            },
                            price: {
                                monthly: t('pro.price'),
                                yearly: t('pro.priceYearly'),
                            },
                            savings: t('pro.yearlySavings'),
                            buyButtonText: `${t('pro.buyButton')} — ${t('pro.priceYearly')}`,
                            onPurchaseYearly: onPurchaseProYearly,
                        }}
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
                                {t('supporter.history')}
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
                                                {t(receipt.titleKey)}
                                            </div>
                                            <div style={{ 
                                                fontWeight: '800', fontSize: '0.9rem', 
                                                color: receipt.isActive ? '#10b981' : 'var(--text-secondary)'
                                            }}>
                                                {t(receipt.priceKey)}
                                            </div>
                                        </div>
                                        
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                            {t(receipt.descKey)}
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
                    isLast={false}
                >
                    <ToggleSwitch
                        enabled={settings.soundsEnabled}
                        onClick={handleToggleSounds}
                        activeGradient="linear-gradient(135deg, #0ea5e9, #0284c7)"
                    />
                </SettingRow>

                <SettingRow
                    icon={Smartphone}
                    title={t('settings.keepScreenOn')}
                    description={t('settings.keepScreenOnDesc')}
                    color="#f59e0b"
                    isLast={true}
                >
                    <ToggleSwitch
                        enabled={settings.keepScreenOn ?? true}
                        onClick={handleToggleScreenOn}
                        activeGradient="linear-gradient(135deg, #f59e0b, #d97706)"
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
                    color="var(--accent)"
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
                            background: 'var(--surface-elevated)',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            minHeight: 'var(--touch-min)',
                            minWidth: '140px',
                            outline: 'none'
                        }}
                    >
                        <option value="fr" style={{ background: '#0a0a0f', color: '#ffffff' }}>Français</option>
                        <option value="en" style={{ background: '#0a0a0f', color: '#ffffff' }}>English</option>
                        <option value="es" style={{ background: '#0a0a0f', color: '#ffffff' }}>Español</option>
                        <option value="de" style={{ background: '#0a0a0f', color: '#ffffff' }}>Deutsch</option>
                        <option value="it" style={{ background: '#0a0a0f', color: '#ffffff' }}>Italiano</option>
                        <option value="pt" style={{ background: '#0a0a0f', color: '#ffffff' }}>Português</option>
                        <option value="zh" style={{ background: '#0a0a0f', color: '#ffffff' }}>中文</option>
                        <option value="ja" style={{ background: '#0a0a0f', color: '#ffffff' }}>日本語</option>
                        <option value="ko" style={{ background: '#0a0a0f', color: '#ffffff' }}>한국어</option>
                        <option value="ru" style={{ background: '#0a0a0f', color: '#ffffff' }}>Русский</option>
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
                    title={t('leaderboard.title')}
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
                            placeholder={cloudAuth?.user?.displayName || t('common.yourPseudo')}
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

            {/* ── Thème de l'application (PRO) ─────────────────────────── */}
            <div className="glass-premium" style={{
                padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                marginBottom: 'var(--spacing-md)',
                background: 'var(--surface-section)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <h3 style={sectionTitleStyle}>
                    {t('settings.appTheme')} {!isPro && <Lock size={14} color="var(--accent)" style={{ marginLeft: 'auto', opacity: 0.8 }} />}
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', opacity: isPro ? 1 : 0.6, pointerEvents: isPro ? 'auto' : 'none' }}>
                    {[
                        { key: 'dark', color: '#0f0f1a', accent: '#818cf8' },
                        { key: 'ocean', color: '#0a1628', accent: '#06b6d4' },
                        { key: 'sunset', color: '#1a0a0a', accent: '#f97316' },
                        { key: 'forest', color: '#0a1a0f', accent: '#22c55e' },
                        { key: 'purple', color: '#120a1a', accent: '#a855f7' }
                    ].map(theme => {
                        const isSelected = (settings.appTheme || 'dark') === theme.key;
                        return (
                            <button
                                key={theme.key}
                                onClick={() => updateSettings(prev => ({ ...prev, appTheme: theme.key }))}
                                style={{
                                    width: '42px', height: '42px', borderRadius: '12px',
                                    border: isSelected ? `2px solid ${theme.accent}` : '2px solid rgba(255,255,255,0.1)',
                                    background: theme.color,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                                title={t(`share.theme.${theme.key}`)}
                            >
                                <div style={{
                                    width: '16px', height: '16px', borderRadius: '50%',
                                    background: theme.accent,
                                    boxShadow: isSelected ? `0 0 8px ${theme.accent}66` : 'none'
                                }} />
                            </button>
                        );
                    })}
                </div>
                {!isPro && (
                    <div 
                        onClick={() => setShowStore(true)}
                        style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)',
                            cursor: 'pointer', zIndex: 2
                        }}
                    >
                        <div style={{
                            background: 'var(--surface-elevated)', color: 'var(--text-primary)',
                            padding: '8px 16px', borderRadius: '20px',
                            fontSize: '0.85rem', fontWeight: 'bold',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            border: '1px solid var(--border-default)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                            marginTop: '24px'
                        }}>
                            <Lock size={14} color="var(--accent)" /> PRO
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
                <h3 style={{ ...sectionTitleStyle, color: isMultiplierUnlocked ? '#ef4444' : 'var(--text-secondary)' }}>{t('common.difficulty')}</h3>

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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
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
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {CATEGORY_ORDER.map(catKey => {
                                let title, exList;
                                if (catKey === CATEGORIES.CARDIO) { title = t('common.cardio'); exList = CARDIO_EXERCISES; }
                                else if (catKey === CATEGORIES.BODYWEIGHT) { title = t('common.bodyweight'); exList = EXERCISES; }
                                else if (catKey === CATEGORIES.WEIGHTS) { 
                                    if (!isPro) return null;
                                    title = t('common.weights'); exList = WEIGHT_EXERCISES; 
                                }
                                else return null;

                                if (!exList || exList.length === 0) return null;

                                return (
                                    <div key={catKey} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <CategorySeparator label={title} color={CATEGORY_COLORS[catKey]} />
                                        {exList.map(ex => {
                                            const val = getConfig(ex.id).difficulty;
                                            const exColor = ex.color || CATEGORY_COLORS[catKey];
                                            const percentage = ((val - 0.1) / 0.9) * 100;
                                            return (
                                                <div key={ex.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                                                            {getExerciseLabel(ex, t)}
                                                        </span>
                                                        <span style={{ fontSize: '0.8rem', color: exColor, fontWeight: '700', background: `${exColor}25`, padding: '2px 8px', borderRadius: '10px' }}>
                                                            x{val.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        className="premium-slider"
                                                        min="0.1" max="1.0" step="0.1"
                                                        value={val}
                                                        onChange={(e) => {
                                                            const newVal = Math.min(1.0, Math.max(0.1, parseFloat(e.target.value)));
                                                            updateConfig(ex.id, { difficulty: newVal });
                                                        }}
                                                        style={{
                                                            '--slider-color': exColor,
                                                            background: `linear-gradient(to right, ${exColor} ${percentage}%, var(--surface-muted) ${percentage}%)`
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            </>
            )}
        </div>
    </div>
    );
}
