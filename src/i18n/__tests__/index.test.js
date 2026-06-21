import { describe, it, expect, vi } from 'vitest';
import i18n from '../index.js';

vi.mock('../locales/fr.json', () => Promise.reject(new Error('Network error')));

describe('i18n backend', () => {
    it('handles import errors in lazyLoadBackend', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const callback = vi.fn();

        i18n.services.backendConnector.backend.read('fr', 'translation', callback);

        // Poll until the async dynamic import settles instead of racing a fixed
        // timeout (the 100ms wait was flaky under parallel load).
        await vi.waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledWith(expect.any(Error), null);
        });

        consoleErrorSpy.mockRestore();
    });

    it('handles successful imports in lazyLoadBackend', async () => {
        const callback = vi.fn();

        // 'invalid-lang' will resolve to 'en', which is not mocked to reject
        i18n.services.backendConnector.backend.read('invalid-lang', 'translation', callback);

        await vi.waitFor(() => {
            expect(callback).toHaveBeenCalledWith(null, expect.any(Object));
        });
    });
});
