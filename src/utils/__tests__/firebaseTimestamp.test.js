import { describe, it, expect, afterEach } from 'vitest';
import { serverTimestamp, setServerTimestampFn } from '../firebaseTimestamp';

const DEFAULT = () => ({ '.sv': 'timestamp' });

describe('firebaseTimestamp', () => {
  afterEach(() => {
    // Restore the module-level default so tests stay isolated.
    setServerTimestampFn(DEFAULT);
  });

  it('returns the Firebase server timestamp sentinel by default', () => {
    expect(serverTimestamp()).toEqual({ '.sv': 'timestamp' });
  });

  it('uses an injected timestamp provider', () => {
    setServerTimestampFn(() => 1234567890);
    expect(serverTimestamp()).toBe(1234567890);
  });

  it('reflects the most recently injected provider', () => {
    setServerTimestampFn(() => 'first');
    setServerTimestampFn(() => 'second');
    expect(serverTimestamp()).toBe('second');
  });
});
