import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, act, fireEvent } from '@testing-library/react';
import { OfflineBanner } from '../OfflineBanner';
import { useNetworkStatus } from '@hooks/useNetworkStatus';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('@utils/icons', () => ({
    CloudOff: () => <span>CloudOff</span>,
    Check: () => <span>Check</span>,
}));

vi.mock('@hooks/useNetworkStatus', () => ({
    useNetworkStatus: vi.fn(),
}));

describe('OfflineBanner', () => {
    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();
        vi.useFakeTimers();
        // Default to online
        useNetworkStatus.mockReturnValue(true);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders nothing when initially online', () => {
        const { container } = render(<OfflineBanner />);
        expect(container.firstChild).toBeNull();
    });

    it('renders the offline banner when initially offline', () => {
        useNetworkStatus.mockReturnValue(false);
        const { getByText } = render(<OfflineBanner />);
        
        // Wait for requestAnimationFrame to fire
        act(() => {
            vi.runAllTimers();
        });
        
        expect(getByText('cloud.offlineMessage')).toBeTruthy();
        expect(getByText('CloudOff')).toBeTruthy();
    });

    it('transitions from online to offline', () => {
        const { getByText, rerender, container } = render(<OfflineBanner />);
        expect(container.firstChild).toBeNull();

        useNetworkStatus.mockReturnValue(false);
        rerender(<OfflineBanner />);

        act(() => {
            vi.runAllTimers();
        });

        expect(getByText('cloud.offlineMessage')).toBeTruthy();
    });

    it('transitions from offline to online and shows reconnected banner temporarily', () => {
        useNetworkStatus.mockReturnValue(false);
        const { getByText, rerender } = render(<OfflineBanner />);

        act(() => {
            vi.runAllTimers();
        });
        expect(getByText('cloud.offlineMessage')).toBeTruthy();

        // Now transition back to online
        useNetworkStatus.mockReturnValue(true);
        rerender(<OfflineBanner />);

        act(() => {
            vi.advanceTimersByTime(100);
        });

        // Should show the reconnected state
        expect(getByText('cloud.backOnline')).toBeTruthy();
        expect(getByText('Check')).toBeTruthy();

        // Fast forward past the RECONNECTED_MS (2600ms)
        act(() => {
            vi.advanceTimersByTime(2600);
        });
        
        // Simulating the transition end to unmount
        const bannerElement = getByText('cloud.backOnline').closest('div').parentElement.parentElement;
        fireEvent.transitionEnd(bannerElement, { propertyName: 'grid-template-rows' });
        
        // It shouldn't be null immediately since the render might just setMounted(false), but testing the transition logic
    });
});
