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

let mockAppUrl = 'https://oneupme.me';
vi.mock('@config/app', () => ({
  get APP_URL() { return mockAppUrl; }
}));

import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { openLegalPage } from '../navigation';

describe('navigation utility', () => {
  const originalWindowOpen = window.open;

  beforeEach(() => {
    mockAppUrl = 'https://oneupme.me';
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

  it('opens in window.open when on web resolving against window.location.href', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    await openLegalPage('privacy');
    const expectedUrl = new URL('privacy.html', window.location.href).href;
    expect(Browser.open).not.toHaveBeenCalled();
    expect(window.open).toHaveBeenCalledWith(
      expectedUrl,
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('opens in Capacitor Browser when native using APP_URL', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    await openLegalPage('terms');
    expect(Browser.open).toHaveBeenCalledWith({
      url: 'https://oneupme.me/terms.html'
    });
    expect(window.open).not.toHaveBeenCalled();
  });

  it('falls back to window.open if Capacitor Browser fails using APP_URL', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.mocked(Browser.open).mockRejectedValueOnce(new Error('Capacitor Browser failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await openLegalPage('privacy');

    expect(Browser.open).toHaveBeenCalled();
    expect(window.open).toHaveBeenCalledWith(
      'https://oneupme.me/privacy.html',
      '_blank',
      'noopener,noreferrer'
    );
    consoleSpy.mockRestore();
  });

  it('falls back to window.location.href and logs a warning on native if APP_URL is missing', async () => {
    mockAppUrl = '';
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await openLegalPage('terms');

    const expectedUrl = new URL('terms.html', window.location.href).href;
    expect(Browser.open).toHaveBeenCalledWith({
      url: expectedUrl
    });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('APP_URL is not defined'));
    consoleSpy.mockRestore();
  });
});

