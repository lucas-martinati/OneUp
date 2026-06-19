import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Z_INDEX } from '@utils/zIndex';
import { X, ShoppingBag, ArrowLeft } from '@utils/icons';
import { Button, IconButton } from '../ui';
import { CloudSyncPanel } from './CloudSyncPanel';
import { StoreView } from './StoreView';
import { PreferencesSection, LanguageSection, PerformanceSection, CommunitySection, ThemeSection } from './SettingsSections';
import { DifficultySettings } from './DifficultySettings';
import { useAuth } from '@contexts/AuthContext';
import { useSettingsStore } from '@store/useSettingsStore';
import { useCloudSyncStore } from '@store/useCloudSyncStore';
import { useProgressStore } from '@store/useProgressStore';
import { cloudSync } from '@services/cloudSync';
import { useNotificationManager } from '@hooks/useNotificationManager';
import { useSubscription } from '@contexts/SubscriptionContext';
import { useBackHandler } from '@hooks/useBackHandler';

export function Settings({ defaultShowStore = false, onClose }) {

    // ── Store consumption ──
    const cloudAuth = useAuth();
    const settings = useSettingsStore(s => s.settings);
    const updateSettings = useSettingsStore(s => s.updateSettings);
    const conflictData = useCloudSyncStore(s => s.conflictData);
    const isDayDone = useProgressStore(s => s.isDayDone);
    const getDayNumber = useProgressStore(s => s.getDayNumber);
    const { scheduleNotification } = useNotificationManager({ isDayDone, getDayNumber });
    const { isPro } = useSubscription();

    const onSave = (newSettings) => {
        updateSettings(newSettings);
        if (scheduleNotification) scheduleNotification(newSettings);
    };
    const { t } = useTranslation();
    const [showStore, setShowStore] = useState(defaultShowStore);

    // Register back handler to close store before settings
    useBackHandler(() => {
        if (showStore) {
            setShowStore(false);
            return true;
        }
        return false;
    }, showStore);

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
                            <IconButton
                                icon={ArrowLeft}
                                variant="glass"
                                onClick={() => setShowStore(false)}
                                className="hover-lift"
                                aria-label="Back"
                            />
                        )}
                        <h2 className="panel-title" style={{ margin: 0 }}>
                            {showStore ? t('store.title') : t('settings.title')}
                        </h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {!showStore && (
                                <Button
                                    variant="success"
                                    icon={ShoppingBag}
                                    onClick={() => setShowStore(true)}
                                    className="hover-lift"
                                    style={{ borderRadius: 'var(--radius-xl)', height: 'var(--touch-min)', letterSpacing: '0.5px' }}
                                >
                                    {t('store.title')}
                                </Button>
                            )}
                            <IconButton
                                icon={X}
                                variant="glass"
                                onClick={onClose}
                                className="hover-lift"
                                aria-label="Close"
                            />
                        </div>
                    </div>
                </div>

                {/* ── Settings Content ────────────────────────────────────── */}

                {showStore ? (
                    <StoreView />
                ) : (
                    <>
                        <PreferencesSection settings={settings} onSave={onSave} />
                        <LanguageSection />
                        <PerformanceSection settings={settings} onSave={onSave} />
                        <CommunitySection settings={settings} onSave={onSave} cloudAuth={cloudAuth} />
                        <ThemeSection
                            settings={settings}
                            updateSettings={updateSettings}
                            isPro={isPro}
                            onOpenStore={() => setShowStore(true)}
                        />

                        {/* ── Données & Cloud ─────────────────────────────────────── */}
                        {cloudAuth && cloudSync && (
                            <div className="glass-premium" style={{
                                padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                                marginBottom: 'var(--spacing-md)',
                                background: 'var(--surface-section)'
                            }}>
                                <CloudSyncPanel
                                    authState={cloudAuth}
                                    onSignIn={() => cloudAuth.signIn()}
                                    onSignOut={() => cloudAuth.signOut()}
                                    onDeleteAccount={async () => {
                                        await cloudSync.deleteAccount();
                                        onClose();
                                    }}
                                    conflictData={conflictData}
                                />
                            </div>
                        )}

                        <DifficultySettings />
                    </>
                )}
            </div>
        </div>
    );
}
