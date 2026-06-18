import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Card } from '../Card';
import { Stack } from '../Stack';
import { Spinner } from '../Spinner';

afterEach(cleanup);

const FakeIcon = (props) => <svg data-testid="icon" data-size={props.size} />;
const FakeIconRight = (props) => <svg data-testid="icon-right" data-size={props.size} />;

// ── Button ──────────────────────────────────────────────────────────────

describe('Button', () => {
  it('renders children with a default type of button', () => {
    const { getByRole } = render(<Button>Go</Button>);
    const btn = getByRole('button');
    expect(btn.textContent).toBe('Go');
    expect(btn.getAttribute('type')).toBe('button');
    expect(btn.disabled).toBe(false);
  });

  it('fires onClick when enabled', () => {
    const onClick = vi.fn();
    const { getByRole } = render(<Button onClick={onClick}>X</Button>);
    fireEvent.click(getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled (and unclickable) when disabled', () => {
    const onClick = vi.fn();
    const { getByRole } = render(<Button disabled onClick={onClick}>X</Button>);
    const btn = getByRole('button');
    expect(btn.disabled).toBe(true);
    expect(btn.style.opacity).toBe('0.6');
    expect(btn.style.pointerEvents).toBe('none');
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows a spinner and disables itself while loading (hiding icons)', () => {
    const { getByRole, queryByTestId, container } = render(
      <Button loading icon={FakeIcon} iconRight={FakeIconRight}>X</Button>
    );
    expect(getByRole('button').disabled).toBe(true);
    expect(container.querySelector('span[aria-hidden]')).not.toBe(null);
    expect(queryByTestId('icon')).toBe(null);
    expect(queryByTestId('icon-right')).toBe(null);
  });

  it('renders leading and trailing icons sized to the button when not loading', () => {
    const { getByTestId } = render(
      <Button size="lg" icon={FakeIcon} iconRight={FakeIconRight}>X</Button>
    );
    expect(getByTestId('icon').getAttribute('data-size')).toBe('20');
    expect(getByTestId('icon-right')).toBeTruthy();
  });

  it('stretches to full width when fullWidth is set', () => {
    const { getByRole, rerender } = render(<Button fullWidth>X</Button>);
    expect(getByRole('button').style.width).toBe('100%');
    rerender(<Button>X</Button>);
    expect(getByRole('button').style.width).toBe('');
  });

  it('applies the danger variant styling', () => {
    const { getByRole } = render(<Button variant="danger">X</Button>);
    expect(getByRole('button').style.color).toBe('rgb(255, 255, 255)');
  });
});

// ── IconButton ──────────────────────────────────────────────────────────

describe('IconButton', () => {
  it('renders the icon component when provided', () => {
    const { getByTestId } = render(<IconButton icon={FakeIcon} size="sm" aria-label="a" />);
    expect(getByTestId('icon').getAttribute('data-size')).toBe('17');
  });

  it('renders children when no icon is given', () => {
    const { getByRole } = render(<IconButton aria-label="a">★</IconButton>);
    expect(getByRole('button').textContent).toBe('★');
  });

  it('adds the glass utility class for the glass variant and merges className', () => {
    const { getByRole } = render(<IconButton variant="glass" className="extra" aria-label="a" />);
    const cls = getByRole('button').className;
    expect(cls).toContain('glass');
    expect(cls).toContain('extra');
  });

  it('has no class attribute for the surface variant without className', () => {
    const { getByRole } = render(<IconButton variant="surface" aria-label="a" />);
    expect(getByRole('button').getAttribute('class')).toBe(null);
  });

  it('applies a color override and disabled styling', () => {
    const { getByRole } = render(<IconButton color="rgb(1, 2, 3)" disabled aria-label="a" />);
    const btn = getByRole('button');
    expect(btn.style.color).toBe('rgb(1, 2, 3)');
    expect(btn.disabled).toBe(true);
    expect(btn.style.opacity).toBe('0.5');
  });
});

// ── Card ────────────────────────────────────────────────────────────────

describe('Card', () => {
  it('uses the glass utility class by default', () => {
    const { container } = render(<Card>hi</Card>);
    expect(container.firstChild.className).toContain('glass');
  });

  it('adds hover-lift when interactive and keeps custom className', () => {
    const { container } = render(<Card interactive className="mine">hi</Card>);
    const cls = container.firstChild.className;
    expect(cls).toContain('hover-lift');
    expect(cls).toContain('mine');
  });

  it('renders no class attribute for a plain non-interactive card', () => {
    const { container } = render(<Card variant="plain">hi</Card>);
    expect(container.firstChild.getAttribute('class')).toBe(null);
  });

  it('renders a custom element via the `as` prop', () => {
    const { container } = render(<Card as="section">hi</Card>);
    expect(container.firstChild.tagName).toBe('SECTION');
  });

  it('applies elevated variant inline styles', () => {
    const { container } = render(<Card variant="elevated" padding="none">hi</Card>);
    expect(container.firstChild.style.padding).toBe('0px');
  });
});

// ── Stack ───────────────────────────────────────────────────────────────

describe('Stack', () => {
  it('defaults to a column flex container with a token gap', () => {
    const { container } = render(<Stack>hi</Stack>);
    const el = container.firstChild;
    expect(el.style.display).toBe('flex');
    expect(el.style.flexDirection).toBe('column');
    expect(el.style.gap).toBe('var(--spacing-sm)');
  });

  it('switches to row direction', () => {
    const { container } = render(<Stack direction="row">hi</Stack>);
    expect(container.firstChild.style.flexDirection).toBe('row');
  });

  it('treats a numeric gap as pixels', () => {
    const { container } = render(<Stack gap={12}>hi</Stack>);
    expect(container.firstChild.style.gap).toBe('12px');
  });

  it('passes an unknown gap string through unchanged', () => {
    const { container } = render(<Stack gap="2rem">hi</Stack>);
    expect(container.firstChild.style.gap).toBe('2rem');
  });

  it('enables wrapping and a custom element', () => {
    const { container } = render(<Stack wrap as="ul">hi</Stack>);
    expect(container.firstChild.tagName).toBe('UL');
    expect(container.firstChild.style.flexWrap).toBe('wrap');
  });
});

// ── Spinner ─────────────────────────────────────────────────────────────

describe('Spinner', () => {
  it('renders a ring without a label by default', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('[class*="ring"]')).not.toBe(null);
    expect(container.querySelector('[class*="label"]')).toBe(null);
  });

  it('shows the label when provided', () => {
    const { container } = render(<Spinner label="Chargement" />);
    const label = container.querySelector('[class*="label"]');
    expect(label.textContent).toBe('Chargement');
  });

  it('hides the label for an empty string', () => {
    const { container } = render(<Spinner label="" />);
    expect(container.querySelector('[class*="label"]')).toBe(null);
  });

  it('derives ring thickness from size and accepts a color override', () => {
    const { container } = render(<Spinner size={44} color="rgb(1, 2, 3)" className="x" />);
    const ring = container.querySelector('[class*="ring"]');
    expect(ring.style.borderWidth).toBe('4px'); // round(44/11)
    expect(ring.style.borderTopColor).toBe('rgb(1, 2, 3)');
    expect(container.querySelector('[class*="wrap"]').className).toContain('x');
  });

  it('honors an explicit thickness', () => {
    const { container } = render(<Spinner thickness={7} />);
    expect(container.querySelector('[class*="ring"]').style.borderWidth).toBe('7px');
  });
});
