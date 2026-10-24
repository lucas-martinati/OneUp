import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, values) => values?.level !== undefined ? `Lvl ${values.level}` : key }),
}));

import { LevelBadge } from '../LevelBadge';
import { WeightBadge } from '../WeightBadge';
import { StreakFlame } from '../StreakFlame';

afterEach(cleanup);

// ── LevelBadge ─────────────────────────────────────────────────────

describe('LevelBadge', () => {
  it('omits unknown historical levels instead of inventing one', () => {
    expect(render(<LevelBadge />).container.firstChild).toBe(null);
  });
  it('shows both partial and full levels', () => {
    expect(render(<LevelBadge level={5} />).getByRole('img', { name: 'Lvl 5' })).toBeTruthy();
    cleanup();
    expect(render(<LevelBadge level={10} />).getByRole('img', { name: 'Lvl 10' })).toBeTruthy();
  });
  it('omits level zero when no threshold was reached', () => {
    expect(render(<LevelBadge level={0} />).container.firstChild).toBeNull();
  });
});

// ── WeightBadge ─────────────────────────────────────────────────────────

describe('WeightBadge', () => {
  it('renders nothing when weight is null or undefined', () => {
    expect(render(<WeightBadge weight={null} color="#fff" />).container.firstChild).toBe(null);
    cleanup();
    expect(render(<WeightBadge weight={undefined} color="#fff" />).container.firstChild).toBe(null);
  });

  it('renders zero weight (0 is a valid value)', () => {
    const { container } = render(<WeightBadge weight={0} color="#fff" />);
    expect(container.firstChild.textContent).toContain('0');
  });

  it('renders the value and the localized unit', () => {
    const { container } = render(<WeightBadge weight={20} color="#abcdef" />);
    expect(container.firstChild.textContent).toContain('20');
    expect(container.firstChild.textContent).toContain('weight.kg');
  });
});

// ── StreakFlame ─────────────────────────────────────────────────────────

describe('StreakFlame', () => {
  it('renders nothing for a zero or negative streak', () => {
    expect(render(<StreakFlame streak={0} active />).container.firstChild).toBe(null);
    cleanup();
    expect(render(<StreakFlame streak={-3} active />).container.firstChild).toBe(null);
    cleanup();
    expect(render(<StreakFlame streak={undefined} active />).container.firstChild).toBe(null);
  });

  it('shows the flame and day count with the abbr suffix in the pill variant', () => {
    const { container } = render(<StreakFlame streak={5} active />);
    expect(container.textContent).toContain('🔥');
    expect(container.textContent).toContain('5');
    expect(container.textContent).toContain('common.daysAbbr');
  });

  it('omits the suffix in the badge variant', () => {
    const { container } = render(<StreakFlame streak={5} active variant="badge" />);
    expect(container.textContent).not.toContain('common.daysAbbr');
    expect(container.textContent).toContain('5');
  });

  it('greys out the flame when the streak is not active today', () => {
    const { container } = render(<StreakFlame streak={5} active={false} />);
    const flame = [...container.querySelectorAll('span')].find(s => s.textContent === '🔥');
    expect(flame.style.filter).toBe('grayscale(1)');
    expect(flame.style.opacity).toBe('0.6');
  });

  it('keeps the flame coloured when active', () => {
    const { container } = render(<StreakFlame streak={5} active variant="badge" />);
    const flame = [...container.querySelectorAll('span')].find(s => s.textContent === '🔥');
    expect(flame.style.filter).toBe('none');
  });
});
