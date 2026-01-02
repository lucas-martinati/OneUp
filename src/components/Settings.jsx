import { useState, useEffect } from 'react';
import { X, Bell, Volume2, Clock, Check } from 'lucide-react';
import { CloudSyncPanel } from './CloudSyncPanel';

export function Settings({ settings, onClose, onSave, cloudAuth, cloudSync, conflictData, onResolveConflict }) {
    const [showSaved, setShowSaved] = useState(false);

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

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 'var(--spacing-md)',
                animation: 'fadeIn 0.3s ease'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="glass-premium slide-up"
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    borderRadius: 'var(--radius-xl)',
                    padding: 0,
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: 'var(--spacing-lg)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        margin: 0,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Settings
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
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: 'white',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                            }}>
                                <Check size={16} />
                                Saved
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="hover-lift"
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Settings Content */}
                <div style={{
                    padding: 'var(--spacing-lg)',
                    overflowY: 'auto',
                    overscrollBehavior: 'contain'
                }}>
                    {/* Notifications Toggle */}
                    <div className="glass" style={{
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--spacing-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(109, 40, 217, 0.2))',
                                padding: '10px',
                                borderRadius: '12px'
                            }}>
                                <Bell size={20} color="#8b5cf6" />
                            </div>
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '1rem' }}>Daily Notifications</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Remind me to do pushups
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleToggleNotifications}
                            style={{
                                width: '56px',
                                height: '32px',
                                borderRadius: '16px',
                                background: settings.notificationsEnabled
                                    ? 'linear-gradient(135deg, #10b981, #059669)'
                                    : 'rgba(255,255,255,0.1)',
                                border: 'none',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'all 0.3s ease',
                                boxShadow: settings.notificationsEnabled
                                    ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                                    : 'none'
                            }}
                        >
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: 'white',
                                position: 'absolute',
                                top: '4px',
                                left: settings.notificationsEnabled ? '28px' : '4px',
                                transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }} />
                        </button>
                    </div>

                    {/* Notification Time Picker */}
                    {settings.notificationsEnabled && (
                        <div className="glass scale-in" style={{
                            padding: 'var(--spacing-md)',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: 'var(--spacing-md)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: 'var(--spacing-sm)'
                            }}>
                                <Clock size={18} color="#8b5cf6" />
                                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Notification Time</div>
                            </div>
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: 'var(--spacing-md)'
                            }}>
                                {/* Hour Picker */}
                                <select
                                    value={settings.notificationTime.hour}
                                    onChange={(e) => handleHourChange(e.target.value)}
                                    className="glass"
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--text-primary)',
                                        fontSize: '1.1rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        minWidth: '80px',
                                        textAlign: 'center'
                                    }}
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i} style={{ background: '#1a1a2e', color: 'white' }}>
                                            {String(i).padStart(2, '0')}
                                        </option>
                                    ))}
                                </select>
                                <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-secondary)' }}>:</span>
                                {/* Minute Picker */}
                                <select
                                    value={settings.notificationTime.minute}
                                    onChange={(e) => handleMinuteChange(e.target.value)}
                                    className="glass"
                                    style={{
                                        padding: '12px 16px',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--text-primary)',
                                        fontSize: '1.1rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        minWidth: '80px',
                                        textAlign: 'center'
                                    }}
                                >
                                    {[0, 15, 30, 45].map(minute => (
                                        <option key={minute} value={minute} style={{ background: '#1a1a2e', color: 'white' }}>
                                            {String(minute).padStart(2, '0')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Sound Effects Toggle */}
                    <div className="glass" style={{
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--spacing-md)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(6, 182, 212, 0.2))',
                                padding: '10px',
                                borderRadius: '12px'
                            }}>
                                <Volume2 size={20} color="#0ea5e9" />
                            </div>
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '1rem' }}>Sound Effects</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Play sounds for actions
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleToggleSounds}
                            style={{
                                width: '56px',
                                height: '32px',
                                borderRadius: '16px',
                                background: settings.soundsEnabled
                                    ? 'linear-gradient(135deg, #0ea5e9, #06b6d4)'
                                    : 'rgba(255,255,255,0.1)',
                                border: 'none',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'all 0.3s ease',
                                boxShadow: settings.soundsEnabled
                                    ? '0 4px 12px rgba(14, 165, 233, 0.4)'
                                    : 'none'
                            }}
                        >
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: 'white',
                                position: 'absolute',
                                top: '4px',
                                left: settings.soundsEnabled ? '28px' : '4px',
                                transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }} />
                        </button>
                    </div>

                    {cloudAuth && cloudSync && (
                        <CloudSyncPanel
                            authState={cloudAuth}
                            onSignIn={() => cloudSync.signIn()}
                            onSignOut={() => cloudSync.signOut()}
                            conflictData={conflictData}
                            onResolveConflict={onResolveConflict}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
