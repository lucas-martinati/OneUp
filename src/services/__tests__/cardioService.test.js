import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => path ?? 'root'),
  set: vi.fn(() => Promise.resolve()),
  get: vi.fn(),
  remove: vi.fn(() => Promise.resolve()),
  push: vi.fn(() => ({ key: 'generated-id' })),
  serverTimestamp: vi.fn(() => 'TS'),
}));

vi.mock('../firebase', () => ({
  getAuthInstance: vi.fn(() => ({ currentUser: { uid: 'u1' } })),
  getDatabaseInstance: vi.fn(() => ({})),
}));

import { set, get, remove } from 'firebase/database';
import { getAuthInstance, getDatabaseInstance } from '../firebase';
import { saveCardioSession, loadCardioSessions, deleteCardioSession } from '../cardioService';

const snapshot = (val) => ({ exists: () => val != null, val: () => val });

beforeEach(() => {
  vi.clearAllMocks();
  getAuthInstance.mockReturnValue({ currentUser: { uid: 'u1' } });
  getDatabaseInstance.mockReturnValue({});
});

describe('saveCardioSession', () => {
  it('saves and returns payload with generated id and timestamp', async () => {
    const result = await saveCardioSession({ distance: 5 });
    expect(set).toHaveBeenCalled();
    expect(result.id).toBe('generated-id');
    expect(result.createdAt).toBe('TS');
    expect(result.distance).toBe(5);
  });

  it('keeps an existing session id', async () => {
    const result = await saveCardioSession({ id: 'fixed', distance: 1 });
    expect(result.id).toBe('fixed');
  });

  it('returns null when signed out', async () => {
    getAuthInstance.mockReturnValue({ currentUser: null });
    expect(await saveCardioSession({})).toBeNull();
    expect(set).not.toHaveBeenCalled();
  });

  it('returns null when database is unavailable', async () => {
    getDatabaseInstance.mockReturnValue(null);
    expect(await saveCardioSession({})).toBeNull();
  });
});

describe('loadCardioSessions', () => {
  it('returns sessions sorted by startTime desc', async () => {
    get.mockResolvedValue(snapshot({
      a: { id: 'a', startTime: 100 },
      b: { id: 'b', startTime: 300 },
      c: { id: 'c', startTime: 200 },
    }));
    const sessions = await loadCardioSessions();
    expect(sessions.map(s => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('returns [] when there is no data', async () => {
    get.mockResolvedValue(snapshot(null));
    expect(await loadCardioSessions()).toEqual([]);
  });

  it('returns [] when signed out', async () => {
    getAuthInstance.mockReturnValue({ currentUser: null });
    expect(await loadCardioSessions()).toEqual([]);
  });
});

describe('deleteCardioSession', () => {
  it('removes the session and returns true', async () => {
    expect(await deleteCardioSession('x')).toBe(true);
    expect(remove).toHaveBeenCalled();
  });

  it('returns false when database is unavailable', async () => {
    getDatabaseInstance.mockReturnValue(null);
    expect(await deleteCardioSession('x')).toBe(false);
  });
});
