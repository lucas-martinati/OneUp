import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FrozenFlame } from '../FrozenFlame';

describe('FrozenFlame', () => {
    it('renders with default props', () => {
        const { container } = render(<FrozenFlame />);
        const span = container.querySelector('span');
        expect(span).toBeTruthy();
        const svg = container.querySelector('svg');
        expect(svg).toBeTruthy();
        expect(svg.getAttribute('width')).toBe('16');
        expect(svg.getAttribute('height')).toBe('16');
    });

    it('renders with custom size and color', () => {
        const { container } = render(<FrozenFlame size={24} color="#ff0000" />);
        const svg = container.querySelector('svg');
        expect(svg.getAttribute('width')).toBe('24');
        expect(svg.getAttribute('height')).toBe('24');
        
        const path = container.querySelector('svg > path');
        expect(path.getAttribute('stroke')).toBe('#ff0000');
    });

    it('passes down style and className props', () => {
        const { container } = render(<FrozenFlame className="custom-flame" style={{ marginTop: '10px' }} />);
        const span = container.querySelector('span');
        expect(span.className).toContain('custom-flame');
        expect(span.style.marginTop).toBe('10px');
    });
});
