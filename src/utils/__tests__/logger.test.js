import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('logger', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('logs when DEV is true', async () => {
        // Since we are in test environment, DEV should be true by default
        const { createLogger } = await import('../logger.js');
        const logger = createLogger('Test');
        logger.info('test message');
        expect(console.log).toHaveBeenCalled();
        logger.error('error message');
        expect(console.error).toHaveBeenCalled();
        logger.warn('warn message');
        expect(console.log).toHaveBeenCalledTimes(2);
        logger.success('success message');
        expect(console.log).toHaveBeenCalledTimes(3);
        logger.debug('debug message');
        expect(console.log).toHaveBeenCalledTimes(4);
    });

    it('does not log when DEV is false', async () => {
        const originalDev = import.meta.env.DEV;
        // @ts-ignore
        import.meta.env.DEV = false;
        
        vi.resetModules();
        const { createLogger } = await import('../logger.js');
        const logger = createLogger('TestProd');
        
        logger.info('should not log');
        expect(console.log).not.toHaveBeenCalled();
        
        // error always logs
        logger.error('error always logs');
        expect(console.error).toHaveBeenCalled();
        
        // @ts-ignore
        import.meta.env.DEV = originalDev;
        vi.resetModules();
    });
});
