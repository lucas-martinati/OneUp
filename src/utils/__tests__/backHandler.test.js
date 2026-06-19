import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerBackHandler, runBackHandler } from '../backHandler';

describe('backHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.clearAllMocks();
    });

    it('returns false when stack is empty', () => {
        expect(runBackHandler()).toBe(false);
    });

    it('returns true when a handler is registered and run', () => {
        const mockHandler = vi.fn(() => true);
        const unreg = registerBackHandler(mockHandler);
        
        try {
            expect(runBackHandler()).toBe(true);
            expect(mockHandler).toHaveBeenCalledOnce();
        } finally {
            unreg();
        }
    });

    it('executes handlers in LIFO order (stack)', () => {
        const order = [];
        
        const handler1 = vi.fn(() => {
            order.push(1);
            return true;
        });
        const handler2 = vi.fn(() => {
            order.push(2);
            return true;
        });

        const unreg1 = registerBackHandler(handler1);
        const unreg2 = registerBackHandler(handler2);

        try {
            expect(runBackHandler()).toBe(true);
            expect(order).toEqual([2]); // Only the top one should run and return true

            // Now if handler2 returns false, it should fall through to handler1
            handler2.mockImplementation(() => {
                order.push(2);
                return false;
            });
            order.length = 0; // reset
            
            expect(runBackHandler()).toBe(true);
            expect(order).toEqual([2, 1]); // Both ran, but 1 handled it
        } finally {
            unreg1();
            unreg2();
        }
    });

    it('unregisters a handler correctly', () => {
        const mockHandler = vi.fn(() => true);
        const unregister = registerBackHandler(mockHandler);
        
        unregister();
        
        expect(runBackHandler()).toBe(false);
        expect(mockHandler).not.toHaveBeenCalled();
    });

    it('handles double unregister safely', () => {
        const mockHandler = vi.fn(() => true);
        const unregister = registerBackHandler(mockHandler);
        
        unregister();
        unregister(); // Should not throw
        
        expect(runBackHandler()).toBe(false);
    });

    it('catches errors in handlers silently and returns true', () => {
        const throwingHandler = vi.fn(() => {
            throw new Error('Boom');
        });
        
        const unregister = registerBackHandler(throwingHandler);
        
        // Suppress console.warn for this test
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        try {
            expect(runBackHandler()).toBe(true);
            expect(consoleWarnSpy).toHaveBeenCalled();
        } finally {
            consoleWarnSpy.mockRestore();
            unregister();
        }
    });

    it('ignores invalid handlers gracefully', () => {
        const unregister = registerBackHandler(null);
        expect(runBackHandler()).toBe(false);
        unregister();
    });
});
