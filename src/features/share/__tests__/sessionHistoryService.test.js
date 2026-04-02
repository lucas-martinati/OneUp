import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSessionHistory,
  saveSessionHistory,
  addSession,
  removeSession,
  clearHistory,
} from '../services/sessionHistoryService';

// ── localStorage mock ──────────────────────────────────────────────────

let store = {};
beforeEach(() => {
  store = {};
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
  });
});
afterEach(() => {
  vi.restoreAllMocks();
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

    it('trims to MAX_SESSIONS (10)', () => {
      const sessions = Array.from({ length: 15 }, (_, i) => ({
        id: String(i), date: '2025-01-01', duration: 300, name: `S${i}`, exercises: [],
      }));
      saveSessionHistory(sessions);
      const saved = JSON.parse(store['oneup_session_history']);
      expect(saved).toHaveLength(10);
      expect(saved[0].id).toBe('0');
      expect(saved[9].id).toBe('9');
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

  describe('clearHistory', () => {
    it('removes all sessions from localStorage', () => {
      addSession({ name: 'A', duration: 100, exercises: [] });
      clearHistory();
      expect(localStorage.removeItem).toHaveBeenCalledWith('oneup_session_history');
    });
  });
});
