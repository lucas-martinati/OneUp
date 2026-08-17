import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { JsonTreeEditor } from '../JsonTreeEditor';

afterEach(cleanup);

describe('JsonTreeEditor number editing', () => {
  it('commits a valid number on Enter', () => {
    const onChange = vi.fn();
    render(<JsonTreeEditor value={{ count: 5 }} onChange={onChange} />);

    const input = screen.getByDisplayValue('5');
    fireEvent.change(input, { target: { value: '7' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith({ count: 7 });
  });

  it('commits a valid number on blur', () => {
    const onChange = vi.fn();
    render(<JsonTreeEditor value={{ count: 5 }} onChange={onChange} />);

    const input = screen.getByDisplayValue('5');
    fireEvent.change(input, { target: { value: '12' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith({ count: 12 });
  });

  it('restores the original value instead of committing NaN when blurring a partial input', () => {
    const onChange = vi.fn();
    render(<JsonTreeEditor value={{ count: 5 }} onChange={onChange} />);

    const input = screen.getByDisplayValue('5');
    fireEvent.change(input, { target: { value: '-' } });
    fireEvent.blur(input);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('5')).toBeTruthy();
  });

  it('restores the original value instead of committing NaN when pressing Enter on an empty field', () => {
    const onChange = vi.fn();
    render(<JsonTreeEditor value={{ count: 5 }} onChange={onChange} />);

    const input = screen.getByDisplayValue('5');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('5')).toBeTruthy();
  });
});