import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }), Trans: ({ i18nKey }) => i18nKey }));
vi.mock('@hooks/useBackHandler', () => ({ useBackHandler: vi.fn() }));
vi.mock('@hooks/useSwipe', () => ({ useSwipe: () => ({}) }));

const stores = { settings: { exerciseDifficulties: {} }, refreshUserClans: vi.fn() };
vi.mock('@store/useSettingsStore', () => ({ useSettingsStore: (s) => s({ settings: stores.settings }) }));
vi.mock('@store/useCloudSyncStore', () => ({ useCloudSyncStore: (s) => s({ refreshUserClans: stores.refreshUserClans }) }));

const auth = { isSignedIn: true, signIn: vi.fn() };
vi.mock('@contexts/AuthContext', () => ({ useAuth: () => auth }));

vi.mock('@services/cloudSync', () => ({
  cloudSync: {
    getCurrentUserId: vi.fn(() => 'me'),
    loadLeaderboard: vi.fn(() => Promise.resolve([])),
    getClanDetails: vi.fn(() => Promise.resolve({ id: 'c1', name: 'Clan One', members: [] })),
    sendPoke: vi.fn(() => Promise.resolve()),
    leaveClan: vi.fn(() => Promise.resolve({ success: true })),
  },
}));

// Stub the heavy child components so we cover Leaderboard's own orchestration.
vi.mock('../LeaderboardTabs', () => ({ LeaderboardTabs: ({ setActiveTab, showExerciseTabs }) => (
  showExerciseTabs ? <button data-testid="tab-weights" onClick={() => setActiveTab('weights')}>tabs</button> : null
) }));
vi.mock('../LeaderboardRow', () => ({ LeaderboardRow: ({ entry, onSelect, onNudge }) => (
  <div data-testid={`row-${entry.uid}`} onClick={() => onSelect(entry)}>
    <button data-testid={`nudge-${entry.uid}`} onClick={(e) => onNudge(e, entry.uid)}>nudge</button>
  </div>
) }));
vi.mock('../LeaderboardPodium', () => ({ LeaderboardPodium: ({ items, onSelect }) => (
  <div data-testid="podium">{items.map(it => <button key={it.entry.uid} data-testid={`podium-${it.entry.uid}`} onClick={() => onSelect(it.entry)}>{it.entry.uid}</button>)}</div>
) }));
vi.mock('../ClanManager', () => ({ ClanManager: ({ onClanJoined }) => <button data-testid="clan-manager" onClick={() => onClanJoined('c1')}>manager</button> }));
vi.mock('../UserDetail', () => ({ UserDetail: ({ entry, onClose }) => <div data-testid="user-detail">{entry.uid}<button data-testid="ud-close" onClick={onClose}>x</button></div> }));
vi.mock('../ClanInviteCard', () => ({ ClanInviteCard: () => <div data-testid="invite" /> }));

import { cloudSync } from '@services/cloudSync';
import { Leaderboard } from '../Leaderboard';

const ENTRIES = [
  { uid: 'me', totalReps: 500, weightsTotalReps: 0, exerciseReps: {} },
  { uid: 'u2', totalReps: 400, weightsTotalReps: 0, exerciseReps: {} },
  { uid: 'u3', totalReps: 300, weightsTotalReps: 0, exerciseReps: {} },
  { uid: 'u4', totalReps: 200, weightsTotalReps: 0, exerciseReps: {} },
  { uid: 'u5', totalReps: 200, weightsTotalReps: 0, exerciseReps: {} },
];

beforeEach(() => {
  vi.clearAllMocks();
  auth.isSignedIn = true;
  cloudSync.getCurrentUserId.mockReturnValue('me');
  cloudSync.loadLeaderboard.mockResolvedValue([]);
});
afterEach(() => cleanup());

describe('Leaderboard', () => {
  it('loads the global leaderboard and splits podium + rest', async () => {
    cloudSync.loadLeaderboard.mockResolvedValue(ENTRIES);
    const { getByTestId } = render(<Leaderboard onClose={vi.fn()} />);
    await waitFor(() => expect(getByTestId('podium')).toBeTruthy());
    // 3 in podium, 2 in the rest list
    expect(getByTestId('podium-me')).toBeTruthy();
    expect(getByTestId('row-u4')).toBeTruthy();
    expect(getByTestId('row-u5')).toBeTruthy();
  });

  it('shows the sign-in prompt when signed out with no entries', async () => {
    auth.isSignedIn = false;
    const { getByText } = render(<Leaderboard onClose={vi.fn()} />);
    await waitFor(() => expect(getByText('leaderboard.signInTitle')).toBeTruthy());
  });

  it('shows the empty hint when signed in with no entries', async () => {
    const { getByText } = render(<Leaderboard onClose={vi.fn()} />);
    await waitFor(() => expect(getByText('leaderboard.empty')).toBeTruthy());
  });

  it('opens user detail when a row is selected and closes it', async () => {
    cloudSync.loadLeaderboard.mockResolvedValue(ENTRIES);
    const { getByTestId, queryByTestId } = render(<Leaderboard onClose={vi.fn()} />);
    await waitFor(() => getByTestId('row-u4'));
    fireEvent.click(getByTestId('row-u4'));
    expect(getByTestId('user-detail')).toBeTruthy();
    fireEvent.click(getByTestId('ud-close'));
    expect(queryByTestId('user-detail')).toBeNull();
  });

  it('sends a poke when a member is nudged', async () => {
    cloudSync.loadLeaderboard.mockResolvedValue(ENTRIES);
    const { getByTestId } = render(<Leaderboard onClose={vi.fn()} />);
    await waitFor(() => getByTestId('nudge-u4'));
    fireEvent.click(getByTestId('nudge-u4'));
    await waitFor(() => expect(cloudSync.sendPoke).toHaveBeenCalledWith('u4', 'nudge', expect.any(String)));
  });

  it('switches to the clans context and renders the manager', async () => {
    const { getByText, getByTestId } = render(<Leaderboard onClose={vi.fn()} />);
    // SegmentedControl toggle (2 options) → click switches to clans/manage
    fireEvent.click(getByText('clan.title'));
    await waitFor(() => expect(getByTestId('clan-manager')).toBeTruthy());
  });

  it('loads a clan when opened with initial clan data and can leave it', async () => {
    const onLeaveClan = vi.fn();
    cloudSync.getClanDetails.mockResolvedValue({ id: 'c1', name: 'Clan One', members: ENTRIES });
    const { getByText, getAllByText, getByTestId } = render(
      <Leaderboard onClose={vi.fn()} initialClanData={{ id: 'c1', name: 'Clan One' }} onLeaveClan={onLeaveClan} />
    );
    await waitFor(() => getByTestId('row-u4'));
    fireEvent.click(getByText('leaderboard.leaveClan')); // footer → opens confirm
    // Footer + confirm now share the label; the confirm button is the last one.
    const leaveButtons = getAllByText('leaderboard.leaveClan');
    fireEvent.click(leaveButtons[leaveButtons.length - 1]);
    await waitFor(() => expect(cloudSync.leaveClan).toHaveBeenCalledWith('c1'));
    expect(onLeaveClan).toHaveBeenCalled();
  });
});
