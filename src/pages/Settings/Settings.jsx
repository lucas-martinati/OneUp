import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Z_INDEX } from '@utils/zIndex';
import { ShoppingBag } from '@utils/icons';
import { Button, ModalHeader, Card } from '@components/ui';
import { CloudSyncPanel } from './components/CloudSyncPanel';
import { StoreView } from './components/StoreView';
import { PreferencesSection, LanguageSection, PerformanceSection, CommunitySection, ThemeSection, DataSection } from './components/SettingsPanels';
import { DifficultySettings } from './components/DifficultySettings';
import { openLegalPage } from '@utils/navigation';
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
                <ModalHeader
                    title={showStore ? t('store.title') : t('settings.title')}
                    onClose={onClose}
                    onBack={showStore ? () => setShowStore(false) : undefined}
                    actions={
                        !showStore && (
                            <Button
                                variant="premium"
                                icon={ShoppingBag}
                                onClick={() => setShowStore(true)}
                            >
                                {t('store.title')}
                            </Button>
                        )
                    }
                />

                {/* ── Settings Content ────────────────────────────────────── */}

                {showStore ? (
                    <StoreView />
                ) : (
                    <div className="section-stack">
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
                            <Card>
                                <CloudSyncPanel
                                    authState={cloudAuth}
                                    onSignIn={() => cloudAuth.signIn()}
                                    onSignOut={() => cloudAuth.signOut()}
                                    onDeleteAccount={async () => {
                                        await cloudSync.deleteAccount();
                                        onClose();
                                    }}
                                    conflictData={conflictData}
                                    onDeleteAllData={!cloudAuth.isSignedIn ? async () => {
                                        const { Preferences } = await import('@capacitor/preferences');
                                        await Preferences.clear();
                                        localStorage.clear();
                                        window.location.reload();
                                    } : undefined}
                                />
                            </Card>
                        )}

                        <DataSection />

                        <DifficultySettings />

                        {/* Legal footer */}
                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingTop: 'var(--space-2)',
                            opacity: 0.6,
                            fontSize: '0.78rem'
                        }}>
                            <button
                                onClick={() => openLegalPage('terms')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    fontSize: 'inherit',
                                    fontFamily: 'inherit'
                                }}
                                className="hover-lift"
                            >
                                {t('settings.termsOfService')}
                            </button>
                            <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>•</span>
                            <button
                                onClick={() => openLegalPage('privacy')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    fontSize: 'inherit',
                                    fontFamily: 'inherit'
                                }}
                                
                            >
                                {t('settings.privacyPolicy')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
