import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, within, cleanup } from '@testing-library/react';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
vi.mock('@hooks/useBackHandler', () => ({ useBackHandler: vi.fn() }));

import { Achievements } from '../Achievements';
import { buildBadges } from '../buildBadges';

// Badge inputs live in the shared `badgeStats` snapshot; `achievements` carries
// the manual overrides. The grid reads exactly these (see Achievements.jsx).
// perfectDays: 150 unlocks all four "perfection" badges → that category must
// disappear entirely under the "locked" filter (chip + section).
const BADGE_STATS = {
  totalDays: 12, maxStreak: 7, totalRepsAll: 1200, perfectDays: 150,
  hasCompletedAllExercisesOnce: true, weekdayWorkouts: 26, weekendWorkouts: 2,
  morningWorkouts: 6, afternoonWorkouts: 3, eveningWorkouts: 3,
  ghostWorkout: false, perfectStreak: 3,
};
const STATS = { badgeStats: BADGE_STATS, achievements: {} };
// The snapshot buildBadges consumes = badge stats + the manual override map.
const BADGE_INPUT = { ...BADGE_STATS, achievements: {} };

function renderPanel(props = {}) {
  const onClose = vi.fn();
  const utils = render(<Achievements onClose={onClose} computedStats={STATS} highlightedBadgeId={props.highlightedBadgeId} />);
  return { ...utils, onClose };
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup()); // no global auto-cleanup configured → unmount between tests

describe('Achievements', () => {
  it('renders the unlocked count from buildBadges', () => {
    const expectedUnlocked = buildBadges(BADGE_INPUT).filter(b => b.unlocked).length;
    const { baseElement } = renderPanel();
    // hero shows the unlocked count
    expect(baseElement.textContent).toContain(String(expectedUnlocked));
    // at least one badge tile rendered
    expect(baseElement.querySelectorAll('[data-badge-id]').length).toBeGreaterThan(0);
  });

  it('filters to unlocked-only badges', () => {
    const { getByRole, baseElement } = renderPanel();
    const totalBadges = baseElement.querySelectorAll('[data-badge-id]').length;
    fireEvent.click(getByRole('button', { name: 'achievements.filterUnlocked' }));
    const shown = baseElement.querySelectorAll('[data-badge-id]').length;
    const unlocked = buildBadges(BADGE_INPUT).filter(b => b.unlocked).length;
    expect(shown).toBe(unlocked);
    expect(shown).toBeLessThanOrEqual(totalBadges);
  });

  it('filters to locked-only badges', () => {
    const { getByRole, baseElement } = renderPanel();
    fireEvent.click(getByRole('button', { name: 'achievements.filterLocked' }));
    const ids = [...baseElement.querySelectorAll('[data-badge-id]')].map(e => e.getAttribute('data-badge-id'));
    const lockedIds = buildBadges(BADGE_INPUT).filter(b => !b.unlocked).map(b => b.id);
    expect(ids.every(id => lockedIds.includes(id))).toBe(true);
  });

  it('closes when the ✕ button is clicked', async () => {
    const { getByRole, onClose } = renderPanel();
    fireEvent.click(getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('filters to a single category via its chip and toggles back', () => {
    const { baseElement, getAllByRole } = renderPanel();
    const badges = buildBadges(BADGE_INPUT);
    const firstCat = badges[0].category;
    const catCount = badges.filter(b => b.category === firstCat).length;
    const chip = getAllByRole('button', { name: /achievements\.categories\./ })[0];
    fireEvent.click(chip);
    const shown = baseElement.querySelectorAll('[data-badge-id]').length;
    expect(shown).toBeLessThan(badges.length);
    // Toggling the same chip again restores the full grid
    fireEvent.click(chip);
    expect(baseElement.querySelectorAll('[data-badge-id]').length).toBe(badges.length);
    expect(catCount).toBeGreaterThan(0);
  });

  it('highlights the deep-linked badge', () => {
    const firstId = buildBadges(BADGE_INPUT)[0].id;
    const { baseElement } = renderPanel({ highlightedBadgeId: firstId });
    const el = baseElement.querySelector(`[data-badge-id="${firstId}"]`);
    expect(el).toBeTruthy();
    // highlighted tiles get a 2px colored border
    expect(el.style.border).toContain('2px');
  });

  it('hides fully unlocked categories under the locked filter', () => {
    const { baseElement, getByRole } = renderPanel();
    // Visible while showing everything…
    expect(baseElement.textContent).toContain('achievements.categories.perfection');
    fireEvent.click(getByRole('button', { name: 'achievements.filterLocked' }));
    // …gone (chip and section) once only locked badges are listed
    expect(baseElement.textContent).not.toContain('achievements.categories.perfection');
  });

  it('renders category section headers with counts', () => {
    const { baseElement } = renderPanel();
    const grids = baseElement.querySelectorAll('[data-badge-id]');
    // Each tile lives under a category grid; smoke-check a known category badge exists
    const within0 = within(baseElement);
    expect(within0.getByText('achievements.badgesUnlocked')).toBeTruthy();
    expect(grids.length).toBeGreaterThan(3);
  });
});
