import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('firebase/database', () => ({
  ref: vi.fn((db, path) => ({ path })),
  get: vi.fn(),
  set: vi.fn(() => Promise.resolve()),
}));
vi.mock('@services/firebase', () => ({ getDatabaseInstance: vi.fn(() => ({ db: true })) }));
vi.mock('@services/adminService', () => ({
  fetchAllUsersData: vi.fn(),
  updateUserProfile: vi.fn(() => Promise.resolve()),
  updateUserSettings: vi.fn(() => Promise.resolve()),
  updateUserProgress: vi.fn(() => Promise.resolve()),
  updateUserPurchase: vi.fn(() => Promise.resolve()),
  saveUserData: vi.fn(() => Promise.resolve()),
  resetUserProgress: vi.fn(() => Promise.resolve()),
  deleteUserData: vi.fn(() => Promise.resolve()),
}));

import { get } from 'firebase/database';
import * as admin from '@services/adminService';
import { useAdminPanel, FILTER_OPTIONS } from '../useAdminPanel';

const USERS = {
  alice: {
    profile: { email: 'alice@x.com', displayName: 'Alice', photoURL: 'p', lastSeen: '2024-06-10T10:00:00Z' },
    settings: { leaderboardEnabled: true, soundsEnabled: true, appTheme: 'dark' },
    purchase: { isPro: true, isSupporter: false },
    progress: { completions: { '2024-06-01': {} }, isSetup: true, startDate: '2024-01-01' },
  },
  bob: {
    profile: { email: 'bob@y.com', displayName: 'Bob', photoURL: null, lastSeen: '2024-06-12T10:00:00Z' },
    settings: {},
    purchase: {},
    progress: { completions: {}, isSetup: false },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  admin.fetchAllUsersData.mockResolvedValue(structuredClone(USERS));
  vi.mocked(get).mockResolvedValue({ exists: () => true, val: () => ({ alice: { totalReps: 100, pseudo: 'AliceLB' } }) });
});

async function ready() {
  const view = renderHook(() => useAdminPanel());
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

describe('loadData', () => {
  it('loads users and the leaderboard fallback', async () => {
    const { result } = await ready();
    expect(result.current.filteredUsers).toHaveLength(2);
    expect(result.current.filteredUsers.find(u => u.uid === 'alice').totalReps).toBe(100);
  });

  it('surfaces an error message when fetching fails', async () => {
    admin.fetchAllUsersData.mockRejectedValue(new Error('denied'));
    const { result } = await ready();
    expect(result.current.message).toEqual({ type: 'error', text: expect.stringContaining('Erreur') });
  });

  it('refresh reloads', async () => {
    const { result } = await ready();
    admin.fetchAllUsersData.mockClear();
    await act(async () => { await result.current.loadData(true); });
    expect(admin.fetchAllUsersData).toHaveBeenCalled();
  });
});

describe('search / sort / filters', () => {
  it('filters by search query', async () => {
    const { result } = await ready();
    act(() => result.current.setSearchQuery('bob'));
    await waitFor(() => expect(result.current.filteredUsers).toHaveLength(1));
    expect(result.current.filteredUsers[0].uid).toBe('bob');
  });

  it('cycles sort direction and switches sort key', async () => {
    const { result } = await ready();
    act(() => result.current.cycleSort('name'));
    expect(result.current.sortBy).toBe('name');
    expect(result.current.filteredUsers[0].displayName).toBe('Alice');
    act(() => result.current.cycleSort('name')); // same key → reverse
    expect(result.current.sortReversed).toBe(true);
    expect(result.current.filteredUsers[0].displayName).toBe('Bob');
  });

  it('applies and clears mutually-exclusive filters', async () => {
    const { result } = await ready();
    act(() => result.current.toggleFilter('pro'));
    await waitFor(() => expect(result.current.filteredUsers).toHaveLength(1));
    expect(result.current.filteredUsers[0].uid).toBe('alice');
    act(() => result.current.toggleFilter('setup_no'));
    // alice is pro+setup → filtered out by setup_no
    await waitFor(() => expect(result.current.filteredUsers).toHaveLength(0));
    act(() => result.current.clearFilters());
    await waitFor(() => expect(result.current.filteredUsers).toHaveLength(2));
    expect(FILTER_OPTIONS.length).toBeGreaterThan(0);
  });
});

describe('selection & form save', () => {
  it('selects a user and populates the form + json contents', async () => {
    const { result } = await ready();
    const alice = result.current.filteredUsers.find(u => u.uid === 'alice');
    act(() => result.current.handleSelectUser(alice));
    expect(result.current.selectedUid).toBe('alice');
    expect(result.current.formState.email).toBe('alice@x.com');
    expect(result.current.selectedUserKeys).toContain('__full__');
    expect(result.current.selectedMeta.uid).toBe('alice');
  });

  it('saves the form through the admin service', async () => {
    const { result } = await ready();
    const alice = result.current.filteredUsers.find(u => u.uid === 'alice');
    act(() => result.current.handleSelectUser(alice));
    await act(async () => { await result.current.handleSaveForm(); });
    expect(admin.updateUserProfile).toHaveBeenCalled();
    expect(admin.updateUserPurchase).toHaveBeenCalled();
    expect(result.current.message.type).toBe('success');
  });

  it('reports an error when a form save fails', async () => {
    admin.updateUserProfile.mockRejectedValueOnce(new Error('nope'));
    const { result } = await ready();
    act(() => result.current.handleSelectUser(result.current.filteredUsers[0]));
    await act(async () => { await result.current.handleSaveForm(); });
    expect(result.current.message.type).toBe('error');
  });
});

describe('JSON section editing', () => {
  it('tracks dirty state, validates and formats JSON', async () => {
    const { result } = await ready();
    act(() => result.current.handleSelectUser(result.current.filteredUsers.find(u => u.uid === 'alice')));
    // valid edit → dirty true
    act(() => result.current.handleKeyJsonChange('settings', '{"appTheme":"neon"}'));
    expect(result.current.keyJsonDirty.settings).toBe(true);
    expect(result.current.keyJsonErrors.settings).toBeNull();
    // invalid edit → error + dirty
    act(() => result.current.handleKeyJsonChange('settings', '{bad'));
    expect(result.current.keyJsonErrors.settings).toBeTruthy();
    // format an invalid value keeps an error
    act(() => result.current.handleFormatKeyJson('settings'));
    expect(result.current.keyJsonErrors.settings).toBeTruthy();
    // revert restores the baseline & clears the error
    act(() => result.current.handleRevertKeyJson('settings'));
    expect(result.current.keyJsonErrors.settings).toBeNull();
  });

  it('toggles accordion expansion', async () => {
    const { result } = await ready();
    act(() => result.current.toggleKeyAccordion('profile'));
    expect(result.current.expandedKeys.profile).toBe(true);
  });

  it('saves a sub-key section and stamps progress', async () => {
    const { result } = await ready();
    act(() => result.current.handleSelectUser(result.current.filteredUsers.find(u => u.uid === 'alice')));
    act(() => result.current.handleKeyJsonChange('progress', '{"isSetup":true}'));
    await act(async () => { await result.current.handleSaveKeyJson('progress'); });
    expect(result.current.message.type).toBe('success');
    const saved = JSON.parse(result.current.keyJsonContents.progress);
    expect(saved.lastCompletionChange).toBeTruthy();
  });

  it('saves the full document via saveUserData', async () => {
    const { result } = await ready();
    act(() => result.current.handleSelectUser(result.current.filteredUsers.find(u => u.uid === 'alice')));
    act(() => result.current.handleKeyJsonChange('__full__', JSON.stringify({ profile: { email: 'new@x' }, progress: {} })));
    await act(async () => { await result.current.handleSaveKeyJson('__full__'); });
    expect(admin.saveUserData).toHaveBeenCalledWith('alice', expect.objectContaining({ profile: { email: 'new@x' } }));
  });
});

describe('danger actions', () => {
  it('resets progress', async () => {
    const { result } = await ready();
    act(() => result.current.handleSelectUser(result.current.filteredUsers.find(u => u.uid === 'alice')));
    await act(async () => { await result.current.handleResetProgress(); });
    expect(admin.resetUserProgress).toHaveBeenCalledWith('alice');
    expect(result.current.message.type).toBe('success');
  });

  it('deletes the user record and clears the selection', async () => {
    const { result } = await ready();
    act(() => result.current.handleSelectUser(result.current.filteredUsers.find(u => u.uid === 'alice')));
    await act(async () => { await result.current.handleDeleteUser(); });
    expect(admin.deleteUserData).toHaveBeenCalledWith('alice');
    expect(result.current.selectedUid).toBeNull();
    expect(result.current.filteredUsers.find(u => u.uid === 'alice')).toBeUndefined();
  });
});
