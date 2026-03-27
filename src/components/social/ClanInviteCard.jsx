import React, { useState } from 'react';
import { UserPlus, Link, Check } from 'lucide-react';
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
        <div style={{ padding: 'var(--spacing-md) var(--spacing-md) 0' }}>
            <div style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.1))',
                border: '1px solid rgba(245,158,11,0.2)',
                borderRadius: 'var(--radius-lg)', padding: '16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <UserPlus size={14} /> {t('leaderboard.inviteCode')}
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '2px', color: '#fbbf24' }}>
                        {clanData.code}
                    </div>
                </div>
                <button onClick={handleCopyCode} className="hover-lift" style={{
                    padding: '10px 16px', borderRadius: 'var(--radius-md)',
                    background: copied ? '#10b981' : 'rgba(255,255,255,0.1)',
                    border: copied ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    color: 'white', fontSize: '0.85rem', fontWeight: '600',
                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                }}>
                    {copied ? <><Check size={16} /> {t('leaderboard.copied')}</> : <><Link size={16} /> {t('leaderboard.copy')}</>}
                </button>
            </div>
        </div>
    );
}
