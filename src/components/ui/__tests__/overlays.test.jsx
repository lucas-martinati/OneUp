import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

import { ConfirmDialog } from '../ConfirmDialog';
import { ModalContainer } from '../ModalContainer';
import { GuestDataMergeOverlay } from '../../feedback/GuestDataMergeOverlay';

afterEach(cleanup);

// ── ConfirmDialog ───────────────────────────────────────────────────────

describe('ConfirmDialog', () => {
  const base = { open: true, message: 'Sûr ?', onConfirm: () => {}, onCancel: () => {} };
  const overlay = () => document.body.querySelector('.dialog-backdrop');

  it('renders nothing when closed', () => {
    render(<ConfirmDialog {...base} open={false} />);
    expect(screen.queryByText('Sûr ?')).toBe(null);
  });

  it('renders the message and default labels when open', () => {
    render(<ConfirmDialog {...base} />);
    expect(screen.getByText('Sûr ?')).toBeTruthy();
    expect(screen.getByText('common.cancel')).toBeTruthy();
    expect(screen.getByText('common.confirm')).toBeTruthy();
  });

  it('calls onConfirm and onCancel from the buttons', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...base} onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('common.confirm'));
    fireEvent.click(screen.getByText('common.cancel'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('uses the destructive labels override', () => {
    render(<ConfirmDialog {...base} destructive confirmLabel="Supprimer" cancelLabel="Annuler" />);
    expect(screen.getByText('Supprimer')).toBeTruthy();
    expect(screen.getByText('Annuler')).toBeTruthy();
  });

  it('closes on the Escape key', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...base} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('ignores non-Escape keys', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...base} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('closes when the backdrop is clicked but not when the panel is clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...base} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Sûr ?')); // inside the panel
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.click(overlay()); // backdrop
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

// ── GuestDataMergeOverlay ─────────────────────────────────────────────────────

describe('GuestDataMergeOverlay', () => {
  it('renders nothing without conflict data', () => {
    render(<GuestDataMergeOverlay conflictData={null} onResolveConflict={() => {}} />);
    expect(screen.queryByText('cloud.anonymousMergeTitle')).toBe(null);
  });

  it('renders the merge prompt when conflict data is present', () => {
    render(<GuestDataMergeOverlay conflictData={{ x: 1 }} onResolveConflict={() => {}} />);
    expect(screen.getByText('cloud.anonymousMergeTitle')).toBeTruthy();
    expect(screen.getByText('cloud.merge')).toBeTruthy();
    expect(screen.getByText('cloud.restore')).toBeTruthy();
  });

  it('resolves with "upload" when the merge button is clicked', () => {
    const onResolve = vi.fn().mockResolvedValue();
    render(<GuestDataMergeOverlay conflictData={{ x: 1 }} onResolveConflict={onResolve} />);
    fireEvent.click(screen.getByText('cloud.merge'));
    expect(onResolve).toHaveBeenCalledWith('upload');
  });

  it('requires a confirmation click before restoring', () => {
    const onResolve = vi.fn().mockResolvedValue();
    render(<GuestDataMergeOverlay conflictData={{ x: 1 }} onResolveConflict={onResolve} />);

    // First click: switches to the "are you sure" confirmation, no resolve yet.
    fireEvent.click(screen.getByText('cloud.restore'));
    expect(onResolve).not.toHaveBeenCalled();
    expect(screen.getByText('cloud.areYouSure')).toBeTruthy();

    // Second click: actually resolves with "restore".
    fireEvent.click(screen.getByText('cloud.areYouSure'));
    expect(onResolve).toHaveBeenCalledWith('restore');
  });
});

// ── ModalContainer ────────────────────────────────────────────────────────────

describe('ModalContainer ambientGlow', () => {
  it('renders no glow by default', () => {
    render(<ModalContainer open={true}><div>Content</div></ModalContainer>);
    expect(document.body.querySelector('.modal-ambient-glow')).toBe(null);
  });

  it('renders accent glow when ambientGlow={true}', () => {
    render(<ModalContainer open={true} ambientGlow><div>Content</div></ModalContainer>);
    const glow = document.body.querySelector('.modal-ambient-glow');
    expect(glow).not.toBe(null);
    expect(glow.style.getPropertyValue('--modal-glow-color')).toBe('color-mix(in srgb, var(--accent-glow) 16%, transparent)');
  });

  it('renders dynamic red glow when ambientGlow="var(--error)"', () => {
    render(<ModalContainer open={true} ambientGlow="var(--error)"><div>Content</div></ModalContainer>);
    const glow = document.body.querySelector('.modal-ambient-glow');
    expect(glow).not.toBe(null);
    expect(glow.style.getPropertyValue('--modal-glow-color')).toBe('color-mix(in srgb, var(--error) 18%, transparent)');
  });

  it('renders dynamic amber glow when ambientGlow="var(--color-amber)"', () => {
    render(<ModalContainer open={true} ambientGlow="var(--color-amber)"><div>Content</div></ModalContainer>);
    const glow = document.body.querySelector('.modal-ambient-glow');
    expect(glow).not.toBe(null);
    expect(glow.style.getPropertyValue('--modal-glow-color')).toBe('color-mix(in srgb, var(--color-amber) 18%, transparent)');
  });

  it('renders raw color string when already using rgba or color-mix', () => {
    render(<ModalContainer open={true} ambientGlow="rgba(255, 0, 0, 0.2)"><div>Content</div></ModalContainer>);
    const glow = document.body.querySelector('.modal-ambient-glow');
    expect(glow).not.toBe(null);
    expect(glow.style.getPropertyValue('--modal-glow-color')).toBe('rgba(255, 0, 0, 0.2)');
  });

  it('updates --modal-glow-color style seamlessly when ambientGlow color changes', () => {
    const { rerender } = render(<ModalContainer open={true} ambientGlow="var(--color-amber)"><div>Content</div></ModalContainer>);
    const glow = document.body.querySelector('.modal-ambient-glow');
    expect(glow).not.toBe(null);
    expect(glow.style.getPropertyValue('--modal-glow-color')).toBe('color-mix(in srgb, var(--color-amber) 18%, transparent)');

    rerender(<ModalContainer open={true} ambientGlow="var(--color-violet)"><div>Content</div></ModalContainer>);
    expect(glow.style.getPropertyValue('--modal-glow-color')).toBe('color-mix(in srgb, var(--color-violet) 18%, transparent)');
  });
});

