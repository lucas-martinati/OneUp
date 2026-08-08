import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Volume2, Vibrate, Clock, Users, Lock, Gauge, Globe, Smartphone, Download, Upload, Calendar } from '@utils/icons';
import { ToggleSwitch, SettingRow, ThemeSwatch, Card, Button, Input, SectionTitle, Stack } from '@components/ui';
import { SegmentedControl } from '@components/ui/SegmentedControl';
import { LANGUAGES } from '@config/languages';
import { THEMES } from '@config/themes';
import { isNativePlatform } from '@utils/platform';
import { downloadBackup, parseBackup, restoreBackup, readFileText } from '@utils/dataBackup';
import { haptics } from '@utils/hapticsManager';

/** Notifications (+ time picker), sounds and keep-screen-on toggles. */
export function PreferencesSection({ settings, onSave }) {
    const { t } = useTranslation();

    return (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <SectionTitle>{t('settings.preferences')}</SectionTitle>

            <Stack gap="xs">
                <SettingRow
                    icon={Bell}
                    title={t('settings.notifications')}
                    description={t('settings.reminder')}
                    color="var(--accent-glow)"
                    isLast={!settings.notificationsEnabled}
                >
                    <ToggleSwitch
                        enabled={settings.notificationsEnabled}
                        onClick={() => onSave({ ...settings, notificationsEnabled: !settings.notificationsEnabled })}
                        activeGradient="linear-gradient(135deg, var(--accent-glow), var(--accent))"
                    />
                </SettingRow>

                {/* Notification Time Picker */}
                {settings?.notificationsEnabled && settings?.notificationTime && (
                    <Stack className="scale-in" style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--surface-muted)',
                        border: '1px solid var(--border-default)',
                    }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            color: 'var(--text-secondary)'
                        }}>
                            <Clock size={14} />
                            <div style={{ fontWeight: '600', fontSize: '0.8rem' }}>{t('settings.reminderTime')}</div>
                        </div>
                        <div style={{
                            display: 'flex', gap: '12px', alignItems: 'center',
                        }}>
                            <select
                                value={settings.notificationTime.hour}
                                onChange={(e) => onSave({
                                    ...settings,
                                    notificationTime: { ...settings.notificationTime, hour: parseInt(e.target.value) }
                                })}
                                className="input-field input-field--select"
                                style={{
                                    padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-default)', background: 'var(--surface-elevated)',
                                    color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '700',
                                    textAlign: 'center', flex: 1
                                }}
                            >
                                {Array.from({ length: 24 }, (_, i) => (
                                    <option key={i} value={i}>
                                        {String(i).padStart(2, '0')}
                                    </option>
                                ))}
                            </select>
                            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-secondary)' }}>:</span>
                            <select
                                value={settings.notificationTime.minute}
                                onChange={(e) => onSave({
                                    ...settings,
                                    notificationTime: { ...settings.notificationTime, minute: parseInt(e.target.value) }
                                })}
                                className="input-field input-field--select"
                                style={{
                                    padding: '10px 14px', borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-default)', background: 'var(--surface-elevated)',
                                    color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '700',
                                    textAlign: 'center', flex: 1
                                }}
                            >
                                {[0, 15, 30, 45].map(minute => (
                                    <option key={minute} value={minute}>
                                        {String(minute).padStart(2, '0')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </Stack>
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
                        onClick={() => onSave({ ...settings, soundsEnabled: !settings.soundsEnabled })}
                        activeGradient="linear-gradient(135deg, #0ea5e9, #0284c7)"
                    />
                </SettingRow>

                <SettingRow
                    icon={Vibrate}
                    title={t('settings.hapticFeedback')}
                    description={t('settings.hapticsDescription')}
                    color="#a855f7"
                    isLast={false}
                >
                    <ToggleSwitch
                        enabled={settings.hapticsEnabled ?? true}
                        onClick={() => onSave({ ...settings, hapticsEnabled: !(settings.hapticsEnabled ?? true) })}
                        activeGradient="linear-gradient(135deg, #a855f7, #9333ea)"
                    />
                </SettingRow>

                <SettingRow
                    icon={Smartphone}
                    title={t('settings.keepScreenOn')}
                    description={t('settings.keepScreenOnDesc')}
                    color="var(--warning)"
                    isLast={false}
                >
                    <ToggleSwitch
                        enabled={settings.keepScreenOn ?? true}
                        onClick={() => onSave({ ...settings, keepScreenOn: !settings.keepScreenOn })}
                        activeGradient="linear-gradient(135deg, var(--warning), #d97706)"
                    />
                </SettingRow>

                <Stack style={{ padding: 'var(--space-2) 0 var(--space-1) 0', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
                        <div style={{
                            background: `linear-gradient(135deg, color-mix(in srgb, #06b6d4 13%, transparent), color-mix(in srgb, #06b6d4 3%, transparent))`,
                            padding: '10px',
                            borderRadius: '12px',
                            border: `1px solid color-mix(in srgb, #06b6d4 19%, transparent)`,
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'center',
                            flexShrink: 0
                        }}>
                            <Calendar size={20} color="#06b6d4" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                                {t('settings.weekStartDay')}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.3 }}>
                                {t('settings.weekStartDayDesc')}
                            </div>
                        </div>
                    </div>

                    <SegmentedControl
                        value={settings.weekStartDay}
                        onChange={(val) => {
                            haptics.light();
                            onSave({ ...settings, weekStartDay: val });
                        }}
                        variant="pills"
                        fullWidth
                        options={[
                            { id: 'sunday', label: t('settings.sunday'), activeColor: '#f59e0b' },
                            { id: 'monday', label: t('settings.monday'), activeColor: '#06b6d4' }
                        ]}
                    />
                </Stack>
            </Stack>
        </Card>
    );
}

/** App language selector. */
export function LanguageSection() {
    const { t, i18n } = useTranslation();

    return (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <SectionTitle>{t('settings.language')}</SectionTitle>
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
                        haptics.light();
                        i18n.changeLanguage(e.target.value);
                        localStorage.setItem('oneup_language', e.target.value);
                    }}
                    className="input-field input-field--select hover-lift"
                    style={{
                        width: 'fit-content',
                        height: '34px',
                        padding: '4px 28px 4px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-default)',
                        background: 'var(--surface-muted)',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'all 0.2s ease'
                    }}
                >
                    {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>
                            {lang.label}
                        </option>
                    ))}
                </select>
            </SettingRow>
        </Card>
    );
}

/** Graphics/performance mode selector. */
export function PerformanceSection({ settings, onSave }) {
    const { t } = useTranslation();

    return (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <SectionTitle>{t('settings.performance')}</SectionTitle>

            <SettingRow
                icon={Gauge}
                title={t('settings.graphicsMode')}
                description={
                    settings.performanceMode === 'low'
                        ? t('settings.reducedEffects')
                        : t('settings.allEffects')
                }
                color="var(--success)"
                isLast={true}
            >
                <SegmentedControl
                    value={settings.performanceMode}
                    onChange={(val) => {
                        haptics.light();
                        onSave({ ...settings, performanceMode: val });
                    }}
                    variant="pills"
                    options={[
                        { id: 'low', label: t('settings.eco'), activeColor: 'var(--warning)' },
                        { id: 'high', label: t('common.max'), activeColor: 'var(--accent-glow)' }
                    ]}
                />
            </SettingRow>
        </Card>
    );
}

/** Leaderboard opt-in and pseudo. */
export function CommunitySection({ settings, onSave, cloudAuth }) {
    const { t } = useTranslation();

    return (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <SectionTitle>{t('settings.community')}</SectionTitle>

            <Stack gap="xs">
                <SettingRow
                    icon={Users}
                    title={t('leaderboard.title')}
                    description={t('settings.leaderboardDesc')}
                    color="var(--color-amber)"
                    isLast={!settings.leaderboardEnabled}
                >
                    <ToggleSwitch
                        enabled={settings.leaderboardEnabled}
                        onClick={() => onSave({ ...settings, leaderboardEnabled: !settings.leaderboardEnabled })}
                        activeGradient="linear-gradient(135deg, var(--color-amber), #d97706)"
                    />
                </SettingRow>

                {settings.leaderboardEnabled && (
                    <div className="scale-in" style={{ paddingTop: '4px' }}>
                        <Input
                            label={t('settings.displayName')}
                            value={settings.leaderboardPseudo || ''}
                            onChange={(e) => onSave({ ...settings, leaderboardPseudo: e.target.value.slice(0, 20) })}
                            placeholder={cloudAuth?.user?.displayName || t('common.yourPseudo')}
                            maxLength={20}
                            helperText={t('settings.maxChars')}
                        />
                    </div>
                )}
            </Stack>
        </Card>
    );
}

/** App theme picker — Pro feature with a lock overlay opening the store. */
export function ThemeSection({ settings, updateSettings, isPro, onOpenStore }) {
    const { t } = useTranslation();

    const currentTheme = settings.appTheme || 'dark';

    return (
        <Card style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <SectionTitle style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{t('settings.appTheme')}</span>
                {!isPro && <Lock size={14} color="var(--accent)" style={{ opacity: 0.8 }} />}
            </SectionTitle>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', opacity: isPro ? 1 : 0.6, pointerEvents: isPro ? 'auto' : 'none' }}>
                {THEMES.map(theme => (
                    <ThemeSwatch
                        key={theme.key}
                        theme={theme}
                        isSelected={currentTheme === theme.key}
                        onClick={() => updateSettings(prev => ({ ...prev, appTheme: theme.key }))}
                        title={t(`share.theme.${theme.key}`)}
                    />
                ))}
            </div>
            {!isPro && (
                <div
                    onClick={onOpenStore}
                    style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)',
                        cursor: 'pointer', zIndex: 2
                    }}
                >
                    <div style={{
                        background: 'var(--surface-elevated)', color: 'var(--text-primary)',
                        padding: '8px 16px', borderRadius: 'var(--radius-full)',
                        fontSize: '0.85rem', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        border: '1px solid var(--border-default)',
                        boxShadow: 'var(--shadow-md)',
                        marginTop: '24px'
                    }}>
                        <Lock size={14} color="var(--accent)" /> PRO
                    </div>
                </div>
            )}
        </Card>
    );
}

/**
 * Export / import the full local data store as a JSON backup file.
 */
export function DataSection() {
    const { t } = useTranslation();
    const fileInputRef = useRef(null);
    const [status, setStatus] = useState(null);

    if (isNativePlatform()) return null;

    const handleExport = () => {
        try {
            const count = downloadBackup();
            setStatus({ type: 'success', msg: t('settings.exportSuccess', { count }) });
        } catch {
            setStatus({ type: 'error', msg: t('settings.importError') });
        }
    };

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
            const parsed = parseBackup(await readFileText(file));
            const count = Object.keys(parsed.data).length;
            if (!window.confirm(t('settings.importConfirm', { count }))) return;
            restoreBackup(parsed);
            window.location.reload();
        } catch {
            setStatus({ type: 'error', msg: t('settings.importError') });
        }
    };

    return (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <SectionTitle>{t('settings.dataTitle')}</SectionTitle>

            <Stack gap="xs">
                <SettingRow
                    icon={Download}
                    title={t('settings.exportData')}
                    description={t('settings.exportDataDesc')}
                    color="var(--color-emerald)"
                >
                    <Button variant="secondary" size="sm" onClick={handleExport}>
                        {t('settings.exportButton')}
                    </Button>
                </SettingRow>

                <SettingRow
                    icon={Upload}
                    title={t('settings.importData')}
                    description={t('settings.importDataDesc')}
                    color="#60a5fa"
                    isLast
                >
                    <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                        {t('settings.importButton')}
                    </Button>
                </SettingRow>
            </Stack>

            <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFile}
                style={{ display: 'none' }}
            />

            {status && (
                <div style={{
                    marginTop: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: status.type === 'error' ? 'var(--error)' : 'var(--color-emerald)',
                }}>
                    {status.msg}
                </div>
            )}
        </Card>
    );
}



