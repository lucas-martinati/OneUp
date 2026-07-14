import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { StreakFreezeInfo } from '../StreakFreezeInfo';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

const mockOpenStore = vi.fn();
vi.mock('@store/useUIStore', () => ({
    useUIStore: (selector) => selector({ openStore: mockOpenStore }),
}));

vi.mock('@store/useProgressStore', () => ({
    useProgressStore: (selector) => selector({
        streakFreezes: { count: 2 }
    }),
}));

const mockSignIn = vi.fn();
vi.mock('@contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@contexts/SubscriptionContext', () => ({
    useSubscription: vi.fn(),
}));

vi.mock('@shared/streakFreeze', () => ({
    STREAK_FREEZE_LIMITS: {
        free: { perMonth: 1 },
        pro: { perMonth: 3 },
    },
    getFreezeLimits: vi.fn(() => ({
        perMonth: 1,
        maxStock: 2,
    })),
}));

// Mock the GoogleSignInButton since it might be complex or require auth contexts
vi.mock('@components/ui/GoogleSignInButton', () => ({
    GoogleSignInButton: ({ onClick }) => <button aria-label="Google" onClick={onClick}>Google</button>
}));

// Mock the Icons
vi.mock('@utils/icons', () => ({
    Snowflake: () => <span>Snowflake</span>,
    Crown: () => <span>Crown</span>,
    X: () => <span>X</span>,
}));

import { useAuth } from '@contexts/AuthContext';
import { useSubscription } from '@contexts/SubscriptionContext';
import { getFreezeLimits } from '@shared/streakFreeze';

describe('StreakFreezeInfo', () => {
    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        
        useAuth.mockReturnValue({
            isSignedIn: false,
            signIn: mockSignIn,
        });

        useSubscription.mockReturnValue({
            isPro: false,
        });
    });

    it('returns null if not open', () => {
        const { container } = render(<StreakFreezeInfo open={false} onClose={() => {}} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders guest view when not signed in', () => {
        const { getByRole, getByText } = render(<StreakFreezeInfo open={true} onClose={() => {}} />);
        expect(getByText('streakFreeze.title')).toBeTruthy();
        expect(getByText('streakFreeze.guestDesc')).toBeTruthy();
        expect(getByRole('button', { name: /Google/i })).toBeTruthy();
    });

    it('calls signIn when google button is clicked', () => {
        const { getByRole } = render(<StreakFreezeInfo open={true} onClose={() => {}} />);
        fireEvent.click(getByRole('button', { name: /Google/i }));
        expect(mockSignIn).toHaveBeenCalled();
    });

    it('renders user view with pro upsell when signed in as free user', () => {
        useAuth.mockReturnValue({ isSignedIn: true });
        const { getByText, getAllByText } = render(<StreakFreezeInfo open={true} onClose={() => {}} />);
        
        expect(getByText('streakFreeze.intro')).toBeTruthy();
        expect(getByText('streakFreeze.statAvailable')).toBeTruthy();
        expect(getAllByText('2').length).toBeGreaterThan(0); // freeze count from store mock

        // Upsell should be present
        expect(getByText('streakFreeze.proCta')).toBeTruthy();
    });

    it('renders user view without pro upsell when signed in as pro user', () => {
        useAuth.mockReturnValue({ isSignedIn: true });
        useSubscription.mockReturnValue({ isPro: true });
        getFreezeLimits.mockReturnValue({ perMonth: 3, maxStock: 6 });

        const { queryByText } = render(<StreakFreezeInfo open={true} onClose={() => {}} />);
        
        expect(queryByText('streakFreeze.proCta')).toBeNull();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        const { getByRole } = render(<StreakFreezeInfo open={true} onClose={onClose} />);
        
        fireEvent.click(getByRole('button', { name: 'common.close' }));
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose and opens store when upgrade button is clicked', () => {
        useAuth.mockReturnValue({ isSignedIn: true });
        const onClose = vi.fn();
        const { getByText } = render(<StreakFreezeInfo open={true} onClose={onClose} />);
        
        fireEvent.click(getByText('streakFreeze.proCta'));
        expect(onClose).toHaveBeenCalled();
        expect(mockOpenStore).toHaveBeenCalled();
    });

    it('calls onClose on Escape key press', () => {
        const onClose = vi.fn();
        render(<StreakFreezeInfo open={true} onClose={onClose} />);
        
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when clicking backdrop', () => {
        const onClose = vi.fn();
        // Since component uses createPortal, document.body is where the portal is mounted
        render(<StreakFreezeInfo open={true} onClose={onClose} />);
        const backdrop = document.querySelector('.dialog-backdrop');
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalled();
    });
});
