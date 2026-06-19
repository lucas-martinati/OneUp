import { describe, it, expect, vi } from 'vitest';

vi.mock('../locales/en.json', () => {
  throw new Error('Network error');
});

describe('i18n backend error handling', () => {
    it('handles import errors in lazyLoadBackend', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        vi.resetModules();
        const { default: i18n } = await import('../index.js');
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(consoleErrorSpy).toHaveBeenCalled();
        const errorArg = consoleErrorSpy.mock.calls.find(call => call[0].includes('Error loading language en:'));
        expect(errorArg).toBeDefined();

        consoleErrorSpy.mockRestore();
    });
});
