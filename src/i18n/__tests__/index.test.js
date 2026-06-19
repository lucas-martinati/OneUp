import { describe, it, expect, vi } from 'vitest';
import i18n from '../index.js';

vi.mock('../locales/fr.json', () => Promise.reject(new Error('Network error')));

describe('i18n backend', () => {
    it('handles import errors in lazyLoadBackend', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const callback = vi.fn();
        
        i18n.services.backendConnector.backend.read('fr', 'translation', callback);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledWith(expect.any(Error), null);

        consoleErrorSpy.mockRestore();
    });

    it('handles successful imports in lazyLoadBackend', async () => {
        const callback = vi.fn();
        
        // 'invalid-lang' will resolve to 'en', which is not mocked to reject
        i18n.services.backendConnector.backend.read('invalid-lang', 'translation', callback);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(callback).toHaveBeenCalledWith(null, expect.any(Object));
    });
});
