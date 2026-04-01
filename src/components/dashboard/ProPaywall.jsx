import React from 'react';
import { Lock, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ProPaywall = ({ title, onOpenStore }) => {
    const { t } = useTranslation();
    
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', padding: '20px', textAlign: 'center', gap: '16px'
        }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>
                {title}
            </div>
            <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(139,92,246,0.3)', marginBottom: '8px'
            }}>
                <Lock size={28} color="#8b5cf6" />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                {t('paywall.proRequired')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: 0, maxWidth: '280px' }}>
                {t('paywall.proRequiredDesc')}
            </p>
            <button onClick={onOpenStore} className="hover-lift" style={{
                marginTop: '8px', padding: '12px 24px', borderRadius: '24px',
                background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                fontWeight: '800', border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', display: 'flex', gap: '8px', alignItems: 'center'
            }}>
                <ShoppingBag size={18} /> {t('paywall.viewStore')}
            </button>
        </div>
    );
};
