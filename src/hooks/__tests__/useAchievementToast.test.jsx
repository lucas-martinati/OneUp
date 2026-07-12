import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, render, cleanup } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k, d) => d || k }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));
vi.mock('./useToastGestures', () => ({
  useToastGestures: () => ({ exit: false, cardProps: { style: {}, onPointerDown: vi.fn() } }),
}));
vi.mock('@config/badgeDefinitions', () => ({
  BADGE_DEFINITIONS: [{ id: 'first_blood', color: '#f00' }],
  BADGE_ICONS: { Star: () => null },
  getBadgeIconFromDef: () => (() => null),
  getBadgeById: (id) => id === 'first_blood' ? { id: 'first_blood', color: '#f00' } : undefined,
}));
vi.mock('@components/feedback/toastRoot', () => ({
  getToastRoot: () => {
    let n = document.getElementById('test-toast-root');
    if (!n) { n = document.createElement('div'); n.id = 'test-toast-root'; document.body.appendChild(n); }
    return n;
  },
}));

import { useAchievementToast } from '../useAchievementToast';

beforeEach(() => { document.body.innerHTML = ''; });
afterEach(() => cleanup());

describe('useAchievementToast', () => {
  it('shows a known badge and validates it', () => {
    const onValidate = vi.fn();
    const { result } = renderHook(() => useAchievementToast(vi.fn(), onValidate));
    act(() => result.current.showAchievement('first_blood'));
    expect(result.current.AchievementToast).not.toBeNull();
    expect(onValidate).toHaveBeenCalledWith('first_blood');
  });

  it('warns and shows nothing for an unknown badge', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useAchievementToast());
    act(() => result.current.showAchievement('nope'));
    expect(warn).toHaveBeenCalled();
    expect(result.current.AchievementToast).toBeNull();
    warn.mockRestore();
  });

  it('bumps the count when multiple unlocks arrive while one is showing', () => {
    const { result } = renderHook(() => useAchievementToast());
    act(() => result.current.showAchievement('first_blood'));
    act(() => result.current.showAchievement('first_blood'));
    // second push increments count → toast key advances
    expect(result.current.AchievementToast.props.count).toBe(2);
  });

  it('hides the toast', () => {
    const { result } = renderHook(() => useAchievementToast());
    act(() => result.current.showAchievement('first_blood'));
    act(() => result.current.hideAchievement());
    expect(result.current.AchievementToast).toBeNull();
  });

  it('responds to global show-achievement and custom events', () => {
    const { result } = renderHook(() => useAchievementToast());
    act(() => { window.dispatchEvent(new CustomEvent('show-achievement', { detail: { badgeId: 'first_blood' } })); });
    expect(result.current.AchievementToast).not.toBeNull();
    act(() => result.current.hideAchievement());
    act(() => { window.dispatchEvent(new CustomEvent('show-achievement-custom', { detail: { title: 'Hello', color: '#0f0' } })); });
    expect(result.current.AchievementToast).not.toBeNull();
  });

  it('ignores malformed global events', () => {
    const { result } = renderHook(() => useAchievementToast());
    act(() => { window.dispatchEvent(new CustomEvent('show-achievement', { detail: {} })); });
    act(() => { window.dispatchEvent(new CustomEvent('show-achievement-custom', { detail: {} })); });
    expect(result.current.AchievementToast).toBeNull();
  });

  it('renders the notification portal and fires onView on tap', () => {
    const onView = vi.fn();
    const { result } = renderHook(() => useAchievementToast(onView));
    act(() => result.current.showAchievement('first_blood'));
    render(result.current.AchievementToast);
    act(() => result.current.handleView?.());
    // handleView is internal; trigger view path via onView through the toast's onView prop
    act(() => result.current.AchievementToast.props.onView());
    expect(onView).toHaveBeenCalled();
  });
});
