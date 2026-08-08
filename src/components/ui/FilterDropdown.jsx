import { ChevronDown, Filter } from '@utils/icons';
import { haptics } from '@utils/hapticsManager';
import styles from '@styles/FilterDropdown.module.css';

/**
 * A reusable collapsible dropdown panel triggered by a pill-shaped button.
 * Originally used for category filtering, it supports a label, an icon, and an optional count badge.
 */
export function FilterDropdown({
    isOpen,
    onToggle,
    label,
    icon: Icon = Filter,
    count,
    style,
    children
}) {
    return (
        <div style={style}>
            <button
                onClick={() => {
                    haptics.light();
                    onToggle(!isOpen);
                }}
                className={isOpen ? `${styles.toggle} ${styles.toggleOpen}` : styles.toggle}
                aria-expanded={isOpen}
            >
                {Icon && <Icon size={16} />}
                {label}
                {count != null && (
                    <span key={count} className={styles.count}>
                        {count}
                    </span>
                )}
                <ChevronDown size={16} className={styles.chevron} />
            </button>
            {isOpen && (
                <div className={styles.panel}>
                    {children}
                </div>
            )}
        </div>
    );
}
