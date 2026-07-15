import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const h = vi.hoisted(() => ({ android: false }));
vi.mock('@utils/platform', () => ({ isAndroidPlatform: () => h.android }));

import { useCameraPushUpCounter } from '../useCameraPushUpCounter';

// ── Fakes shared across tests ──
let frameQueue = [];
const fakeCtx = {
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({ data: frameQueue.shift() ?? new Uint8ClampedArray(32 * 24 * 4) })),
};
const makeStream = () => ({ getTracks: () => [{ stop: vi.fn() }] });
const widgetBridge = { checkCameraPermission: vi.fn(), requestCameraPermission: vi.fn() };

vi.mock('@capacitor/core', () => ({ registerPlugin: () => widgetBridge }));

beforeEach(() => {
  vi.clearAllMocks();
  h.android = false;
  frameQueue = [];
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx);
  navigator.mediaDevices = { getUserMedia: vi.fn(() => Promise.resolve(makeStream())) };
  const audioNode = {
    connect: vi.fn(), frequency: { setValueAtTime: vi.fn() },
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    start: vi.fn(), stop: vi.fn(), type: '',
  };
  window.AudioContext = vi.fn(function() {
    return {
      state: 'running', resume: vi.fn(), currentTime: 0,
      createOscillator: () => audioNode, createGain: () => audioNode,
      destination: {}, close: () => Promise.resolve(),
    };
  });
});
afterEach(() => vi.restoreAllMocks());

describe('startCamera', () => {
  it('activates the camera and starts calibration on web', async () => {
    const { result } = renderHook(() => useCameraPushUpCounter(vi.fn()));
    await act(async () => { await result.current.startCamera(); });
    expect(result.current.isActive).toBe(true);
    expect(result.current.calibrateCountdown).toBe(3);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  });

  it('requests camera permission on Android and proceeds when granted', async () => {
    h.android = true;
    widgetBridge.checkCameraPermission.mockResolvedValue({ status: 'DENIED' });
    widgetBridge.requestCameraPermission.mockResolvedValue({ status: 'GRANTED' });
    const { result } = renderHook(() => useCameraPushUpCounter(vi.fn()));
    await act(async () => { await result.current.startCamera(); });
    expect(widgetBridge.requestCameraPermission).toHaveBeenCalled();
    expect(result.current.isActive).toBe(true);
  });

  it('surfaces a permission error when Android denies the camera', async () => {
    h.android = true;
    widgetBridge.checkCameraPermission.mockResolvedValue({ status: 'DENIED' });
    widgetBridge.requestCameraPermission.mockResolvedValue({ status: 'DENIED' });
    const { result } = renderHook(() => useCameraPushUpCounter(vi.fn()));
    await act(async () => { await result.current.startCamera(); });
    expect(result.current.error).toBe('permission_denied');
  });

  it('surfaces an error when getUserMedia rejects', async () => {
    navigator.mediaDevices.getUserMedia.mockRejectedValue(new Error('no cam'));
    const { result } = renderHook(() => useCameraPushUpCounter(vi.fn()));
    await act(async () => { await result.current.startCamera(); });
  });
});

const fakeVideo = () => ({ readyState: 2, paused: false, ended: false, play: () => Promise.resolve(), srcObject: null, onloadeddata: null });

const driveCalibration = async (result) => {
  result.current.videoRef.current = fakeVideo();
  await act(async () => { await result.current.startCamera(); });
  result.current.videoRef.current = fakeVideo();
  for (let i = 0; i < 4; i++) {
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  }
  // Capture base frame (100ms) then run the spaced frame loop to completion.
  await act(async () => { await vi.advanceTimersByTimeAsync(700); });
};

describe('stopCamera & recalibrate', () => {
  it('resets state and stops the stream tracks', async () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useCameraPushUpCounter(vi.fn()));
    await driveCalibration(result);
    act(() => result.current.stopCamera());
    expect(result.current.isActive).toBe(false);
    expect(result.current.proximity).toBe(0);
    expect(result.current.calibrateCountdown).toBe(0);
    unmount();
    vi.useRealTimers();
  });

  it('recalibrate restarts the countdown', async () => {
    const { result } = renderHook(() => useCameraPushUpCounter(vi.fn()));
    await act(async () => { await result.current.startCamera(); });
    act(() => result.current.recalibrate());
    expect(result.current.calibrateCountdown).toBe(3);
    expect(result.current.isCalibrated).toBe(false);
  });
});

describe('calibration countdown and frame processing', () => {
  // rAF is scheduled via a 60ms timer (not 0ms) so that, under fake timers,
  // virtual time — and thus Date.now() — advances between frames. The detector
  // now requires the descent to last at least MIN_DOWN_MS (150ms), so a few
  // 60ms-spaced frames are needed to satisfy it. The spacing also lets React
  // commit the pushup-state change between frames so stateRef flips correctly.
  const setupRaf = (cap) => {
    let frames = 0;
    globalThis.requestAnimationFrame = (cb) => { if (frames < cap) { frames++; setTimeout(cb, 60); } return frames; };
    globalThis.cancelAnimationFrame = vi.fn();
  };

  it('counts down, captures a base frame, then counts a rep through the processing loop', async () => {
    vi.useFakeTimers();
    try {
      setupRaf(8);

      // base = zeros, sustained bright descent (big diff), then back to base.
      // The descent spans two frames so it lasts long enough to count, and the
      // return spans two frames so the EMA-smoothed score falls below threshold.
      const base = new Uint8ClampedArray(32 * 24 * 4);
      const down = new Uint8ClampedArray(32 * 24 * 4).fill(220);
      const up = new Uint8ClampedArray(32 * 24 * 4);
      frameQueue = [base, down, down, up, up];

      const onRep = vi.fn();
      const { result } = renderHook(() => useCameraPushUpCounter(onRep));
      await driveCalibration(result);

      expect(result.current.isCalibrated).toBe(true);
      // The processing loop transitioned up→down→up and counted exactly one rep.
      expect(onRep).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not count a small movement that never reaches the descent threshold', async () => {
    vi.useFakeTimers();
    try {
      setupRaf(8);

      // Tiny pixel diff (noise / fidgeting) — stays below DOWN_ENTER, no rep.
      const base = new Uint8ClampedArray(32 * 24 * 4);
      const tiny = new Uint8ClampedArray(32 * 24 * 4).fill(15);
      frameQueue = [base, tiny, tiny, base, base];

      const onRep = vi.fn();
      const { result, unmount } = renderHook(() => useCameraPushUpCounter(onRep));
      
      // Override readyState for this test to cover onloadeddata branch
      const video = fakeVideo();
      video.readyState = 0;
      result.current.videoRef.current = video;
      
      await act(async () => { await result.current.startCamera(); });
      // Count down 3s
      for (let i = 0; i < 4; i++) {
        await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
      }

      // Trigger onloadeddata since readyState is 0
      if (result.current.videoRef.current?.onloadeddata) {
        result.current.videoRef.current.onloadeddata();
      }

      // Capture base frame (100ms) then run the spaced frame loop to completion.
      await act(async () => { await vi.advanceTimersByTimeAsync(700); });

      expect(result.current.isCalibrated).toBe(true);
      expect(onRep).not.toHaveBeenCalled();

      // Trigger unmount to cover cleanup functions
      unmount();
    } finally {
      vi.useRealTimers();
    }
  });
});
