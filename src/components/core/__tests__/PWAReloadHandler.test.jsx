import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

vi.mock('virtual:pwa-register', () => ({ registerSW: vi.fn() }));

import { registerSW } from 'virtual:pwa-register';
import { PWAReloadHandler } from '../PWAReloadHandler';

let listeners;
let originalSW;
let reloadSpy;

beforeEach(() => {
  vi.clearAllMocks();
  listeners = {};
  originalSW = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  if (originalSW) Object.defineProperty(navigator, 'serviceWorker', originalSW);
  else delete navigator.serviceWorker;
});

function installServiceWorker() {
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      addEventListener: (evt, cb) => { listeners[evt] = cb; },
      removeEventListener: vi.fn(),
    },
  });
}

describe('PWAReloadHandler', () => {
  it('returns null and registers nothing in dev / without serviceWorker', () => {
    vi.stubEnv('DEV', true);
    const { container } = render(<PWAReloadHandler />);
    expect(container.firstChild).toBeNull();
    expect(registerSW).not.toHaveBeenCalled();
  });

  it('registers the SW and reloads on controllerchange in production', () => {
    vi.stubEnv('DEV', false);
    installServiceWorker();
    reloadSpy = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { ...originalLocation, reload: reloadSpy } });

    render(<PWAReloadHandler />);
    expect(registerSW).toHaveBeenCalled();
    // exercise the registerSW callbacks
    const opts = registerSW.mock.calls[0][0];
    opts.onRegisteredSW('sw.js', { update: vi.fn(), installing: false });
    opts.onNeedRefresh();
    opts.onOfflineReady();

    expect(listeners.controllerchange).toBeTypeOf('function');
    listeners.controllerchange();
    listeners.controllerchange(); // second call is a no-op (refreshing guard)
    expect(reloadSpy).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });
});
