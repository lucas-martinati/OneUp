import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  CATEGORY_ORDER,
  CATEGORY_COLORS,
  buildFullCategoryOrder,
  buildFullCategoryColors,
  isUserCategory,
} from '../categories';

describe('CATEGORY_ORDER', () => {
  it('contains every built-in category exactly once', () => {
    expect([...CATEGORY_ORDER].sort()).toEqual(Object.values(CATEGORIES).sort());
    expect(new Set(CATEGORY_ORDER).size).toBe(CATEGORY_ORDER.length);
  });

  it('every built-in category has a color', () => {
    for (const cat of CATEGORY_ORDER) {
      expect(CATEGORY_COLORS[cat], cat).toMatch(/^#/);
    }
  });
});

describe('buildFullCategoryOrder', () => {
  it('returns the built-in order when no custom categories', () => {
    expect(buildFullCategoryOrder()).toEqual(CATEGORY_ORDER);
    expect(buildFullCategoryOrder([])).toEqual(CATEGORY_ORDER);
  });

  it('appends user categories after the built-ins', () => {
    const order = buildFullCategoryOrder([{ id: 'cat_1' }, { id: 'cat_2' }]);
    expect(order).toEqual([...CATEGORY_ORDER, 'cat_1', 'cat_2']);
  });

  it('filters out a renamed built-in "custom" category to avoid duplicates', () => {
    const order = buildFullCategoryOrder([{ id: 'custom', name: 'Renommé' }, { id: 'cat_1' }]);
    expect(order.filter(id => id === 'custom').length).toBe(1);
    expect(order).toContain('cat_1');
  });

  it('does not mutate CATEGORY_ORDER', () => {
    const before = [...CATEGORY_ORDER];
    buildFullCategoryOrder([{ id: 'cat_x' }]);
    expect(CATEGORY_ORDER).toEqual(before);
  });
});

describe('buildFullCategoryColors', () => {
  it('includes built-in colors', () => {
    expect(buildFullCategoryColors()).toEqual(CATEGORY_COLORS);
  });

  it('adds user category colors', () => {
    const colors = buildFullCategoryColors([{ id: 'cat_1', color: '#123456' }]);
    expect(colors.cat_1).toBe('#123456');
    expect(colors[CATEGORIES.BODYWEIGHT]).toBe(CATEGORY_COLORS[CATEGORIES.BODYWEIGHT]);
  });

  it('lets a custom category override the built-in custom color', () => {
    const colors = buildFullCategoryColors([{ id: 'custom', color: '#000001' }]);
    expect(colors.custom).toBe('#000001');
  });

  it('does not mutate CATEGORY_COLORS', () => {
    const before = { ...CATEGORY_COLORS };
    buildFullCategoryColors([{ id: 'custom', color: '#zzz' }]);
    expect(CATEGORY_COLORS).toEqual(before);
  });
});

describe('isUserCategory', () => {
  it('recognizes cat_ prefixed ids', () => {
    expect(isUserCategory('cat_abc')).toBe(true);
    expect(isUserCategory('cat_')).toBe(true);
  });

  it('rejects built-in categories and bad inputs', () => {
    expect(isUserCategory('custom')).toBe(false);
    expect(isUserCategory('bodyweight')).toBe(false);
    expect(isUserCategory('')).toBe(false);
    expect(isUserCategory(null)).toBe(false);
    expect(isUserCategory(undefined)).toBe(false);
    expect(isUserCategory(42)).toBe(false);
  });
});
