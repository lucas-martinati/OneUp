import { useState } from 'react';
import { X, Bell, Volume2, Clock, Check, Users, Settings as SettingsIcon, Lock, Unlock, Gauge } from 'lucide-react';
import { CloudSyncPanel } from './CloudSyncPanel';

export function Settings({ settings, onClose, onSave, cloudAuth, cloudSync, conflictData, onResolveConflict }) {
    const [showSaved, setShowSaved] = useState(false);
    const [isMultiplierUnlocked, setIsMultiplierUnlocked] = useState(false);

    const handleToggleNotifications = () => {
        const newSettings = { ...settings, notificationsEnabled: !settings.notificationsEnabled };
        onSave(newSettings);
        showSavedIndicator();
    };

    const handleToggleSounds = () => {
        const newSettings = { ...settings, soundsEnabled: !settings.soundsEnabled };
        onSave(newSettings);
        showSavedIndicator();
    };

    const handleHourChange = (hour) => {
        const newSettings = {
            ...settings,
            notificationTime: { ...settings.notificationTime, hour: parseInt(hour) }
        };
        onSave(newSettings);
        showSavedIndicator();
    };

    const handleMinuteChange = (minute) => {
        const newSettings = {
            ...settings,
            notificationTime: { ...settings.notificationTime, minute: parseInt(minute) }
        };
        onSave(newSettings);
        showSavedIndicator();
    };

    const showSavedIndicator = () => {
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 1500);
    };

    // Composant local pour simplifier les toggles
    const ToggleSwitch = ({ enabled, onClick, activeGradient }) => (
        <button
            onClick={onClick}
            style={{
                width: '52px',
                height: '28px',
                borderRadius: '14px',
                background: enabled ? activeGradient : 'var(--surface-hover)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: enabled ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                padding: '0 4px'
            }}
        >
            <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                left: enabled ? 'calc(100% - 24px)' : '4px',
                transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
        </button>
    );

    // Composant local pour les lignes de paramètres
    const SettingRow = ({ icon: Icon, title, description, color, children, isLast }) => (
        <div style={{
            padding: '12px 0',
            borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                    background: `linear-gradient(135deg, ${color}20, ${color}08)`,
                    padding: '10px',
                    borderRadius: '12px',
                    border: `1px solid ${color}30`
                }}>
                    <Icon size={20} color={color} />
                </div>
                <div>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>{title}</div>
                    {description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {description}
                        </div>
                    )}
                </div>
            </div>
            {children}
        </div>
    );

    const sectionTitleStyle = {
        marginBottom: 'var(--spacing-md)', fontSize: '0.85rem', fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: '1px',
        color: 'var(--text-secondary)'
    };

    return (
        <div className="fade-in" style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'var(--overlay-bg)', backdropFilter: 'blur(16px)', zIndex: 110,
            display: 'flex', flexDirection: 'column', padding: 'var(--spacing-md)',
            paddingTop: 'calc(var(--spacing-md) + env(safe-area-inset-top))',
            paddingBottom: 'calc(var(--spacing-md) + env(safe-area-inset-bottom))',
            overflowY: 'auto'
        }}>
            {/* ── Header ──────────────────────────────────────────────── */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 'var(--spacing-md)'
            }}>
                <h2 className="rainbow-gradient" style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>
                    Paramètres
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                            Sauvegardé
                        </div>
                    )}
                    <button onClick={onClose} className="hover-lift glass" style={{
                        background: 'var(--surface-hover)', border: 'none', borderRadius: '50%',
                        width: '40px', height: '40px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer'
                    }}>
                        <X size={22} />
                    </button>
                </div>
            </div>

            {/* ── Settings Content ────────────────────────────────────── */}

            {/* ── Préférences ─────────────────────────────────────────── */}
            <div className="glass-premium" style={{
                padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                marginBottom: 'var(--spacing-md)',
                background: 'var(--surface-section)'
            }}>
                <h3 style={sectionTitleStyle}>Préférences</h3>

                <SettingRow
                    icon={Bell}
                    title="Notifications"
                    description="Rappel d'entraînement"
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
                            <div style={{ fontWeight: '600', fontSize: '0.8rem' }}>HEURE DU RAPPEL</div>
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
                    title="Effets sonores"
                    description="Sons lors des actions"
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

            {/* ── Performance ──────────────────────────────────────────── */}
            <div className="glass-premium" style={{
                padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
                marginBottom: 'var(--spacing-md)',
                background: 'var(--surface-section)'
            }}>
                <h3 style={sectionTitleStyle}>Performance</h3>

                <SettingRow
                    icon={Gauge}
                    title="Mode graphique"
                    description={
                        settings.performanceMode === 'low'
                            ? 'Effets visuels réduits'
                            : 'Tous les effets activés'
                    }
                    color="#10b981"
                    isLast={true}
                >
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {[
                            { value: 'low', label: 'Éco', color: '#f59e0b' },
                            { value: 'high', label: 'Max', color: '#8b5cf6' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    const newSettings = { ...settings, performanceMode: opt.value };
                                    onSave(newSettings);
                                    showSavedIndicator();
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
                                    transition: 'all 0.2s ease'
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
                <h3 style={sectionTitleStyle}>Communauté</h3>

                <SettingRow
                    icon={Users}
                    title="Classement"
                    description="Apparaître dans le classement public"
                    color="#fbbf24"
                    isLast={!settings.leaderboardEnabled}
                >
                    <ToggleSwitch
                        enabled={settings.leaderboardEnabled}
                        onClick={() => {
                            const newSettings = { ...settings, leaderboardEnabled: !settings.leaderboardEnabled };
                            onSave(newSettings);
                            showSavedIndicator();
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
                            Pseudo affiché
                        </label>
                        <input
                            type="text"
                            value={settings.leaderboardPseudo || ''}
                            onChange={(e) => {
                                const newSettings = { ...settings, leaderboardPseudo: e.target.value.slice(0, 20) };
                                onSave(newSettings);
                            }}
                            onBlur={() => showSavedIndicator()}
                            placeholder={cloudAuth?.user?.displayName || 'Ton pseudo...'}
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
                            Max 20 caractères · Ta photo Google sera utilisée
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
                    <h3 style={sectionTitleStyle}>Données & Cloud</h3>
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
                <h3 style={{ ...sectionTitleStyle, color: isMultiplierUnlocked ? '#ef4444' : 'var(--text-secondary)' }}>Difficulté</h3>

                <div style={{ marginBottom: '16px' }}>
                    <div style={{
                        background: isMultiplierUnlocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.05)',
                        border: `1px solid ${isMultiplierUnlocked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.1)'}`,
                        padding: '14px', borderRadius: 'var(--radius-md)', color: '#fca5a5',
                        fontSize: '0.85rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px',
                        transition: 'all 0.3s ease'
                    }}>
                        <p style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
                            <Lock size={14} /> PARAMÈTRE SENSIBLE
                        </p>
                        <p style={{ margin: 0, opacity: 0.9 }}>Modifier ceci changera vos objectifs de répétitions quotidiens. Un réglage à 0.5 divise vos objectifs par deux.</p>
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
                        DÉBLOQUER LES PARAMÈTRES <Lock size={18} />
                    </button>
                ) : (
                    <div className="scale-in">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: '700', color: 'white', fontSize: '0.9rem' }}>Multiplicateur (Max 1.0)</span>
                                <button
                                    onClick={() => setIsMultiplierUnlocked(false)}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px',
                                        padding: '4px 10px', color: 'white', fontSize: '0.7rem', fontWeight: '700',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                    }}
                                >
                                    Bloquer <Unlock size={12} />
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
        </div>
    );
}
