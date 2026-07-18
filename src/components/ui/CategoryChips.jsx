import { Check, Lock } from '@utils/icons';
import { haptics } from '@utils/hapticsManager';
import styles from './CategoryChips.module.css';

/**
 * CategoryChips — the app-wide multi-select category filter: pill chips with
 * a hollow ring that fills with the category color (plus check) when selected.
 * Purely controlled: callers own the selection state and any "min 1 selected"
 * rule. Locked chips (pro gating) render a padlock and route taps to
 * onLockedClick instead of toggling.
 *
 * @param {Object} props
 * @param {Array} props.items - [{ id, label, color, locked }]
 * @param {string[]} props.selected - ids of the selected items
 * @param {(id: string) => void} props.onToggle - tap on an unlocked chip
 * @param {(id: string) => void} [props.onLockedClick] - tap on a locked chip (e.g. open the store)
 */
export function CategoryChips({ items, selected = [], onToggle, onLockedClick }) {
  return (
    <div className={styles.chips}>
      {items.map((item, index) => {
        const isSelected = selected.includes(item.id);
        const classNames = [
          styles.chip,
          isSelected && styles.chipOn,
          item.locked && styles.chipLocked,
        ].filter(Boolean).join(' ');
        return (
          <button
            key={item.id}
            aria-pressed={isSelected}
            aria-disabled={item.locked || undefined}
            onClick={() => {
              if (item.locked) {
                onLockedClick?.(item.id);
                return;
              }
              haptics.light();
              onToggle(item.id);
            }}
            className={classNames}
            style={{ '--c': item.color, '--i': index }}
          >
            <span className={styles.chipDot}>
              {item.locked
                ? <Lock size={10} strokeWidth={3.5} />
                : (isSelected && <Check size={10} strokeWidth={3.5} />)}
            </span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
