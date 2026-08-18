import React from 'react';
import { Lock, ShoppingBag } from '@utils/icons';
import { useTranslation } from 'react-i18next';
import { Stack, Button } from '@components/ui';

export const ProPaywall = ({ title, onOpenStore }) => {
    const { t } = useTranslation();

    return (
        <Stack align="center" justify="center" style={{ height: '100%', paddingTop: 'var(--day-pod-space)', paddingBottom: 'var(--space-5)', paddingInline: 'var(--space-5)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>
                {title}
            </div>
            <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(139,92,246,0.3)'
            }}>
                <Lock size={28} color="var(--accent-glow)" />
            </div>
            <h2 className="panel-title" style={{ margin: 0 }}>
                {t('paywall.proRequired')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: 0, maxWidth: '280px' }}>
                {t('paywall.proRequiredDesc')}
            </p>
            <Button
                variant="premium"
                icon={ShoppingBag}
                onClick={onOpenStore}
                
            >
                {t('paywall.viewStore')}
            </Button>
        </Stack>
    );
};
