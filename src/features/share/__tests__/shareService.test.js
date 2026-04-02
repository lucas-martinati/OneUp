import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn(() => Promise.resolve('data:image/png;base64,fake')),
  toJpeg: vi.fn(() => Promise.resolve('data:image/jpeg;base64,fake')),
}));

// Mock @capacitor/share
vi.mock('@capacitor/share', () => ({
  Share: { share: vi.fn() },
}));

// Mock @capacitor/core
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

import { captureElement, dataUrlToBlob, downloadImage, shareImage } from '../services/shareService';
import { toPng, toJpeg } from 'html-to-image';
import { Share } from '@capacitor/share';

// ── captureElement ─────────────────────────────────────────────────────

describe('captureElement', () => {
  beforeEach(() => {
    vi.mocked(toPng).mockClear();
    vi.mocked(toJpeg).mockClear();
  });

  it('throws when no element provided', async () => {
    await expect(captureElement(null)).rejects.toThrow('No element to capture');
  });

  it('calls toPng by default and returns data URL', async () => {
    const mockEl = document.createElement('div');
    const result = await captureElement(mockEl);

    expect(toPng).toHaveBeenCalledWith(mockEl, expect.objectContaining({
      quality: 0.92,
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#0a0a0f',
    }));
    expect(result).toBe('data:image/png;base64,fake');
  });

  it('calls toJpeg when format is jpeg', async () => {
    const mockEl = document.createElement('div');
    await captureElement(mockEl, { format: 'jpeg', quality: 0.8 });

    expect(toJpeg).toHaveBeenCalledWith(mockEl, expect.objectContaining({
      quality: 0.8,
    }));
  });
});

// ── dataUrlToBlob ──────────────────────────────────────────────────────

describe('dataUrlToBlob', () => {
  it('converts a data URL to a Blob', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ blob: () => Promise.resolve(mockBlob) })));

    const result = await dataUrlToBlob('data:image/png;base64,test');
    expect(result).toBeInstanceOf(Blob);

    vi.restoreAllMocks();
  });
});

// ── shareImage ─────────────────────────────────────────────────────────

describe('shareImage', () => {
  it('returns { success: false, method: "none" } when no share API available', async () => {
    vi.stubGlobal('navigator', { share: undefined, canShare: undefined });

    const result = await shareImage('data:image/png;base64,test', { title: 'Test' });
    expect(result).toEqual({ success: false, method: 'none' });

    vi.restoreAllMocks();
  });

  it('uses Web Share API when available and canShare returns true', async () => {
    const mockShareFn = vi.fn(() => Promise.resolve());
    const mockCanShare = vi.fn(() => true);

    const mockBlob = new Blob(['test'], { type: 'image/png' });
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ blob: () => Promise.resolve(mockBlob) })));
    vi.stubGlobal('navigator', { share: mockShareFn, canShare: mockCanShare });

    const result = await shareImage('data:image/png;base64,test', { title: 'OneUp', text: 'Test' });
    expect(result).toEqual({ success: true, method: 'web-share-api' });
    expect(mockShareFn).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('returns canceled on AbortError', async () => {
    const abortError = new Error('User cancelled');
    abortError.name = 'AbortError';
    const mockShareFn = vi.fn(() => Promise.reject(abortError));
    const mockCanShare = vi.fn(() => true);

    const mockBlob = new Blob(['test'], { type: 'image/png' });
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ blob: () => Promise.resolve(mockBlob) })));
    vi.stubGlobal('navigator', { share: mockShareFn, canShare: mockCanShare });

    const result = await shareImage('data:image/png;base64,test', { title: 'Test' });
    expect(result).toEqual({ success: false, canceled: true });

    vi.restoreAllMocks();
  });
});

// ── downloadImage ──────────────────────────────────────────────────────

describe('downloadImage', () => {
  it('creates a link and triggers download', async () => {
    const clickSpy = vi.fn();
    const originalCreate = document.createElement;
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        const el = originalCreate.call(document, tag);
        el.click = clickSpy;
        return el;
      }
      return originalCreate.call(document, tag);
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    const result = await downloadImage('data:image/png;base64,test', 'my-file.png');
    expect(result).toEqual({ success: true, method: 'download' });
    expect(clickSpy).toHaveBeenCalled();

    vi.restoreAllMocks();
  });
});
