import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock local notifications Capacitor module
const mockCancel = vi.fn();
const mockSchedule = vi.fn();
const mockCheckPermissions = vi.fn(() => Promise.resolve({ display: 'granted' }));
const mockRequestPermissions = vi.fn();

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    cancel: mockCancel,
    schedule: mockSchedule,
    checkPermissions: mockCheckPermissions,
    requestPermissions: mockRequestPermissions,
  }
}));

// Mock i18n
vi.mock('../../i18n', () => ({
  default: {
    t: vi.fn((key) => {
      if (key === 'notifications.comeback') return ['Come back!'];
      if (key === 'notifications.streak') return ['Keep going!'];
      if (key === 'notifications.motivational') return ['Get to work!'];
      return key;
    }),
  }
}));

import { getLocalDateStr } from '../../utils/dateUtils';
import { useNotificationManager } from '../useNotificationManager';

describe('useNotificationManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maintains stable function references on re-renders when hooks parameters change', () => {
    const isDayDone1 = vi.fn();
    const getDayNumber1 = vi.fn();

    const { result, rerender } = renderHook(
      (props) => useNotificationManager(props),
      { initialProps: { isDayDone: isDayDone1, getDayNumber: getDayNumber1 } }
    );

    const firstSchedule = result.current.scheduleNotification;
    const firstPermission = result.current.requestNotificationPermission;

    // Rerender with new instances of functions
    const isDayDone2 = vi.fn();
    const getDayNumber2 = vi.fn();
    rerender({ isDayDone: isDayDone2, getDayNumber: getDayNumber2 });

    expect(result.current.scheduleNotification).toBe(firstSchedule);
    expect(result.current.requestNotificationPermission).toBe(firstPermission);
  });

  it('requests permission if display permission status is prompt', async () => {
    mockCheckPermissions.mockResolvedValueOnce({ display: 'prompt' });
    mockRequestPermissions.mockResolvedValueOnce();

    const { result } = renderHook(() => useNotificationManager({
      isDayDone: () => false,
      getDayNumber: () => 1,
    }));

    await result.current.requestNotificationPermission();

    expect(mockCheckPermissions).toHaveBeenCalled();
    expect(mockRequestPermissions).toHaveBeenCalled();
  });

  it('does not request permission if display permission is already granted', async () => {
    mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });

    const { result } = renderHook(() => useNotificationManager({
      isDayDone: () => false,
      getDayNumber: () => 1,
    }));

    await result.current.requestNotificationPermission();

    expect(mockCheckPermissions).toHaveBeenCalled();
    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });

  it('cancels and schedules local notifications correctly', async () => {
    mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });
    mockCancel.mockResolvedValueOnce({});
    mockSchedule.mockResolvedValueOnce({});

    const isDayDone = vi.fn(() => false);
    const getDayNumber = vi.fn(() => 5);

    const { result } = renderHook(() => useNotificationManager({
      isDayDone,
      getDayNumber,
    }));

    const settings = {
      notificationsEnabled: true,
      notificationTime: { hour: 10, minute: 30 }
    };

    await result.current.scheduleNotification(settings);

    expect(mockCancel).toHaveBeenCalledWith({
      notifications: [
        { id: 1000 }, { id: 1001 }, { id: 1002 }, { id: 1003 }, { id: 1004 }, { id: 1005 }, { id: 1006 }
      ]
    });

    expect(mockSchedule).toHaveBeenCalledWith(expect.objectContaining({
      notifications: expect.arrayContaining([
        expect.objectContaining({
          id: 1000,
          schedule: expect.objectContaining({ at: expect.any(Date) })
        }),
        expect.objectContaining({
          id: 1006,
          schedule: expect.objectContaining({ at: expect.any(Date) })
        })
      ])
    }));
    
    // Check that we schedule exactly 7 notifications
    const scheduleArgs = vi.mocked(mockSchedule).mock.calls[0][0];
    expect(scheduleArgs.notifications).toHaveLength(7);
  });

  it('skips scheduling on days already completed', async () => {
    mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });
    mockCancel.mockResolvedValueOnce({});
    mockSchedule.mockResolvedValueOnce({});

    // Skip the day after tomorrow (offset 2 days) to test intra-loop skipping
    const dayAfterTomorrowStr = getLocalDateStr(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));
    const isDayDone = vi.fn((dateStr) => dateStr === dayAfterTomorrowStr);
    const getDayNumber = vi.fn(() => 5);

    const { result } = renderHook(() => useNotificationManager({
      isDayDone,
      getDayNumber,
    }));

    const settings = {
      notificationsEnabled: true,
      notificationTime: { hour: 10, minute: 30 }
    };

    await result.current.scheduleNotification(settings);

    // Tomorrow is skipped, so we should only schedule 6 notifications instead of 7
    const scheduleArgs = vi.mocked(mockSchedule).mock.calls[0][0];
    expect(scheduleArgs.notifications).toHaveLength(6);
  });
});
