import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

const pauseCloudSync = vi.fn();
vi.mock('@store/useCloudSyncStore', () => ({
  useCloudSyncStore: (selector) => selector({ pauseCloudSync }),
}));

import { DashboardNavBar } from '../DashboardNavBar';
import { useUIStore } from '@store/useUIStore';

const selectedExercise = { color: '#8b5cf6', gradient: ['#7c3aed', '#8b5cf6'] };

const renderNavBar = (props = {}) => render(
  <DashboardNavBar selectedExercise={selectedExercise} activeCategoryColor={null} {...props} />
);

beforeEach(() => {
  cleanup();
  pauseCloudSync.mockClear();
  useUIStore.setState({
    modals: {},
    modalStack: [],
    sessionInProgress: false,
    sessionMode: 'config',
  });
});

describe('DashboardNavBar', () => {
  it('renders the five destinations', () => {
    const { getByRole } = renderNavBar();
    for (const label of ['dashboard.calendar', 'stats.title', 'leaderboard.title', 'settings.title', 'dashboard.session']) {
      expect(getByRole('button', { name: label })).toBeTruthy();
    }
  });

  it.each([
    ['dashboard.calendar', 'calendar'],
    ['stats.title', 'stats'],
    ['leaderboard.title', 'leaderboard'],
    ['settings.title', 'settings'],
  ])('clicking %s opens the %s modal', (label, modalId) => {
    const { getByRole } = renderNavBar();
    fireEvent.click(getByRole('button', { name: label }));
    expect(useUIStore.getState().modals[modalId]).toBe(true);
    expect(useUIStore.getState().modalStack).toEqual([modalId]);
  });

  it('the central button opens the session in config mode and pauses cloud sync', () => {
    const { getByRole } = renderNavBar();
    fireEvent.click(getByRole('button', { name: 'dashboard.session' }));
    expect(useUIStore.getState().modals.session).toBe(true);
    expect(useUIStore.getState().sessionMode).toBe('config');
    expect(pauseCloudSync).toHaveBeenCalled();
  });

  it('shows the in-progress dot only when a session is running', () => {
    const { container, rerender } = renderNavBar();
    expect(container.querySelector('[class*="sessionDot"]')).toBe(null);

    useUIStore.setState({ sessionInProgress: true });
    rerender(
      <DashboardNavBar selectedExercise={selectedExercise} activeCategoryColor={null} />
    );
    expect(container.querySelector('[class*="sessionDot"]')).not.toBe(null);
  });

  it('uses the in-progress aria label when a session is running', () => {
    useUIStore.setState({ sessionInProgress: true });
    const { getByRole } = renderNavBar();
    expect(getByRole('button', { name: 'dashboard.editSession' })).toBeTruthy();
  });

  it('tints the central button with the active category color', () => {
    const { container } = renderNavBar({ activeCategoryColor: '#22c55e' });
    const circle = container.querySelector('[class*="sessionCircle"]');
    expect(circle.style.background).toContain('34, 197, 94'); // #22c55e in rgb
  });
});
