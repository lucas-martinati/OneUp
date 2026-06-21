import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.resetModules();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('consoleAchievements', () => {
  it('registers window.__testAchievements with both helpers', async () => {
    await import('@utils/consoleAchievements');
    expect(typeof window.__testAchievements.showBadge).toBe('function');
    expect(typeof window.__testAchievements.showCustom).toBe('function');
  });

  it('dispatches a show-achievement event for showBadge', async () => {
    await import('@utils/consoleAchievements');
    const handler = vi.fn();
    window.addEventListener('show-achievement', handler);
    window.__testAchievements.showBadge('first_share');
    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0].detail).toEqual({ badgeId: 'first_share' });
    window.removeEventListener('show-achievement', handler);
  });

  it('dispatches a custom event with a default color', async () => {
    await import('@utils/consoleAchievements');
    const handler = vi.fn();
    window.addEventListener('show-achievement-custom', handler);
    window.__testAchievements.showCustom('Hello');
    expect(handler.mock.calls[0][0].detail).toEqual({ title: 'Hello', color: '#fbbf24' });
    window.__testAchievements.showCustom('Bye', '#000000');
    expect(handler.mock.calls[1][0].detail).toEqual({ title: 'Bye', color: '#000000' });
    window.removeEventListener('show-achievement-custom', handler);
  });
});
