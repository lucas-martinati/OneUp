import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock useNotificationManager
const mockScheduleNotification = vi.fn();
const mockRequestNotificationPermission = vi.fn();

vi.mock('../useNotificationManager', () => ({
  useNotificationManager: () => ({
    scheduleNotification: mockScheduleNotification,
    requestNotificationPermission: mockRequestNotificationPermission,
  })
}));

// Mutable mock stores to control store values in tests
const mockProgressStore = {
  isSetup: true,
  completions: {},
  isDayDone: vi.fn(),
  getDayNumber: vi.fn(),
};

const mockSettingsStore = {
  settings: {
    notificationsEnabled: true,
    notificationTime: { hour: 8, minute: 0 }
  }
};

vi.mock('../../store/useProgressStore', () => ({
  useProgressStore: vi.fn((selector) => selector(mockProgressStore)),
}));

vi.mock('../../store/useSettingsStore', () => ({
  useSettingsStore: vi.fn((selector) => selector(mockSettingsStore)),
}));

import { useNotificationScheduling } from '../useNotificationScheduling';

describe('useNotificationScheduling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset defaults
    mockProgressStore.isSetup = true;
    mockSettingsStore.settings = {
      notificationsEnabled: true,
      notificationTime: { hour: 8, minute: 0 }
    };
  });

  it('requests permission and schedules notification on mount if enabled and set up', () => {
    renderHook(() => useNotificationScheduling());

    expect(mockRequestNotificationPermission).toHaveBeenCalled();
    expect(mockScheduleNotification).toHaveBeenCalled();
  });

  it('does not schedule notifications if notifications are disabled in settings', () => {
    mockSettingsStore.settings.notificationsEnabled = false;

    renderHook(() => useNotificationScheduling());

    expect(mockRequestNotificationPermission).not.toHaveBeenCalled();
    // Note: The second useEffect that schedules at midnight will check notificationsEnabled too.
    expect(mockScheduleNotification).not.toHaveBeenCalled();
  });

  it('schedules notification when notification hour or minute changes', () => {
    const { rerender } = renderHook(() => useNotificationScheduling());

    expect(mockScheduleNotification).toHaveBeenCalledTimes(1); // consolidated effect on mount

    // Mutate and rerender
    mockSettingsStore.settings.notificationTime = { hour: 9, minute: 30 };
    rerender();

    // The consolidated effect should run again because the notification time changed
    expect(mockScheduleNotification).toHaveBeenCalledTimes(2);
  });

  it('does not re-schedule notifications when other unrelated settings change', () => {
    const { rerender } = renderHook(() => useNotificationScheduling());

    expect(mockScheduleNotification).toHaveBeenCalledTimes(1); // mount

    // Mutate unrelated settings (e.g. theme or pseudo) without changing notification settings
    mockSettingsStore.settings = {
      ...mockSettingsStore.settings,
      theme: 'light',
      leaderboardPseudo: 'Bob'
    };
    rerender();

    // scheduleNotification should NOT have been called again (still 1 call)
    expect(mockScheduleNotification).toHaveBeenCalledTimes(1);
  });
});
