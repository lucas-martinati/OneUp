import { describe, it, expect } from 'vitest';
import ICON_MAP from '../iconMap';

describe('ICON_MAP', () => {
  it('contains all exercise icon names', () => {
    const expected = ['Dumbbell', 'ArrowDownUp', 'ArrowUp', 'Zap', 'ChevronsUp', 'Footprints', 'Flame', 'Square', 'MoveDown', 'MoveDiagonal'];
    for (const name of expected) {
      expect(ICON_MAP[name], `Missing icon: ${name}`).toBeDefined();
    }
  });

  it('all values are truthy (valid React components)', () => {
    for (const [name, comp] of Object.entries(ICON_MAP)) {
      expect(comp, `ICON_MAP.${name} is falsy`).toBeTruthy();
    }
  });

  it('has exactly 10 entries', () => {
    expect(Object.keys(ICON_MAP)).toHaveLength(10);
  });

  it('Square maps to Activity (not the lucide Square)', () => {
    expect(ICON_MAP.Square).toBeDefined();
    expect(ICON_MAP.Square).not.toBe(ICON_MAP.Dumbbell);
  });
});
