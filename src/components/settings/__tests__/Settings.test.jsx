import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Settings } from '../Settings';

// Mock contexts & stores
vi.mock('@contexts/AuthContext', () => ({
    useAuth: () => ({ isSignedIn: false, user: null })
}));

vi.mock('@store/useSettingsStore', () => ({
    useSettingsStore: (selector) => selector({
        settings: {
            notificationsEnabled: false,
            soundsEnabled: true,
            hapticsEnabled: true,
            keepScreenOn: true,
            performanceMode: 'high',
            leaderboardEnabled: false,
            appTheme: 'dark'
        },
        updateSettings: vi.fn()
    })
}));

vi.mock('@store/useCloudSyncStore', () => ({
    useCloudSyncStore: (selector) => selector({ conflictData: null })
}));

vi.mock('@store/useProgressStore', () => ({
    useProgressStore: (selector) => selector({ isDayDone: () => false, getDayNumber: () => 1 })
}));

vi.mock('@hooks/useNotificationManager', () => ({
    useNotificationManager: () => ({ scheduleNotification: vi.fn() })
}));

vi.mock('@contexts/SubscriptionContext', () => ({
    useSubscription: () => ({ isPro: false })
}));

vi.mock('@hooks/useBackHandler', () => ({
    useBackHandler: vi.fn()
}));

vi.mock('@hooks/useExerciseConfig', () => ({
    useExerciseConfig: () => ({
        getConfig: () => ({ difficulty: 1 }),
        updateConfig: vi.fn()
    })
}));

describe('Settings component', () => {
    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders all settings sections in single view', () => {
        const { getByText } = render(<Settings onClose={vi.fn()} />);

        expect(getByText('Preferences')).toBeTruthy();
        expect(getByText('Graphics Mode')).toBeTruthy();
        expect(getByText('Leaderboard')).toBeTruthy();
        expect(getByText('Difficulty')).toBeTruthy();
    });
});
