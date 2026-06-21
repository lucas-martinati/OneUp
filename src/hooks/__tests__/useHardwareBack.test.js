import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@utils/platform', () => ({ isNativePlatform: vi.fn(() => true) }));
vi.mock('@utils/backHandler', () => ({ runBackHandler: vi.fn(() => false) }));

const removeListener = vi.fn();
const addListener = vi.fn(() => ({ remove: removeListener }));
const exitApp = vi.fn();
let backHandlerRef;
addListener.mockImplementation((_evt, handler) => { backHandlerRef = handler; return { remove: removeListener }; });

vi.mock('@capacitor/app', () => ({ App: { addListener, exitApp } }));

import { isNativePlatform } from '@utils/platform';
import { runBackHandler } from '@utils/backHandler';
import { useHardwareBack } from '../useHardwareBack';

const flush = () => new Promise(r => setTimeout(r, 0));

beforeEach(() => {
  vi.clearAllMocks();
  isNativePlatform.mockReturnValue(true);
  runBackHandler.mockReturnValue(false);
  addListener.mockImplementation((_evt, handler) => { backHandlerRef = handler; return { remove: removeListener }; });
});
afterEach(() => { backHandlerRef = undefined; });

describe('useHardwareBack', () => {
  it('does nothing on web platforms', () => {
    isNativePlatform.mockReturnValue(false);
    renderHook(() => useHardwareBack());
    expect(addListener).not.toHaveBeenCalled();
  });

  it('registers a backButton listener on native', async () => {
    renderHook(() => useHardwareBack());
    await flush();
    expect(addListener).toHaveBeenCalledWith('backButton', expect.any(Function));
  });

  it('exits the app when no handler consumes the back press', async () => {
    renderHook(() => useHardwareBack());
    await flush();
    backHandlerRef();
    expect(exitApp).toHaveBeenCalled();
  });

  it('resumes sync and does not exit when a handler consumes the press', async () => {
    runBackHandler.mockReturnValue(true);
    const onResumeSync = vi.fn();
    renderHook(() => useHardwareBack(onResumeSync));
    await flush();
    backHandlerRef();
    expect(onResumeSync).toHaveBeenCalled();
    expect(exitApp).not.toHaveBeenCalled();
  });

  it('removes the listener on unmount', async () => {
    const { unmount } = renderHook(() => useHardwareBack());
    await flush();
    unmount();
    await flush();
    expect(removeListener).toHaveBeenCalled();
  });
});
