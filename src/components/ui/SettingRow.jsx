export function SettingRow({ icon: Icon, title, description, color, children, isLast }) {
    return (
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
}
