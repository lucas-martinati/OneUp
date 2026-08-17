import { describe, it, expect } from 'vitest';
import { formatDuration, formatDistance, formatSpeed } from '../cardioFormatters';

describe('formatDuration', () => {
  it('handles zero / invalid values', () => {
    expect(formatDuration(0)).toBe('—');
    expect(formatDuration(-10)).toBe('—');
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(undefined)).toBe('—');
  });

  it('formats sub-hour durations as "Xm Zs"', () => {
    expect(formatDuration(45)).toBe('0m 45s');
    expect(formatDuration(90)).toBe('1m 30s');
  });

  it('formats hour durations as "Xh Ym"', () => {
    expect(formatDuration(3600)).toBe('1h 00m');
    expect(formatDuration(5400)).toBe('1h 30m');
    expect(formatDuration(3661)).toBe('1h 01m');
  });

  it('handles large durations', () => {
    expect(formatDuration(100000)).toBe('27h 46m');
  });
});

describe('formatDistance', () => {
  it('handles zero / invalid values', () => {
    expect(formatDistance(0)).toBe('—');
    expect(formatDistance(-100)).toBe('—');
    expect(formatDistance(null)).toBe('—');
  });

  it('formats meters to km with 1 decimal by default', () => {
    expect(formatDistance(1234)).toBe('1.2');
    expect(formatDistance(5000)).toBe('5.0');
  });

  it('supports more decimals (fullscreen map)', () => {
    expect(formatDistance(1234, 2)).toBe('1.23');
  });
});

describe('formatSpeed', () => {
  it('handles zero / invalid values', () => {
    expect(formatSpeed(0, 'running')).toBe('—');
    expect(formatSpeed(-1, 'cycling')).toBe('—');
    expect(formatSpeed(null, 'cycling')).toBe('—');
  });

  it('formats pace (min/km) for running', () => {
    expect(formatSpeed(3, 'running')).toBe('5:33');
    expect(formatSpeed(4, 'running')).toBe('4:10');
  });

  it('formats speed (km/h) for other types', () => {
    expect(formatSpeed(5, 'cycling')).toBe('18.0');
    expect(formatSpeed(7.5, 'cycling')).toBe('27.0');
  });
});