import { useTranslation } from 'react-i18next';

export function ToggleSwitch({ enabled, onClick, activeGradient }) {
    const { t } = useTranslation();
    return (
        <button
            onClick={onClick}
            aria-label={enabled ? t('settings.disable') : t('settings.enable')}
            style={{
                width: '50px',
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
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                left: enabled ? 'calc(100% - 26px)' : '4px',
                transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
        </button>
    );
}
