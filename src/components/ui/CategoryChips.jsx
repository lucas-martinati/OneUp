import { haptics } from '@utils/hapticsManager';
import { FilterChip } from './FilterChip';

/**
 * CategoryChips — the app-wide multi-select category filter using the unified FilterChip primitive.
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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {items.map((item) => {
        const isSelected = selected.includes(item.id);
        return (
          <FilterChip
            key={item.id}
            size="sm"
            color={item.color}
            selected={isSelected}
            locked={item.locked}
            onClick={() => {
              if (item.locked) {
                onLockedClick?.(item.id);
                return;
              }
              haptics.light();
              onToggle(item.id);
            }}
          >
            {item.label}
          </FilterChip>
        );
      })}
    </div>
  );
}
