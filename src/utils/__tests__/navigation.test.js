import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@capacitor/browser', () => ({
  Browser: {
    open: vi.fn(() => Promise.resolve())
  }
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false)
  }
}));

import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { openLegalPage } from '../navigation';

describe('navigation utility', () => {
  const originalWindowOpen = window.open;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    vi.mocked(Browser.open).mockReset().mockResolvedValue(undefined);
    window.open = vi.fn();
  });

  afterEach(() => {
    window.open = originalWindowOpen;
  });

  it('rejects invalid types', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await openLegalPage('invalid');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid legal page type'));
    expect(Browser.open).not.toHaveBeenCalled();
    expect(window.open).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('opens in window.open when on web', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    await openLegalPage('privacy');
    expect(Browser.open).not.toHaveBeenCalled();
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('privacy.html'),
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('opens in Capacitor Browser when native', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    await openLegalPage('terms');
    expect(Browser.open).toHaveBeenCalledWith({
      url: expect.stringContaining('terms.html')
    });
    expect(window.open).not.toHaveBeenCalled();
  });

  it('falls back to window.open if Capacitor Browser fails', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(Browser.open).mockRejectedValueOnce(new Error('Capacitor Browser failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await openLegalPage('privacy');

    expect(Browser.open).toHaveBeenCalled();
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('privacy.html'),
      '_blank',
      'noopener,noreferrer'
    );
    consoleSpy.mockRestore();
  });
});

