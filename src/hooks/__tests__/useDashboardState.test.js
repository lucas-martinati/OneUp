import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

let mockNow = '2026-06-21';
vi.mock('@utils/dateUtils', () => ({ getLocalDateStr: () => mockNow }));

const getDayNumber = vi.fn((d) => (d === '2026-06-21' ? 1 : 2));
const isDayDone = vi.fn(() => false);
vi.mock('@store/useProgressStore', () => ({
  useProgressStore: (s) => s({ getDayNumber, isDayDone }),
}));
vi.mock('@store/useSettingsStore', () => ({
  useSettingsStore: (s) => s({ settings: { foo: 'bar' } }),
}));
const scheduleNotification = vi.fn();
vi.mock('../useNotificationManager', () => ({
  useNotificationManager: () => ({ scheduleNotification }),
}));

import { useDashboardState } from '../useDashboardState';

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockNow = '2026-06-21';
});
afterEach(() => vi.useRealTimers());

describe('useDashboardState', () => {
  it('initializes with today and no confetti', () => {
    const { result } = renderHook(() => useDashboardState());
    expect(result.current.today).toBe('2026-06-21');
    expect(result.current.showDayConfetti).toBe(false);
  });

  it('transitions to the next day and triggers confetti when the day advances', () => {
    const { result } = renderHook(() => useDashboardState());
    mockNow = '2026-06-22';
    act(() => { vi.advanceTimersByTime(10000); });
    expect(result.current.today).toBe('2026-06-22');
    expect(result.current.showDayConfetti).toBe(true);
    expect(result.current.isCounterTransitioning).toBe(true);
    expect(scheduleNotification).toHaveBeenCalledWith({ foo: 'bar' });
    act(() => { vi.advanceTimersByTime(800); });
    expect(result.current.isCounterTransitioning).toBe(false);
  });

  it('exposes a setter to dismiss the confetti', () => {
    const { result } = renderHook(() => useDashboardState());
    act(() => result.current.setShowDayConfetti(true));
    expect(result.current.showDayConfetti).toBe(true);
  });
});
