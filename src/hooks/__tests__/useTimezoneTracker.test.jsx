import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTimezoneTracker } from '../useTimezoneTracker';

const mockUpdateSettings = vi.fn();
let mockTimezone = 'UTC';

vi.mock('@store/useSettingsStore', () => ({
    useSettingsStore: (selector) => selector({
        settings: { timezone: mockTimezone },
        updateSettings: mockUpdateSettings
    })
}));

describe('useTimezoneTracker', () => {
    let originalIntl;

    beforeEach(() => {
        vi.clearAllMocks();
        mockTimezone = 'UTC';
        
        originalIntl = globalThis.Intl;
        globalThis.Intl = {
            DateTimeFormat: () => ({
                resolvedOptions: () => ({
                    timeZone: 'America/New_York'
                })
            })
        };
    });

    afterEach(() => {
        globalThis.Intl = originalIntl;
    });

    it('updates settings if device timezone differs from stored timezone', () => {
        mockTimezone = 'UTC';
        renderHook(() => useTimezoneTracker());
        
        expect(mockUpdateSettings).toHaveBeenCalledWith({ timezone: 'America/New_York' });
    });

    it('does not update settings if device timezone matches stored timezone', () => {
        mockTimezone = 'America/New_York';
        renderHook(() => useTimezoneTracker());
        
        expect(mockUpdateSettings).not.toHaveBeenCalled();
    });

    it('handles Intl API errors gracefully', () => {
        globalThis.Intl = {
            DateTimeFormat: () => { throw new Error('API not supported'); }
        };
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        renderHook(() => useTimezoneTracker());
        
        expect(consoleSpy).toHaveBeenCalled();
        expect(mockUpdateSettings).not.toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    });
});
