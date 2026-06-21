import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('@features/share/services/shareService', () => ({
  captureElement: vi.fn(() => Promise.resolve('data:image/png;base64,AAA')),
  shareImage: vi.fn(() => Promise.resolve({ success: true })),
  downloadImage: vi.fn(() => Promise.resolve()),
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
vi.mock('@utils/sessionNameGenerator', () => ({ generateShareTextFromSession: vi.fn(() => 'shared!') }));

import { captureElement, shareImage, downloadImage } from '@features/share/services/shareService';
import { useShareCard } from '../useShareCard';

const KEY = 'oneup_share_options';

function setup(props = {}) {
  const view = renderHook((p) => useShareCard(p), { initialProps: { sessionData: { name: 'S' }, isPro: true, ...props } });
  // Attach a fake card element to the ref so capture works.
  view.result.current.cardRef.current = { style: {} };
  return view;
}

beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });

describe('options state', () => {
  it('starts from defaults and persists changes to localStorage', () => {
    const { result } = setup();
    act(() => result.current.setOption('showDuration', false));
    expect(result.current.options.showDuration).toBe(false);
    expect(JSON.parse(localStorage.getItem(KEY)).showDuration).toBe(false);
  });

  it('setOption ignores no-op writes (same value / equal arrays)', () => {
    const { result } = setup();
    const before = result.current.options;
    act(() => result.current.setOption('showDuration', true)); // already true
    expect(result.current.options).toBe(before);
    act(() => result.current.setOption('statsCategories', [...before.statsCategories].reverse()));
    // same set → unchanged reference
    expect(result.current.options.statsCategories).toBe(before.statsCategories);
  });

  it('toggleOption flips a boolean and saves', () => {
    const { result } = setup();
    const initial = result.current.options.showStreak;
    act(() => result.current.toggleOption('showStreak'));
    expect(result.current.options.showStreak).toBe(!initial);
  });

  it('toggleCategory adds, removes, and refuses an empty selection', () => {
    const { result } = setup({ initialCategories: ['bodyweight', 'weights'] });
    act(() => result.current.toggleCategory('weights'));
    expect(result.current.options.statsCategories).toEqual(['bodyweight']);
    act(() => result.current.toggleCategory('cardio'));
    expect(result.current.options.statsCategories).toEqual(['bodyweight', 'cardio']);
    // removing down to empty is refused
    act(() => result.current.toggleCategory('bodyweight'));
    act(() => result.current.toggleCategory('cardio'));
    expect(result.current.options.statsCategories.length).toBeGreaterThan(0);
  });

  it('honours initialCategories on mount', () => {
    const { result } = setup({ initialCategories: ['custom'] });
    expect(result.current.options.statsCategories).toEqual(['custom']);
  });
});

describe('background image & crop', () => {
  it('sets and clears the background image', () => {
    const { result } = setup();
    act(() => result.current.setBackgroundImage('data:bg'));
    expect(result.current.options.backgroundImage).toBe('data:bg');
    act(() => result.current.clearBackgroundImage());
    expect(result.current.options.backgroundImage).toBeNull();
  });

  it('drives the crop modal lifecycle', () => {
    const { result } = setup();
    act(() => result.current.openCropModal('data:orig'));
    expect(result.current.isCropModalOpen).toBe(true);
    expect(result.current.originalImage).toBe('data:orig');
    act(() => result.current.applyCrop('data:cropped', { x: 0 }, 1.2));
    expect(result.current.options.backgroundImage).toBe('data:cropped');
    expect(result.current.cropData).toEqual({ crop: { x: 0 }, zoom: 1.2 });
    expect(result.current.isCropModalOpen).toBe(false);
    act(() => { result.current.openCropModal(); result.current.closeCropModal(); });
    expect(result.current.isCropModalOpen).toBe(false);
  });

  it('forces dark theme and drops the background for non-pro users', () => {
    localStorage.setItem(KEY, JSON.stringify({ theme: 'neon', backgroundImage: 'x' }));
    const { result } = setup({ isPro: false });
    expect(result.current.options.theme).toBe('dark');
    expect(result.current.options.backgroundImage).toBeNull();
  });
});

describe('export & share', () => {
  it('exportCard captures and downloads', async () => {
    const { result } = setup();
    let out;
    await act(async () => { out = await result.current.exportCard(); });
    expect(captureElement).toHaveBeenCalled();
    expect(downloadImage).toHaveBeenCalled();
    expect(out).toEqual({ success: true });
  });

  it('shareCard shares the captured image', async () => {
    const { result } = setup();
    let out;
    await act(async () => { out = await result.current.shareCard(); });
    expect(shareImage).toHaveBeenCalledWith('data:image/png;base64,AAA', expect.objectContaining({ text: 'shared!' }));
    expect(out).toEqual({ success: true });
  });

  it('shareCard falls back to download when sharing fails', async () => {
    shareImage.mockResolvedValueOnce({ success: false, canceled: false });
    const { result } = setup();
    let out;
    await act(async () => { out = await result.current.shareCard(); });
    expect(downloadImage).toHaveBeenCalled();
    expect(out).toEqual({ success: true, method: 'download-fallback' });
  });

  it('throws when the card ref is not attached', async () => {
    const { result } = renderHook(() => useShareCard({ sessionData: {} }));
    await expect(result.current.exportCard()).rejects.toThrow('Card ref not attached');
  });
});
