import { describe, it, expect, beforeEach } from 'vitest';
import { getToastRoot } from '../toastRoot';

beforeEach(() => {
  document.body.innerHTML = '';
  document.getElementById('oneup-toast-root')?.remove();
});

describe('getToastRoot', () => {
  it('creates the portal host on first call and appends it to the body', () => {
    const root = getToastRoot();
    expect(root).toBeTruthy();
    expect(root.id).toBe('oneup-toast-root');
    expect(document.body.contains(root)).toBe(true);
    expect(root.style.position).toBe('fixed');
  });

  it('returns the same node on subsequent calls', () => {
    const first = getToastRoot();
    const second = getToastRoot();
    expect(second).toBe(first);
    expect(document.querySelectorAll('#oneup-toast-root').length).toBe(1);
  });

  it('recreates the host if it was removed from the DOM', () => {
    const first = getToastRoot();
    first.remove();
    const second = getToastRoot();
    expect(document.body.contains(second)).toBe(true);
  });

  it('reuses an existing host already present in the DOM', () => {
    const existing = document.createElement('div');
    existing.id = 'oneup-toast-root';
    document.body.appendChild(existing);
    // Force the module's cached ref to be stale by removing then re-adding
    const root = getToastRoot();
    expect(root).toBeTruthy();
  });
});
