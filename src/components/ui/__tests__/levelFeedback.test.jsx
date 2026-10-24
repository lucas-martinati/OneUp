import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, renderHook, fireEvent } from '@testing-library/react';
import { useTweenedNumber } from '@hooks/useTweenedNumber';
import { LevelRing } from '../LevelRing';
import { haptics } from '@utils/hapticsManager';
import { NextLevelHint } from '@components/exercises/NextLevelHint';

// React detects animation event support while loading; jsdom omits this constructor.
vi.hoisted(() => { window.AnimationEvent ||= window.Event; });

vi.mock('@utils/hapticsManager', () => ({ haptics: { light: vi.fn() } }));

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key, values) => `${key} ${JSON.stringify(values || {})}` }) }));

beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', callback => setTimeout(() => callback(performance.now()), 16));
    vi.stubGlobal('cancelAnimationFrame', clearTimeout);
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('exercise level feedback', () => {
    it('tweens from the displayed value through rapid updates and resets', () => {
        const { result, rerender } = renderHook(({ value }) => useTweenedNumber(value), { initialProps: { value: 0 } });
        rerender({ value: 10 });
        act(() => vi.advanceTimersByTime(100));
        expect(result.current).toBeGreaterThan(0);
        expect(result.current).toBeLessThan(10);
        const intermediate = result.current;
        rerender({ value: 30 });
        expect(result.current).toBe(intermediate);
        act(() => vi.advanceTimersByTime(500));
        expect(result.current).toBe(30);
        rerender({ value: 0 });
        act(() => vi.advanceTimersByTime(500));
        expect(result.current).toBe(0);
    });

    it('updates immediately with reduced motion and cancels frames on unmount', () => {
        vi.stubGlobal('matchMedia', () => ({ matches: true }));
        const { result, rerender, unmount } = renderHook(({ value }) => useTweenedNumber(value), { initialProps: { value: 5 } });
        rerender({ value: 20 });
        expect(result.current).toBe(20);
        unmount();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('celebrates increases only, never opening an existing level or resetting', () => {
        const { container, rerender } = render(<LevelRing count={20} goal={100} celebrate />);
        expect(container.querySelector('circle')).toBeNull();
        rerender(<LevelRing count={50} goal={100} celebrate />);
        act(() => vi.advanceTimersByTime(16));
        expect(container.querySelector('circle')).toBeTruthy();
        expect(haptics.light).not.toHaveBeenCalled();
        fireEvent.animationStart(container.querySelector('circle'));
        expect(haptics.light).toHaveBeenCalledTimes(1);
        expect(container.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('5');
        act(() => vi.advanceTimersByTime(1200));
        expect(container.querySelector('circle')).toBeNull();
        rerender(<LevelRing count={0} goal={100} celebrate />);
        act(() => vi.advanceTimersByTime(16));
        expect(container.querySelector('circle')).toBeNull();
    });

    it('does not repeat feedback for the same level after rerenders or corrections', () => {
        const { container, rerender } = render(<LevelRing count={0} goal={100} celebrate />);
        rerender(<LevelRing count={10} goal={100} celebrate />);
        act(() => vi.advanceTimersByTime(16));
        fireEvent.animationStart(container.querySelector('circle'));
        rerender(<LevelRing count={15} goal={100} celebrate />);
        rerender(<LevelRing count={5} goal={100} celebrate />);
        act(() => vi.advanceTimersByTime(16));
        rerender(<LevelRing count={10} goal={100} celebrate />);
        act(() => vi.advanceTimersByTime(16));
        expect(haptics.light).toHaveBeenCalledTimes(1);
        rerender(<LevelRing count={20} goal={100} celebrate />);
        act(() => vi.advanceTimersByTime(16));
        fireEvent.animationStart(container.querySelector('circle'));
        expect(haptics.light).toHaveBeenCalledTimes(2);
    });

    it('shows the next reachable level for rounded goals and a completed state at ten', () => {
        const { container, rerender } = render(<NextLevelHint count={0} goal={3} />);
        expect(container.textContent).toContain('"count":1,"level":3');
        rerender(<NextLevelHint count={19} goal={200} isTimer />);
        expect(container.textContent).toContain('levels.nextTime');
        expect(container.textContent).toContain('"level":1');
        rerender(<NextLevelHint count={100} goal={100} />);
        expect(container.textContent).toContain('levels.complete');
        expect(container.textContent).not.toContain('levels.next');
    });
});
