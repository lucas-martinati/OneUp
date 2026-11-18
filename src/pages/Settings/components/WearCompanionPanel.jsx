import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Watch } from '@utils/icons';
import { Button, Card, SectionTitle, SettingRow } from '@components/ui';
import { getWearBridge } from '@features/wear/useWearSync';
import { WEAR_MANUAL_SYNC_EVENT, WEAR_STATUS_EVENT } from '@features/wear/wearProtocol';

export function WearCompanionPanel() {
    const { t } = useTranslation();
    const [status, setStatus] = useState({ connected: false, nodes: [], pendingCount: 0 });
    const [syncing, setSyncing] = useState(false);

    const refreshStatus = useCallback(async () => {
        try {
            const { plugin } = await getWearBridge();
            if (!plugin?.getStatus) return;
            const next = await plugin.getStatus();
            if (next && typeof next === 'object') {
                setStatus({
                    connected: Boolean(next.connected),
                    nodes: Array.isArray(next.nodes) ? next.nodes : [],
                    pendingCount: Number(next.pendingCount) || 0,
                });
            }
        } catch {
            // Ignore when Play Services Wearable API is unavailable
        }
    }, []);

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const { plugin } = await getWearBridge();
                if (!active || !plugin?.getStatus) return;
                const next = await plugin.getStatus();
                if (active && next && typeof next === 'object') {
                    setStatus({
                        connected: Boolean(next.connected),
                        nodes: Array.isArray(next.nodes) ? next.nodes : [],
                        pendingCount: Number(next.pendingCount) || 0,
                    });
                }
            } catch {
                // Ignore when Play Services Wearable API is unavailable
            }
        };
        load();
        window.addEventListener(WEAR_STATUS_EVENT, refreshStatus);
        return () => {
            active = false;
            window.removeEventListener(WEAR_STATUS_EVENT, refreshStatus);
        };
    }, [refreshStatus]);

    const handleSyncNow = async () => {
        setSyncing(true);
        window.dispatchEvent(new CustomEvent(WEAR_MANUAL_SYNC_EVENT));
        await new Promise(resolve => setTimeout(resolve, 450));
        await refreshStatus();
        setSyncing(false);
    };

    const watchNames = status.nodes.map(node => node.name).filter(Boolean).join(', ');
    let title = t('wear.disconnected');
    if (status.connected) {
        title = t('wear.connected', { name: watchNames || 'Wear OS' });
    }
    const description = status.pendingCount > 0
        ? t('wear.pendingOps', { count: status.pendingCount })
        : t('wear.upToDate');

    return (
        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <SectionTitle>{t('wear.title')}</SectionTitle>
            <SettingRow
                icon={Watch}
                title={title}
                description={description}
                color={status.connected ? 'var(--success)' : 'var(--text-secondary)'}
                isLast
            >
                <Button
                    variant="secondary"
                    size="sm"
                    icon={RefreshCw}
                    loading={syncing}
                    haptic="light"
                    onClick={handleSyncNow}
                >
                    {t('wear.syncNow')}
                </Button>
            </SettingRow>
        </Card>
    );
}
