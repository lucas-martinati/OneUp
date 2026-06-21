import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => path ?? 'root'),
  set: vi.fn(() => Promise.resolve()),
  get: vi.fn(),
}));

vi.mock('../firebase', () => ({
  getAuthInstance: vi.fn(() => ({ currentUser: { uid: 'u1' } })),
  getDatabaseInstance: vi.fn(() => ({})),
}));

import { set, get } from 'firebase/database';
import { getAuthInstance, getDatabaseInstance } from '../firebase';
import {
  saveWeightEntry,
  loadWeightHistory,
  loadAllWeightHistories,
  loadLatestWeights,
} from '../weightHistoryService';

const snapshot = (val) => ({ exists: () => val != null, val: () => val });

beforeEach(() => {
  vi.clearAllMocks();
  getAuthInstance.mockReturnValue({ currentUser: { uid: 'u1' } });
  getDatabaseInstance.mockReturnValue({});
});

describe('saveWeightEntry', () => {
  it('writes the entry and returns true', async () => {
    expect(await saveWeightEntry('bench', '2026-01-01', 60)).toBe(true);
    expect(set).toHaveBeenCalledWith(expect.anything(), 60);
  });

  it('returns false when signed out', async () => {
    getAuthInstance.mockReturnValue({ currentUser: null });
    expect(await saveWeightEntry('bench', '2026-01-01', 60)).toBe(false);
  });
});

describe('loadWeightHistory', () => {
  it('returns the stored history', async () => {
    get.mockResolvedValue(snapshot({ '2026-01-01': 60 }));
    expect(await loadWeightHistory('bench')).toEqual({ '2026-01-01': 60 });
  });

  it('returns null when nothing stored', async () => {
    get.mockResolvedValue(snapshot(null));
    expect(await loadWeightHistory('bench')).toBeNull();
  });

  it('returns null when database unavailable', async () => {
    getDatabaseInstance.mockReturnValue(null);
    expect(await loadWeightHistory('bench')).toBeNull();
  });
});

describe('loadAllWeightHistories', () => {
  it('returns all histories', async () => {
    get.mockResolvedValue(snapshot({ bench: { '2026-01-01': 60 } }));
    expect(await loadAllWeightHistories()).toEqual({ bench: { '2026-01-01': 60 } });
  });

  it('returns null when empty', async () => {
    get.mockResolvedValue(snapshot(null));
    expect(await loadAllWeightHistories()).toBeNull();
  });

  it('returns null when signed out', async () => {
    getAuthInstance.mockReturnValue({ currentUser: null });
    expect(await loadAllWeightHistories()).toBeNull();
  });
});

describe('loadLatestWeights', () => {
  it('returns the snapshot of current weights', async () => {
    get.mockResolvedValue(snapshot({ bench: 60 }));
    expect(await loadLatestWeights('u2')).toEqual({ bench: 60 });
  });

  it('returns null without a uid', async () => {
    expect(await loadLatestWeights('')).toBeNull();
  });

  it('returns null when nothing stored', async () => {
    get.mockResolvedValue(snapshot(null));
    expect(await loadLatestWeights('u2')).toBeNull();
  });
});
