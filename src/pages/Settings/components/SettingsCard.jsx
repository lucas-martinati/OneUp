import { Card } from '@components/ui';
import styles from './SettingsCard.module.css';

/** Shared surface for every settings section, including account and level help. */
export function SettingsCard({ className = '', ...props }) {
    return <Card {...props} className={`${styles.card} ${className}`} />;
}
