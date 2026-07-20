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

// Mock useComputedStatsStore
const { mockStats } = vi.hoisted(() => ({
  mockStats: { displayStreak: 0 }
}));

vi.mock('@store/useComputedStatsStore', () => ({
  useComputedStatsStore: {
    getState: () => ({
      stats: { displayStreak: mockStats.displayStreak }
    })
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

import { getLocalDateStr } from '@shared/dateUtils';
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

  it('skips tomorrow if already done at start of scheduling', async () => {
    mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });
    mockCancel.mockResolvedValueOnce({});
    mockSchedule.mockResolvedValueOnce({});

    const tomorrowStr = getLocalDateStr(new Date(Date.now() + 86400000));
    
    // Return true for tomorrow, but false for all other future days
    const isDayDone = vi.fn((dateStr) => dateStr === tomorrowStr);

    const { result } = renderHook(() => useNotificationManager({
      isDayDone,
      getDayNumber: () => 5,
    }));

    await result.current.scheduleNotification({
      notificationsEnabled: true,
      notificationTime: { hour: 10, minute: 30 }
    });

    // Since tomorrow was skipped initially, the start date shifts, so it should still try to schedule 7 days 
    // but the actual first day is day after tomorrow.
    expect(mockSchedule).toHaveBeenCalled();
  });

  describe('error handling / edge cases', () => {
    it('scheduleNotification catches errors gracefully', async () => {
      mockCheckPermissions.mockRejectedValueOnce(new Error('PermissionError'));
      const { result } = renderHook(() => useNotificationManager({ isDayDone: () => false, getDayNumber: () => 1 }));
      await result.current.scheduleNotification({ notificationsEnabled: true, notificationTime: { hour: 10, minute: 0 } });
      // Should not throw
    });

    it('requestNotificationPermission catches errors gracefully', async () => {
      mockCheckPermissions.mockRejectedValueOnce(new Error('PermissionError'));
      const { result } = renderHook(() => useNotificationManager({ isDayDone: () => false, getDayNumber: () => 1 }));
      await result.current.requestNotificationPermission();
      // Should not throw
    });

    it('buildNotificationContent covers comeback, milestone, streak, and random paths', async () => {
      const settings = { notificationsEnabled: true, notificationTime: { hour: 10, minute: 30 } };
      
      // 1. Comeback (streak 0)
      mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });
      mockSchedule.mockClear();
      mockStats.displayStreak = 0;
      let { result } = renderHook(() => useNotificationManager({
        isDayDone: () => false, // streak 0
        getDayNumber: () => 1,
      }));
      await result.current.scheduleNotification(settings);

      // 2. Milestone
      mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });
      mockSchedule.mockClear();
      mockStats.displayStreak = 7;
      result = renderHook(() => useNotificationManager({
        isDayDone: (dateStr) => {
           const tomorrowStr = getLocalDateStr(new Date(Date.now() + 86400000));
           return dateStr < tomorrowStr;
        },
        getDayNumber: () => 7, // 7 is a milestone
      })).result;
      await result.current.scheduleNotification(settings);

      // 3. Streak >= 3
      mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });
      mockSchedule.mockClear();
      mockStats.displayStreak = 4;
      result = renderHook(() => useNotificationManager({
        isDayDone: (dateStr) => {
           const tomorrowStr = getLocalDateStr(new Date(Date.now() + 86400000));
           return dateStr < tomorrowStr;
        },
        getDayNumber: () => 2,
      })).result;
      await result.current.scheduleNotification(settings);

      // 4. Random (streak < 3, not milestone)
      mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });
      mockSchedule.mockClear();
      mockStats.displayStreak = 1;
      result = renderHook(() => useNotificationManager({
        isDayDone: (dateStr) => {
           const tomorrowStr = getLocalDateStr(new Date(Date.now() + 86400000));
           if (dateStr >= tomorrowStr) return false;
           // 1 day streak
           const todayStr = getLocalDateStr(new Date());
           return dateStr === todayStr;
        },
        getDayNumber: () => 2,
      })).result;
      // Mock Math.random to cover all 3 categories (motivational, fun, challenge)
      vi.spyOn(Math, 'random').mockReturnValue(0.99); // force challenge
      await result.current.scheduleNotification(settings);
      
      vi.spyOn(Math, 'random').mockReturnValue(0.5); // force fun
      await result.current.scheduleNotification(settings);
      
      vi.spyOn(Math, 'random').mockReturnValue(0.1); // force motivational
      await result.current.scheduleNotification(settings);

      vi.restoreAllMocks();
    });

    it('does not use the comeback message when today is not done yet but the streak is still active', async () => {
      // Regression: previously the streak was counted from today, which is never
      // done when the reminder fires, so streak was always 0 → comeback message.
      const settings = { notificationsEnabled: true, notificationTime: { hour: 10, minute: 30 } };
      mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });
      mockSchedule.mockClear();
      mockStats.displayStreak = 5;

      const { result } = renderHook(() => useNotificationManager({
        // Yesterday and earlier are done; today (and future) not done yet.
        isDayDone: (dateStr) => dateStr < getLocalDateStr(new Date()),
        getDayNumber: () => 5, // non-milestone
      }));
      await result.current.scheduleNotification(settings);

      const scheduled = mockSchedule.mock.calls[0][0].notifications;
      // The imminent reminder (dayIndex 0) must reflect the active streak,
      // not the comeback path.
      expect(scheduled[0].body).toBe('Keep going!');
      expect(scheduled[0].body).not.toBe('Come back!');
    });
  });
});
