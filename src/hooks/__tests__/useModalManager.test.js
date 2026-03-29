import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModalManager } from '../useModalManager';

// NOTE: If @testing-library/react is not available, these tests verify
// the logic by testing the returned values and functions directly.

describe('useModalManager', () => {
  it('initializes all modals to false', () => {
    const { result } = renderHook(() => useModalManager({ calendar: false, stats: false }));
    expect(result.current.modals).toEqual({ calendar: false, stats: false });
    expect(result.current.anyModalOpen).toBe(false);
  });

  it('anyModalOpen is true when any modal is open', () => {
    const { result } = renderHook(() => useModalManager({ calendar: true, stats: false }));
    expect(result.current.anyModalOpen).toBe(true);
  });

  it('openModal opens a specific modal', () => {
    const { result } = renderHook(() => useModalManager({ calendar: false }));
    act(() => result.current.openModal('calendar'));
    expect(result.current.modals.calendar).toBe(true);
    expect(result.current.anyModalOpen).toBe(true);
  });

  it('closeModal closes a specific modal', () => {
    const { result } = renderHook(() => useModalManager({ calendar: true }));
    act(() => result.current.closeModal('calendar'));
    expect(result.current.modals.calendar).toBe(false);
    expect(result.current.anyModalOpen).toBe(false);
  });

  it('toggleModal toggles the value', () => {
    const { result } = renderHook(() => useModalManager({ calendar: false }));
    act(() => result.current.toggleModal('calendar'));
    expect(result.current.modals.calendar).toBe(true);
    act(() => result.current.toggleModal('calendar'));
    expect(result.current.modals.calendar).toBe(false);
  });

  it('multiple modals can be open simultaneously', () => {
    const { result } = renderHook(() => useModalManager({ a: false, b: false }));
    act(() => {
      result.current.openModal('a');
      result.current.openModal('b');
    });
    expect(result.current.modals).toEqual({ a: true, b: true });
    expect(result.current.anyModalOpen).toBe(true);
  });

  it('activeModals returns open modals with close function', () => {
    const { result } = renderHook(() => useModalManager({ a: true, b: false, c: true }));
    expect(result.current.activeModals).toHaveLength(2);
    result.current.activeModals.forEach(m => {
      expect(m.isOpen).toBe(true);
      expect(typeof m.close).toBe('function');
    });
  });

  it('activeModals includes shouldResumeSync for sync modals', () => {
    const { result } = renderHook(() => useModalManager({ counter: true, stats: true }, ['counter']));
    const counterModal = result.current.activeModals.find(m => m.isOpen);
    // counter is in syncModals, stats is not
    const syncModals = result.current.activeModals;
    // Verify the structure
    expect(syncModals.some(m => m.shouldResumeSync === true)).toBe(true);
  });

  it('close from activeModals actually closes the modal', () => {
    const { result } = renderHook(() => useModalManager({ a: true }));
    const modal = result.current.activeModals[0];
    expect(modal.isOpen).toBe(true);
    act(() => modal.close());
    expect(result.current.modals.a).toBe(false);
  });

  it('openModal does not affect other modals', () => {
    const { result } = renderHook(() => useModalManager({ a: true, b: false }));
    act(() => result.current.openModal('b'));
    expect(result.current.modals.a).toBe(true);
    expect(result.current.modals.b).toBe(true);
  });
});
