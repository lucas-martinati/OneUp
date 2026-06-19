import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnnouncement } from '../useAnnouncement';
import CURRENT_ANNOUNCEMENT from '../announcementConfig';

vi.mock('../announcementConfig', () => {
  return {
    default: {
      id: 'test-announcement-1',
      enabled: true,
      titleKey: 'title',
      bodyKey: 'body',
      ctaKey: 'cta'
    }
  };
});

describe('useAnnouncement', () => {
  const RETURNING_USER_KEY = 'oneup_has_opened';
  const STORAGE_PREFIX = 'announcement_seen_';

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    CURRENT_ANNOUNCEMENT.enabled = true;
    CURRENT_ANNOUNCEMENT.id = 'test-announcement-1';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not show announcement on first app open, but sets returning user flag', () => {
    // First open: localStorage is empty
    const { result } = renderHook(() => useAnnouncement());

    expect(result.current.showAnnouncement).toBe(false);
    
    // Fast forward to ensure it doesn't pop up later
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current.showAnnouncement).toBe(false);
    expect(localStorage.getItem(RETURNING_USER_KEY)).toBe('1');
    expect(localStorage.getItem(STORAGE_PREFIX + CURRENT_ANNOUNCEMENT.id)).toBeNull();
  });

  it('shows announcement after delay for returning users if not seen', () => {
    // Mark as returning user
    localStorage.setItem(RETURNING_USER_KEY, '1');

    const { result } = renderHook(() => useAnnouncement());

    // Initially false
    expect(result.current.showAnnouncement).toBe(false);

    act(() => {
      vi.advanceTimersByTime(800);
    });

    // Becomes true after 800ms
    expect(result.current.showAnnouncement).toBe(true);
    expect(result.current.announcement).toEqual(CURRENT_ANNOUNCEMENT);
  });

  it('does not show announcement if it was already seen', () => {
    // Returning user
    localStorage.setItem(RETURNING_USER_KEY, '1');
    // Already seen this specific announcement
    localStorage.setItem(STORAGE_PREFIX + CURRENT_ANNOUNCEMENT.id, '1');

    const { result } = renderHook(() => useAnnouncement());

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.showAnnouncement).toBe(false);
  });

  it('dismissing the announcement hides it and saves to localStorage', () => {
    localStorage.setItem(RETURNING_USER_KEY, '1');

    const { result } = renderHook(() => useAnnouncement());

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(result.current.showAnnouncement).toBe(true);

    act(() => {
      result.current.dismissAnnouncement();
    });

    expect(result.current.showAnnouncement).toBe(false);
    expect(localStorage.getItem(STORAGE_PREFIX + CURRENT_ANNOUNCEMENT.id)).toBe('1');
  });

  it('does not show anything if enabled is false', () => {
    CURRENT_ANNOUNCEMENT.enabled = false;
    localStorage.setItem(RETURNING_USER_KEY, '1');

    const { result } = renderHook(() => useAnnouncement());

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.showAnnouncement).toBe(false);
  });
});
