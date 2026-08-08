import React, { useState } from 'react';
import { UserPlus, Link, Check } from '@utils/icons';
import { Card, Button } from '@components/ui';
import { useTranslation } from 'react-i18next';

export function ClanInviteCard({ clanData }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);

    const handleCopyCode = () => {
        if (!clanData?.code) return;
        navigator.clipboard.writeText(clanData.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!clanData) return null;

    return (
        <div style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
            <Card variant="tinted" tint="rgb(245,158,11)" padding="sm" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <UserPlus size={14} /> {t('leaderboard.inviteCode')}
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '2px', color: 'var(--color-amber)' }}>
                        {clanData.code}
                    </div>
                </div>
                <Button 
                    variant="ghost"
                    onClick={handleCopyCode}
                    icon={copied ? Check : Link}
                    style={{
                        padding: '10px 16px', borderRadius: 'var(--radius-md)',
                        background: copied ? 'var(--success)' : 'rgba(255,255,255,0.1)',
                        border: copied ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        color: 'white', fontSize: '0.85rem', fontWeight: '600'
                    }}
                >
                    {copied ? t('leaderboard.copied') : t('leaderboard.copy')}
                </Button>
            </Card>
        </div>
    );
}
