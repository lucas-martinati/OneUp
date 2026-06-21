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
  window.AudioContext = vi.fn(() => ({
    state: 'running', resume: vi.fn(), currentTime: 0,
    createOscillator: () => audioNode, createGain: () => audioNode,
    destination: {}, close: () => Promise.resolve(),
  }));
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
    expect(result.current.error).toBe('permission_denied');
    expect(result.current.isActive).toBe(true);
  });
});

describe('stopCamera & recalibrate', () => {
  it('resets state and stops the stream tracks', async () => {
    const { result } = renderHook(() => useCameraPushUpCounter(vi.fn()));
    await act(async () => { await result.current.startCamera(); });
    act(() => result.current.stopCamera());
    expect(result.current.isActive).toBe(false);
    expect(result.current.proximity).toBe(0);
    expect(result.current.calibrateCountdown).toBe(0);
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
  it('counts down, captures a base frame, then counts a rep through the processing loop', async () => {
    vi.useFakeTimers();
    try {
      // rAF scheduled asynchronously (via a 0ms timer) so React commits the
      // pushup-state change between frames — that lets stateRef flip to 'down'
      // before the 'up' frame, which is what counts a rep. Capped so the loop
      // terminates instead of rescheduling forever.
      let frames = 0;
      globalThis.requestAnimationFrame = (cb) => { if (frames < 3) { frames++; setTimeout(cb, 0); } return frames; };
      globalThis.cancelAnimationFrame = vi.fn();

      // base = zeros, down = bright (big diff), up = back to base (rep on return)
      const base = new Uint8ClampedArray(32 * 24 * 4);
      const down = new Uint8ClampedArray(32 * 24 * 4).fill(220);
      const up = new Uint8ClampedArray(32 * 24 * 4);
      frameQueue = [base, down, up];

      const onRep = vi.fn();
      const { result } = renderHook(() => useCameraPushUpCounter(onRep));

      // Attach a fake video element the hook's internal ref points at.
      result.current.videoRef.current = { readyState: 2, paused: false, ended: false, play: () => Promise.resolve(), srcObject: null, onloadeddata: null };

      await act(async () => { await result.current.startCamera(); });
      result.current.videoRef.current = { readyState: 2, paused: false, ended: false, play: () => Promise.resolve(), srcObject: null, onloadeddata: null };

      // Drive the 3s countdown one second at a time: each decrement reschedules
      // the next timer from a React effect (microtask), so a single large jump
      // would skip the not-yet-scheduled ticks.
      for (let i = 0; i < 4; i++) {
        await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
      }
      await act(async () => { await vi.advanceTimersByTimeAsync(200); });
      // Let the async frame loop (down → up) run to completion.
      await act(async () => { await vi.advanceTimersByTimeAsync(50); });

      expect(result.current.isCalibrated).toBe(true);
      // The processing loop transitioned up→down→up and counted one rep.
      expect(onRep).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
