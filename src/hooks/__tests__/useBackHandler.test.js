import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBackHandler } from '../useBackHandler';
import * as backHandlerUtils from '@utils/backHandler';

describe('useBackHandler', () => {
    let registerSpy;

    beforeEach(() => {
        registerSpy = vi.spyOn(backHandlerUtils, 'registerBackHandler');
        registerSpy.mockClear();
    });

    it('registers the handler when enabled is true', () => {
        const handler = vi.fn();
        const unregisterMock = vi.fn();
        registerSpy.mockReturnValue(unregisterMock);

        renderHook(() => useBackHandler(handler, true));

        expect(registerSpy).toHaveBeenCalledWith(handler);
        expect(registerSpy).toHaveBeenCalledTimes(1);
    });

    it('registers the handler by default when enabled is not provided', () => {
        const handler = vi.fn();
        const unregisterMock = vi.fn();
        registerSpy.mockReturnValue(unregisterMock);

        renderHook(() => useBackHandler(handler));

        expect(registerSpy).toHaveBeenCalledWith(handler);
    });

    it('does not register the handler when enabled is false', () => {
        const handler = vi.fn();
        renderHook(() => useBackHandler(handler, false));

        expect(registerSpy).not.toHaveBeenCalled();
    });

    it('unregisters the handler on unmount', () => {
        const handler = vi.fn();
        const unregisterMock = vi.fn();
        registerSpy.mockReturnValue(unregisterMock);

        const { unmount } = renderHook(() => useBackHandler(handler, true));
        expect(unregisterMock).not.toHaveBeenCalled();

        unmount();
        expect(unregisterMock).toHaveBeenCalledTimes(1);
    });

    it('unregisters the handler when enabled changes from true to false', () => {
        const handler = vi.fn();
        const unregisterMock = vi.fn();
        registerSpy.mockReturnValue(unregisterMock);

        const { rerender } = renderHook(
            ({ enabled }) => useBackHandler(handler, enabled),
            { initialProps: { enabled: true } }
        );

        expect(registerSpy).toHaveBeenCalledTimes(1);
        expect(unregisterMock).not.toHaveBeenCalled();

        rerender({ enabled: false });
        
        expect(unregisterMock).toHaveBeenCalledTimes(1);
        expect(registerSpy).toHaveBeenCalledTimes(1); // Not called again
    });
});
