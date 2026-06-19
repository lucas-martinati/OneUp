import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';

// jsdom has no ResizeObserver
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);

import { DashboardHeader } from '../DashboardHeader';
import { useUIStore } from '@store/useUIStore';

const selectedExercise = { color: '#8b5cf6', gradient: ['#7c3aed', '#8b5cf6'] };

const baseProps = {
  isAdmin: false,
  streakActive: true,
  displayStreak: 7,
  selectedExercise,
  totalReps: 1234,
};

beforeEach(() => {
  cleanup();
  useUIStore.setState({ modals: {}, modalStack: [] });
});

describe('DashboardHeader', () => {
  it('shows the streak and total reps badges', () => {
    const { getByText } = render(<DashboardHeader {...baseProps} />);
    expect(getByText('7')).toBeTruthy();
    expect(getByText('1234')).toBeTruthy();
  });

  it('has no navigation buttons anymore (moved to the bottom bar)', () => {
    const { queryByRole } = render(<DashboardHeader {...baseProps} />);
    expect(queryByRole('button', { name: 'Settings' })).toBe(null);
    expect(queryByRole('button', { name: 'Statistics' })).toBe(null);
    expect(queryByRole('button', { name: 'Leaderboard' })).toBe(null);
  });

  it('hides the admin button for regular users', () => {
    const { queryByRole } = render(<DashboardHeader {...baseProps} />);
    expect(queryByRole('button', { name: 'Admin Panel' })).toBe(null);
  });

  it('shows the admin button for admins and opens the admin modal', () => {
    const { getByRole } = render(<DashboardHeader {...baseProps} isAdmin={true} />);
    fireEvent.click(getByRole('button', { name: 'Admin Panel' }));
    expect(useUIStore.getState().modals.admin).toBe(true);
  });

  it('renders the OneUp title normally', () => {
    const { getByText } = render(<DashboardHeader {...baseProps} />);
    expect(getByText('OneUp')).toBeTruthy();
  });
});
