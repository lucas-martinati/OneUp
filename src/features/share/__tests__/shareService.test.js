import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn(() => Promise.resolve('data:image/png;base64,fake')),
  toJpeg: vi.fn(() => Promise.resolve('data:image/jpeg;base64,fake')),
}));

// Mock @capacitor/share (also resolved by the dynamic import in downloadImage)
vi.mock('@capacitor/share', () => ({
  Share: { share: vi.fn(() => Promise.resolve()) },
}));

// Mock @capacitor/core — isNativePlatform is a vi.fn so each test can toggle it
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
}));

// Mock @capacitor/filesystem (only ever loaded via dynamic import)
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile: vi.fn(() => Promise.resolve({ uri: 'file:///cache/oneup.png' })) },
  Directory: { Cache: 'CACHE' },
}));

import {
  captureElement,
  dataUrlToBlob,
  downloadImage,
  shareImage,
  canShareNatively,
} from '../services/shareService';
import { toPng, toJpeg } from 'html-to-image';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  vi.mocked(toPng).mockResolvedValue('data:image/png;base64,fake');
  vi.mocked(toJpeg).mockResolvedValue('data:image/jpeg;base64,fake');
  vi.mocked(Share.share).mockResolvedValue();
  vi.mocked(Filesystem.writeFile).mockResolvedValue({ uri: 'file:///cache/oneup.png' });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── captureElement ─────────────────────────────────────────────────────

describe('captureElement', () => {
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
      skipFonts: true,
    }));
    expect(result).toBe('data:image/png;base64,fake');
  });

  it('calls toJpeg when format is jpeg', async () => {
    const mockEl = document.createElement('div');
    await captureElement(mockEl, { format: 'jpeg', quality: 0.8 });

    expect(toJpeg).toHaveBeenCalledWith(mockEl, expect.objectContaining({ quality: 0.8 }));
    expect(toPng).not.toHaveBeenCalled();
  });

  it('forwards a custom pixelRatio', async () => {
    const mockEl = document.createElement('div');
    await captureElement(mockEl, { pixelRatio: 3 });
    expect(toPng).toHaveBeenCalledWith(mockEl, expect.objectContaining({ pixelRatio: 3 }));
  });
});

// ── dataUrlToBlob ──────────────────────────────────────────────────────

describe('dataUrlToBlob', () => {
  it('converts a data URL to a Blob', async () => {
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ blob: () => Promise.resolve(mockBlob) })));

    const result = await dataUrlToBlob('data:image/png;base64,test');
    expect(result).toBeInstanceOf(Blob);
    expect(fetch).toHaveBeenCalledWith('data:image/png;base64,test');
  });
});

// ── shareImage (web) ────────────────────────────────────────────────────

describe('shareImage (web)', () => {
  it('returns { success: false, method: "none" } when no share API available', async () => {
    vi.stubGlobal('navigator', { share: undefined, canShare: undefined });

    const result = await shareImage('data:image/png;base64,test', { title: 'Test' });
    expect(result).toEqual({ success: false, method: 'none' });
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
  });

  it('returns { success: false, method: "none" } when canShare(shareData) is false', async () => {
    const mockShareFn = vi.fn(() => Promise.resolve());
    const mockCanShare = vi.fn(() => false);
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ blob: () => Promise.resolve(mockBlob) })));
    vi.stubGlobal('navigator', { share: mockShareFn, canShare: mockCanShare });

    const result = await shareImage('data:image/png;base64,test', { title: 'Test' });
    expect(result).toEqual({ success: false, method: 'none' });
    expect(mockShareFn).not.toHaveBeenCalled();
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
  });

  it('swallows non-abort web share errors and returns method "none"', async () => {
    const mockShareFn = vi.fn(() => Promise.reject(new Error('boom')));
    const mockCanShare = vi.fn(() => true);
    const mockBlob = new Blob(['test'], { type: 'image/png' });
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ blob: () => Promise.resolve(mockBlob) })));
    vi.stubGlobal('navigator', { share: mockShareFn, canShare: mockCanShare });

    const result = await shareImage('data:image/png;base64,test', { title: 'Test' });
    expect(result).toEqual({ success: false, method: 'none' });
  });
});

// ── shareImage (native) ──────────────────────────────────────────────────

describe('shareImage (native)', () => {
  beforeEach(() => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
  });

  it('writes the file then shares via Capacitor', async () => {
    const result = await shareImage('data:image/png;base64,fake', { title: 'OneUp', text: 'go' });

    expect(Filesystem.writeFile).toHaveBeenCalledWith(expect.objectContaining({
      data: 'fake',
      directory: 'CACHE',
    }));
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({
      title: 'OneUp',
      text: 'go',
      url: 'file:///cache/oneup.png',
    }));
    expect(result).toEqual({ success: true, method: 'capacitor' });
  });

  it('returns canceled when the native share is dismissed', async () => {
    vi.mocked(Share.share).mockRejectedValueOnce(new Error('Share canceled'));
    const result = await shareImage('data:image/png;base64,fake', { title: 'OneUp' });
    expect(result).toEqual({ success: false, canceled: true });
  });

  it('treats the "Share canceled." variant as canceled', async () => {
    vi.mocked(Share.share).mockRejectedValueOnce(new Error('Share canceled.'));
    const result = await shareImage('data:image/png;base64,fake', { title: 'OneUp' });
    expect(result).toEqual({ success: false, canceled: true });
  });

  it('rethrows unexpected native errors', async () => {
    vi.mocked(Share.share).mockRejectedValueOnce(new Error('disk full'));
    await expect(shareImage('data:image/png;base64,fake', { title: 'OneUp' }))
      .rejects.toThrow('disk full');
  });
});

// ── downloadImage ──────────────────────────────────────────────────────

describe('downloadImage (web)', () => {
  it('creates a link and triggers download', async () => {
    const clickSpy = vi.fn();
    const originalCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreate(tag);
      if (tag === 'a') el.click = clickSpy;
      return el;
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    const result = await downloadImage('data:image/png;base64,test', 'my-file.png');
    expect(result).toEqual({ success: true, method: 'download' });
    expect(clickSpy).toHaveBeenCalled();
  });
});

describe('downloadImage (native)', () => {
  beforeEach(() => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
  });

  it('saves the file and shares it natively', async () => {
    const result = await downloadImage('data:image/png;base64,fake', 'shot.png');

    expect(Filesystem.writeFile).toHaveBeenCalledWith(expect.objectContaining({
      path: 'shot.png',
      data: 'fake',
      directory: 'CACHE',
    }));
    expect(Share.share).toHaveBeenCalledWith(expect.objectContaining({ url: 'file:///cache/oneup.png' }));
    expect(result).toEqual({ success: true, method: 'native-share' });
  });

  it('generates a timestamped filename when none is given', async () => {
    await downloadImage('data:image/png;base64,fake', '');
    expect(Filesystem.writeFile).toHaveBeenCalledWith(expect.objectContaining({
      path: expect.stringMatching(/^oneup-session-\d+\.png$/),
    }));
  });

  it('falls back to a web download when the native save fails', async () => {
    vi.mocked(Filesystem.writeFile).mockRejectedValueOnce(new Error('no fs'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const clickSpy = vi.fn();
    const originalCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = originalCreate(tag);
      if (tag === 'a') el.click = clickSpy;
      return el;
    });
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

    const result = await downloadImage('data:image/png;base64,fake', 'shot.png');
    expect(result).toEqual({ success: true, method: 'download' });
    expect(clickSpy).toHaveBeenCalled();
  });
});

// ── canShareNatively ─────────────────────────────────────────────────────

describe('canShareNatively', () => {
  it('returns true on a native platform', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    vi.stubGlobal('navigator', {});
    expect(canShareNatively()).toBe(true);
  });

  it('returns true on web when the Web Share API is available', () => {
    vi.stubGlobal('navigator', { share: vi.fn(), canShare: vi.fn() });
    expect(canShareNatively()).toBe(true);
  });

  it('returns false on web without the Web Share API', () => {
    vi.stubGlobal('navigator', { share: undefined, canShare: undefined });
    expect(canShareNatively()).toBe(false);
  });
});
