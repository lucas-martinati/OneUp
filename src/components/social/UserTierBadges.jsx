import { useTranslation } from 'react-i18next';
import { getTierBadgeConfigs } from '@utils/entitlements';
import styles from './UserTierBadges.module.css';

/** Native disclosures keep membership explanations usable by touch and keyboard. */
export function UserTierBadges({ entry }) {
    const { t } = useTranslation();
    return getTierBadgeConfigs(entry).map(badge => {
        const Icon = badge.icon;
        const title = t(badge.key === 'pro' ? 'tierBadge.proTitle' : 'tierBadge.supporterTitle');
        const description = t(badge.key === 'pro' ? 'tierBadge.proDesc' : 'tierBadge.supporterDesc');
        return <details key={badge.key} className={styles.badge} style={{ '--badge-color': badge.color }}>
            <summary className={styles.trigger}><Icon size={14} />{title}</summary>
            <div className={styles.description}>{description}</div>
        </details>;
    });
}
