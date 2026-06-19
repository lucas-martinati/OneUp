import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { set, get } from 'firebase/database';
import { getAuthInstance, getDatabaseInstance } from '../../../services/firebase';
import {
  getSessionHistory,
  saveSessionHistory,
  addSession,
  removeSession,
  updateSessionName,
  syncSessionHistory,
  clearHistory,
} from '../services/sessionHistoryService';

// ── firebase mocks ─────────────────────────────────────────────────────

vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => path),
  set: vi.fn(() => Promise.resolve()),
  get: vi.fn(() => Promise.resolve({ exists: () => false })),
}));

vi.mock('../../../services/firebase', () => ({
  getAuthInstance: vi.fn(() => ({ currentUser: { uid: 'u1' } })),
  getDatabaseInstance: vi.fn(() => ({})),
}));

// ── localStorage mock ──────────────────────────────────────────────────

let store = {};
beforeEach(() => {
  store = {};
  vi.clearAllMocks();
  vi.mocked(set).mockResolvedValue();
  vi.mocked(get).mockResolvedValue({ exists: () => false });
  vi.mocked(getAuthInstance).mockReturnValue({ currentUser: { uid: 'u1' } });
  vi.mocked(getDatabaseInstance).mockReturnValue({});
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

const snapshot = (value) => ({
  exists: () => value !== undefined && value !== null,
  val: () => value,
});

// ── Tests ──────────────────────────────────────────────────────────────

describe('sessionHistoryService', () => {
  describe('getSessionHistory', () => {
    it('returns empty array when nothing stored', () => {
      expect(getSessionHistory()).toEqual([]);
    });

    it('returns parsed sessions from localStorage', () => {
      const sessions = [{ id: '1', date: '2025-01-01', duration: 300, name: 'Test', exercises: [] }];
      store['oneup_session_history'] = JSON.stringify(sessions);
      expect(getSessionHistory()).toEqual(sessions);
    });

    it('returns empty array on corrupted JSON', () => {
      store['oneup_session_history'] = 'not-json';
      expect(getSessionHistory()).toEqual([]);
    });

    it('returns empty array when stored value is not an array', () => {
      store['oneup_session_history'] = JSON.stringify({ foo: 'bar' });
      expect(getSessionHistory()).toEqual([]);
    });
  });

  describe('saveSessionHistory', () => {
    it('saves sessions to localStorage', () => {
      const sessions = [{ id: '1', date: '2025-01-01', duration: 300, name: 'Test', exercises: [] }];
      saveSessionHistory(sessions);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'oneup_session_history',
        JSON.stringify(sessions)
      );
    });

    it('trims to MAX_SESSIONS (20)', () => {
      const sessions = Array.from({ length: 25 }, (_, i) => ({
        id: String(i), date: '2025-01-01', duration: 300, name: `S${i}`, exercises: [],
      }));
      saveSessionHistory(sessions);
      const saved = JSON.parse(store['oneup_session_history']);
      expect(saved).toHaveLength(20);
      expect(saved[0].id).toBe('0');
      expect(saved[19].id).toBe('19');
    });
  });

  describe('addSession', () => {
    it('creates a session with generated id', () => {
      const session = addSession({
        date: '2025-06-15T10:00:00Z',
        duration: 600,
        name: 'Full Body',
        type: 'bodyweight',
        exercises: [{ id: 'pushups', label: 'Pompes', reps: 20, color: '#818cf8' }],
      });

      expect(session.id).toBeDefined();
      expect(session.date).toBe('2025-06-15T10:00:00Z');
      expect(session.duration).toBe(600);
      expect(session.name).toBe('Full Body');
      expect(session.exercises).toHaveLength(1);
      expect(session.exercises[0].id).toBe('pushups');
    });

    it('prepends new session to history', () => {
      const first = addSession({ name: 'First', duration: 300, exercises: [] });
      const second = addSession({ name: 'Second', duration: 400, exercises: [] });

      const history = getSessionHistory();
      expect(history[0].id).toBe(second.id);
      expect(history[1].id).toBe(first.id);
    });

    it('uses defaults for missing fields', () => {
      const session = addSession({});
      expect(session.duration).toBe(0);
      expect(session.name).toBe('');
      expect(session.type).toBe('bodyweight');
      expect(session.exercises).toEqual([]);
      expect(session.date).toBeDefined();
    });

    it('fills exercise field fallbacks (label←id, reps←goal, default color, weight kept)', () => {
      const session = addSession({
        exercises: [{ id: 'squats', goal: 15, weight: 40 }], // no label, no reps, no color
      });
      const ex = session.exercises[0];
      expect(ex.label).toBe('squats');   // label ← id
      expect(ex.reps).toBe(15);          // reps ← goal
      expect(ex.color).toBe('#818cf8');  // default color
      expect(ex.type).toBe('counter');   // default type
      expect(ex.weight).toBe(40);        // weight preserved
    });

    it('defaults reps to 0 and omits weight when absent', () => {
      const session = addSession({ exercises: [{ id: 'plank' }] });
      const ex = session.exercises[0];
      expect(ex.reps).toBe(0);
      expect(ex.weight).toBeUndefined();
    });
  });

  describe('removeSession', () => {
    it('removes a session by id', () => {
      addSession({ name: 'A', duration: 100, exercises: [] });
      const s2 = addSession({ name: 'B', duration: 200, exercises: [] });
      addSession({ name: 'C', duration: 300, exercises: [] });

      const result = removeSession(s2.id);
      expect(result).toHaveLength(2);
      expect(result.find(s => s.id === s2.id)).toBeUndefined();
    });
  });

  describe('updateSessionName', () => {
    it('renames an existing session and bumps updatedAt', () => {
      const s = addSession({ name: 'Old', duration: 100, exercises: [] });
      const before = getSessionHistory()[0].updatedAt;

      const result = updateSessionName(s.id, 'New name');
      const updated = result.find(x => x.id === s.id);

      expect(updated.name).toBe('New name');
      expect(updated.updatedAt).toBeDefined();
      // updatedAt is refreshed (>= the original timestamp)
      expect(new Date(updated.updatedAt).getTime())
        .toBeGreaterThanOrEqual(new Date(before).getTime());
    });

    it('is a no-op for an unknown session id', () => {
      addSession({ name: 'A', duration: 100, exercises: [] });
      const result = updateSessionName('does-not-exist', 'X');
      expect(result.find(s => s.name === 'X')).toBeUndefined();
    });
  });

  describe('syncSessionHistory', () => {
    it('returns local history and pushes it up when cloud is empty', async () => {
      const local = [{ id: '1', date: '2025-01-01', name: 'Local' }];
      store['oneup_session_history'] = JSON.stringify(local);
      vi.mocked(get).mockResolvedValueOnce(snapshot(null)); // cloud empty

      const result = await syncSessionHistory();

      expect(result).toEqual(local);
      expect(set).toHaveBeenCalled(); // local uploaded to cloud
    });

    it('merges cloud and local by id, sorted by date descending', async () => {
      const local = [{ id: 'a', date: '2025-01-01', name: 'LocalA' }];
      const cloud = [{ id: 'b', date: '2025-02-01', name: 'CloudB' }];
      store['oneup_session_history'] = JSON.stringify(local);
      vi.mocked(get).mockResolvedValueOnce(snapshot(cloud));

      const result = await syncSessionHistory();

      expect(result.map(s => s.id)).toEqual(['b', 'a']); // newest date first
      expect(result).toHaveLength(2);
    });

    it('prefers the more recently updated copy on id conflict', async () => {
      const local = [{ id: 'x', date: '2025-01-01', updatedAt: '2025-03-10', name: 'NewerLocal' }];
      const cloud = [{ id: 'x', date: '2025-01-01', updatedAt: '2025-01-05', name: 'OlderCloud' }];
      store['oneup_session_history'] = JSON.stringify(local);
      vi.mocked(get).mockResolvedValueOnce(snapshot(cloud));

      const result = await syncSessionHistory();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('NewerLocal');
    });

    it('returns [] gracefully when not signed in and no local history', async () => {
      vi.mocked(getAuthInstance).mockReturnValue({ currentUser: null });
      const result = await syncSessionHistory();
      expect(result).toEqual([]);
    });

    it('keeps the cloud copy when the local copy is older on conflict', async () => {
      const local = [{ id: 'x', date: '2025-01-01', updatedAt: '2025-01-02', name: 'OlderLocal' }];
      const cloud = [{ id: 'x', date: '2025-01-01', updatedAt: '2025-03-01', name: 'NewerCloud' }];
      store['oneup_session_history'] = JSON.stringify(local);
      vi.mocked(get).mockResolvedValueOnce(snapshot(cloud));
      const result = await syncSessionHistory();
      expect(result[0].name).toBe('NewerCloud');
    });

    it('falls back to date when updatedAt is missing on conflict', async () => {
      const local = [{ id: 'x', date: '2025-05-01', name: 'LocalByDate' }]; // no updatedAt
      const cloud = [{ id: 'x', date: '2025-01-01', name: 'CloudByDate' }]; // no updatedAt
      store['oneup_session_history'] = JSON.stringify(local);
      vi.mocked(get).mockResolvedValueOnce(snapshot(cloud));
      const result = await syncSessionHistory();
      expect(result[0].name).toBe('LocalByDate'); // newer date → local wins
    });

    it('treats a non-array cloud payload as empty', async () => {
      store['oneup_session_history'] = JSON.stringify([{ id: 'L', date: '2025-01-01' }]);
      vi.mocked(get).mockResolvedValueOnce(snapshot({ not: 'an array' }));
      const result = await syncSessionHistory();
      expect(result.map(s => s.id)).toEqual(['L']);
    });

    it('skips cloud entirely when there is no database instance', async () => {
      vi.mocked(getDatabaseInstance).mockReturnValue(null);
      store['oneup_session_history'] = JSON.stringify([{ id: 'L', date: '2025-01-01' }]);
      const result = await syncSessionHistory();
      expect(result.map(s => s.id)).toEqual(['L']);
    });
  });

  describe('clearHistory', () => {
    it('removes all sessions from localStorage', () => {
      addSession({ name: 'A', duration: 100, exercises: [] });
      clearHistory();
      expect(localStorage.removeItem).toHaveBeenCalledWith('oneup_session_history');
    });
  });
});
