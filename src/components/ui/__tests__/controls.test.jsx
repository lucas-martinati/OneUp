import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

import { SegmentedControl } from '../SegmentedControl';
import { ToggleSwitch } from '../ToggleSwitch';
import { ThemeSwatch } from '../ThemeSwatch';
import { SettingRow } from '../SettingRow';
import { GoogleSignInButton } from '../GoogleSignInButton';
import { Avatar } from '../Avatar';

afterEach(cleanup);

// ── SegmentedControl ────────────────────────────────────────────────────

describe('SegmentedControl', () => {
  const two = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }];
  const three = [{ id: 'x', label: 'X', icon: '🏃' }, { id: 'y', label: 'Y' }, { id: 'z', label: 'Z' }];

  it('toggles to the other option when clicked with exactly two options', () => {
    const onChange = vi.fn();
    const { getByText } = render(<SegmentedControl options={two} value="a" onChange={onChange} />);
    fireEvent.click(getByText('A'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('selects the clicked option directly with more than two options', () => {
    const onChange = vi.fn();
    const { getByText } = render(<SegmentedControl options={three} value="x" onChange={onChange} />);
    fireEvent.click(getByText('Z'));
    expect(onChange).toHaveBeenCalledWith('z');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('renders an option icon when present', () => {
    const { getByText } = render(<SegmentedControl options={three} value="x" onChange={() => {}} />);
    expect(getByText('🏃')).toBeTruthy();
  });

  it('falls back to the first option when value matches none', () => {
    const { container } = render(<SegmentedControl options={three} value="nope" onChange={() => {}} />);
    expect(container.querySelectorAll('button').length).toBe(3);
  });

  it('applies the bump class after the value changes', () => {
    const { container, rerender } = render(<SegmentedControl options={three} value="x" onChange={() => {}} />);
    rerender(<SegmentedControl options={three} value="y" onChange={() => {}} />);
    expect(container.firstChild.className).toBe('bump');
  });
});

// ── ToggleSwitch ────────────────────────────────────────────────────────

describe('ToggleSwitch', () => {
  it('uses the "disable" label and active gradient when enabled', () => {
    const { getByRole } = render(<ToggleSwitch enabled onClick={() => {}} activeGradient="linear-gradient(1deg, #000, #111)" />);
    const btn = getByRole('button');
    expect(btn.getAttribute('aria-label')).toBe('settings.disable');
    expect(btn.style.background).toContain('linear-gradient');
  });

  it('uses the "enable" label when disabled', () => {
    const { getByRole } = render(<ToggleSwitch enabled={false} onClick={() => {}} />);
    expect(getByRole('button').getAttribute('aria-label')).toBe('settings.enable');
  });

  it('fires onClick', () => {
    const onClick = vi.fn();
    const { getByRole } = render(<ToggleSwitch enabled={false} onClick={onClick} />);
    fireEvent.click(getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});

// ── ThemeSwatch ─────────────────────────────────────────────────────────

describe('ThemeSwatch', () => {
  const theme = { key: 'aurora', color: '#101018', accent: '#ff0000' };

  it('calls onClick with the event', () => {
    const onClick = vi.fn();
    const { getByRole } = render(<ThemeSwatch theme={theme} isSelected={false} onClick={onClick} />);
    fireEvent.click(getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not throw when clicked without an onClick handler', () => {
    const { getByRole } = render(<ThemeSwatch theme={theme} isSelected={false} />);
    expect(() => fireEvent.click(getByRole('button'))).not.toThrow();
  });

  it('highlights the accent border when selected', () => {
    const { getByRole } = render(<ThemeSwatch theme={theme} isSelected onClick={() => {}} />);
    expect(getByRole('button').style.border).toContain('rgb(255, 0, 0)');
  });

  it('falls back to the theme key for the title and supports dual-accent themes', () => {
    const dual = { key: 'sunset', color: '#222', accent: '#f00', accent2: '#00f' };
    const { getByRole } = render(<ThemeSwatch theme={dual} isSelected={false} onClick={() => {}} />);
    expect(getByRole('button').getAttribute('title')).toBe('sunset');
  });

  it('uses an explicit title when provided', () => {
    const { getByRole } = render(<ThemeSwatch theme={theme} isSelected={false} onClick={() => {}} title="Mon thème" />);
    expect(getByRole('button').getAttribute('title')).toBe('Mon thème');
  });
});

// ── SettingRow ──────────────────────────────────────────────────────────

describe('SettingRow', () => {
  const Icon = (props) => <svg data-testid="row-icon" data-size={props.size} data-color={props.color} />;

  it('renders the title, the icon and children', () => {
    const { getByText, getByTestId } = render(
      <SettingRow icon={Icon} title="Son" color="#abcabc">
        <button>child</button>
      </SettingRow>
    );
    expect(getByText('Son')).toBeTruthy();
    expect(getByText('child')).toBeTruthy();
    expect(getByTestId('row-icon').getAttribute('data-color')).toBe('#abcabc');
  });

  it('shows the description only when provided', () => {
    const { queryByText, rerender } = render(<SettingRow icon={Icon} title="T" color="#fff" />);
    expect(queryByText('desc')).toBe(null);
    rerender(<SettingRow icon={Icon} title="T" color="#fff" description="desc" />);
    expect(queryByText('desc')).toBeTruthy();
  });

  it('drops the bottom border when it is the last row', () => {
    const { container, rerender } = render(<SettingRow icon={Icon} title="T" color="#fff" />);
    expect(container.firstChild.style.borderBottom).toContain('solid');
    rerender(<SettingRow icon={Icon} title="T" color="#fff" isLast />);
    expect(container.firstChild.style.borderBottom).not.toContain('solid');
  });
});

// ── GoogleSignInButton ──────────────────────────────────────────────────

describe('GoogleSignInButton', () => {
  it('shows the default localized label', () => {
    const { getByRole } = render(<GoogleSignInButton onClick={() => {}} />);
    expect(getByRole('button').textContent).toContain('cloud.signInWithGoogle');
  });

  it('uses a custom label and merges className', () => {
    const { getByRole } = render(<GoogleSignInButton onClick={() => {}} label="Connexion" className="extra" />);
    const btn = getByRole('button');
    expect(btn.textContent).toContain('Connexion');
    expect(btn.className).toContain('extra');
    expect(btn.className).toContain('btn-cloud-signin');
  });

  it('fires onClick and respects disabled', () => {
    const onClick = vi.fn();
    const { getByRole } = render(<GoogleSignInButton onClick={onClick} disabled />);
    expect(getByRole('button').disabled).toBe(true);
    fireEvent.click(getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});

// ── Avatar ──────────────────────────────────────────────────────────────

describe('Avatar', () => {
  it('shows the uppercase initial when there is no photo', () => {
    const { container } = render(<Avatar name="lucas" />);
    expect(container.textContent).toBe('L');
    expect(container.querySelector('img')).toBe(null);
  });

  it('shows "?" when there is no name', () => {
    const { container } = render(<Avatar />);
    expect(container.textContent).toBe('?');
  });

  it('renders the image when a photo URL is given', () => {
    const { container } = render(<Avatar name="Lucas" photoURL="http://x/p.png" />);
    const img = container.querySelector('img');
    expect(img.getAttribute('src')).toBe('http://x/p.png');
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
  });

  it('falls back to the initial when the image fails to load', () => {
    const { container } = render(<Avatar name="Lucas" photoURL="http://x/broken.png" />);
    fireEvent.error(container.querySelector('img'));
    expect(container.querySelector('img')).toBe(null);
    expect(container.textContent).toBe('L');
  });

  it('applies a custom border color and a deterministic gradient per name', () => {
    const { container: c1 } = render(<Avatar name="Alice" borderColor="rgb(1, 2, 3)" />);
    expect(c1.firstChild.style.border).toContain('rgb(1, 2, 3)');
    const grad = c1.firstChild.style.background;
    cleanup();
    const { container: c2 } = render(<Avatar name="Alice" />);
    expect(c2.firstChild.style.background).toBe(grad); // same name → same gradient
  });
});
