export function SettingRow({ icon: IconComponent, title, description, color = 'var(--accent-glow)', children, isLast }) {
    return (
        <div className={`setting-row${isLast ? ' setting-row--last' : ''}`}>
            <div className="flex-align-center gap-12" style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    /* color-mix (pas de concat alpha) : accepte hex ET var(--token) */
                    background: `linear-gradient(135deg, color-mix(in srgb, ${color} 13%, transparent), color-mix(in srgb, ${color} 3%, transparent))`,
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid color-mix(in srgb, ${color} 19%, transparent)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <IconComponent size={20} color={color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>{title}</div>
                    {description && (
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {description}
                        </div>
                    )}
                </div>
            </div>
            {children}
        </div>
    );
}
