import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

import { CategoryNav } from '../CategoryNav';
import { CATEGORIES } from '@config/categories';

const ORDER = [CATEGORIES.BODYWEIGHT, CATEGORIES.WEIGHTS, CATEGORIES.CARDIO, CATEGORIES.CUSTOM, 'cat_custom1'];

function renderNav(props = {}) {
  const scrollTo = vi.fn();
  const scrollContainerRef = { current: { clientHeight: 500, scrollTo } };
  const utils = render(
    <CategoryNav
      fullCategoryOrder={ORDER}
      activeSlide={0}
      customCategories={[{ id: 'cat_custom1', name: 'My Cat' }]}
      scrollContainerRef={scrollContainerRef}
      anyModalOpen={props.anyModalOpen ?? false}
    />
  );
  return { ...utils, scrollTo };
}

beforeEach(() => {
  HTMLElement.prototype.setPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
  HTMLElement.prototype.getBoundingClientRect = vi.fn(() => ({ top: 0, height: 500, left: 0, width: 40 }));
});
afterEach(() => vi.restoreAllMocks());

describe('CategoryNav', () => {
  it('renders one dot per category with localized labels', () => {
    const { container, getByText } = renderNav();
    expect(container.querySelectorAll('.category-nav-dot')).toHaveLength(5);
    expect(getByText('My Cat')).toBeTruthy(); // custom category name resolved
  });

  it('scrolls to the tapped dot', () => {
    const { container, scrollTo } = renderNav();
    const dots = container.querySelectorAll('.category-nav-dot');
    fireEvent.click(dots[2]);
    expect(scrollTo).toHaveBeenCalledWith({ top: 500 * 2, behavior: 'smooth' });
  });

  it('expands on long-press and scrubs to a new index on pointer move', () => {
    vi.useFakeTimers();
    try {
      const { container, scrollTo } = renderNav();
      const nav = container.querySelector('.category-nav-container');
      // mouse → 0ms delay long-press
      fireEvent.pointerDown(nav, { clientY: 10, clientX: 5, pointerType: 'mouse', pointerId: 1 });
      act(() => vi.advanceTimersByTime(1));
      expect(nav.className).toContain('expanded');
      // move to ~80% down → last index → scrollTo
      fireEvent.pointerMove(nav, { clientY: 480, clientX: 5, pointerType: 'mouse', pointerId: 1 });
      expect(scrollTo).toHaveBeenCalled();
      fireEvent.pointerUp(nav, { clientY: 480, clientX: 5, pointerType: 'mouse', pointerId: 1 });
      expect(nav.className).not.toContain('expanded');
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels the long-press timer when the pointer moves too far before it fires', () => {
    vi.useFakeTimers();
    try {
      const { container } = renderNav();
      const nav = container.querySelector('.category-nav-container');
      fireEvent.pointerDown(nav, { clientY: 10, clientX: 5, pointerType: 'touch', pointerId: 1 });
      fireEvent.pointerMove(nav, { clientY: 60, clientX: 5, pointerType: 'touch', pointerId: 1 }); // dy > 30
      act(() => vi.advanceTimersByTime(300));
      expect(nav.className).not.toContain('expanded');
    } finally {
      vi.useRealTimers();
    }
  });

  it('aborts an active long-press on pointer cancel', () => {
    vi.useFakeTimers();
    try {
      const { container } = renderNav();
      const nav = container.querySelector('.category-nav-container');
      fireEvent.pointerDown(nav, { clientY: 10, clientX: 5, pointerType: 'mouse', pointerId: 1 });
      act(() => vi.advanceTimersByTime(1));
      expect(nav.className).toContain('expanded');
      fireEvent.pointerCancel(nav, { pointerId: 1 });
      expect(nav.className).not.toContain('expanded');
    } finally {
      vi.useRealTimers();
    }
  });

  it('disables pointer events while a modal is open', () => {
    const { container } = renderNav({ anyModalOpen: true });
    const nav = container.querySelector('.category-nav-container');
    expect(nav.style.pointerEvents).toBe('none');
  });
});
