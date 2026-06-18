import { useTranslation } from 'react-i18next';
import { Bell, Volume2, Clock, Users, Lock, Gauge, Globe, Smartphone } from '../../utils/icons';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { SettingRow } from '../ui/SettingRow';
import { ThemeSwatch } from '../ui';
import { LANGUAGES } from '../../config/languages';
import { THEMES } from '../../config/themes';
import { sectionTitleStyle } from './settingsStyles';

const sectionCardStyle = {
    padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
    marginBottom: 'var(--spacing-md)',
    background: 'var(--surface-section)'
};

/** Notifications (+ time picker), sounds and keep-screen-on toggles. */
export function PreferencesSection({ settings, onSave }) {
    const { t } = useTranslation();

    const timeSelectStyle = {
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
    };

    return (
        <div className="glass-premium" style={sectionCardStyle}>
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
                    onClick={() => onSave({ ...settings, notificationsEnabled: !settings.notificationsEnabled })}
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
                            onChange={(e) => onSave({
                                ...settings,
                                notificationTime: { ...settings.notificationTime, hour: parseInt(e.target.value) }
                            })}
                            style={timeSelectStyle}
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
                            onChange={(e) => onSave({
                                ...settings,
                                notificationTime: { ...settings.notificationTime, minute: parseInt(e.target.value) }
                            })}
                            style={timeSelectStyle}
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
                    onClick={() => onSave({ ...settings, soundsEnabled: !settings.soundsEnabled })}
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
                    onClick={() => onSave({ ...settings, keepScreenOn: !settings.keepScreenOn })}
                    activeGradient="linear-gradient(135deg, #f59e0b, #d97706)"
                />
            </SettingRow>
        </div>
    );
}

/** App language selector. */
export function LanguageSection() {
    const { t, i18n } = useTranslation();

    return (
        <div className="glass-premium" style={sectionCardStyle}>
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
                    {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code} style={{ background: '#0a0a0f', color: '#ffffff' }}>
                            {lang.label}
                        </option>
                    ))}
                </select>
            </SettingRow>
        </div>
    );
}

/** Graphics/performance mode selector. */
export function PerformanceSection({ settings, onSave }) {
    const { t } = useTranslation();

    return (
        <div className="glass-premium" style={sectionCardStyle}>
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
                            onClick={() => onSave({ ...settings, performanceMode: opt.value })}
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
    );
}

/** Leaderboard opt-in and pseudo. */
export function CommunitySection({ settings, onSave, cloudAuth }) {
    const { t } = useTranslation();

    return (
        <div className="glass-premium" style={sectionCardStyle}>
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
                    onClick={() => onSave({ ...settings, leaderboardEnabled: !settings.leaderboardEnabled })}
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
                        onChange={(e) => onSave({ ...settings, leaderboardPseudo: e.target.value.slice(0, 20) })}
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
    );
}

/** App theme picker — Pro feature with a lock overlay opening the store. */
export function ThemeSection({ settings, updateSettings, isPro, onOpenStore }) {
    const { t } = useTranslation();

    const currentTheme = settings.appTheme || 'dark';

    return (
        <div className="glass-premium" style={{
            ...sectionCardStyle,
            position: 'relative',
            overflow: 'hidden'
        }}>
            <h3 style={sectionTitleStyle}>
                {t('settings.appTheme')} {!isPro && <Lock size={14} color="var(--accent)" style={{ marginLeft: 'auto', opacity: 0.8 }} />}
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px', opacity: isPro ? 1 : 0.6, pointerEvents: isPro ? 'auto' : 'none' }}>
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
    );
}
