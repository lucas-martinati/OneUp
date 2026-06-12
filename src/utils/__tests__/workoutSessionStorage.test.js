import { describe, it, expect, beforeEach } from 'vitest';
import {
  isWorkoutSessionStarted,
  loadWorkoutSession,
  saveWorkoutSession,
  clearWorkoutSession,
} from '../workoutSessionStorage';

beforeEach(() => {
  localStorage.clear();
});

describe('isWorkoutSessionStarted', () => {
  it('is false when nothing is stored', () => {
    expect(isWorkoutSessionStarted()).toBe(false);
  });

  it('is true after a save', () => {
    saveWorkoutSession({ queue: ['pushups'], currentIdx: 0, startTime: 123, name: 'Test', activeSlide: 1 });
    expect(isWorkoutSessionStarted()).toBe(true);
  });

  it('is false when the saved queue is empty', () => {
    saveWorkoutSession({ queue: [], currentIdx: 0, startTime: 123, name: 'Test', activeSlide: 1 });
    expect(isWorkoutSessionStarted()).toBe(false);
  });

  it('is false when the saved queue is corrupted', () => {
    localStorage.setItem('sessionStarted', 'true');
    localStorage.setItem('workout_session_queue', '{not json');
    expect(isWorkoutSessionStarted()).toBe(false);
  });
});

describe('save/load round-trip', () => {
  it('restores everything that was saved', () => {
    saveWorkoutSession({
      queue: ['pushups', 'squats'],
      currentIdx: 1,
      startTime: 1717000000000,
      name: 'Ma séance',
      activeSlide: 2,
    });
    expect(loadWorkoutSession()).toEqual({
      queue: ['pushups', 'squats'],
      currentIdx: 1,
      startTime: 1717000000000,
      name: 'Ma séance',
      activeSlide: 2,
    });
  });

  it('skips startTime when null but keeps the rest', () => {
    saveWorkoutSession({ queue: [], currentIdx: 0, startTime: null, name: '', activeSlide: 0 });
    const loaded = loadWorkoutSession();
    expect(loaded.startTime).toBe(null);
    expect(loaded.queue).toEqual([]);
    expect(loaded.currentIdx).toBe(0);
  });
});

describe('loadWorkoutSession defaults', () => {
  it('returns safe defaults when storage is empty', () => {
    expect(loadWorkoutSession()).toEqual({
      queue: [],
      currentIdx: 0,
      startTime: null,
      name: '',
      activeSlide: null,
    });
  });

  it('survives corrupted queue JSON', () => {
    localStorage.setItem('workout_session_queue', '{not json');
    const loaded = loadWorkoutSession();
    expect(loaded.queue).toEqual([]);
  });
});

describe('clearWorkoutSession', () => {
  it('removes every session key', () => {
    saveWorkoutSession({ queue: ['pushups'], currentIdx: 3, startTime: 42, name: 'x', activeSlide: 1 });
    clearWorkoutSession();
    expect(isWorkoutSessionStarted()).toBe(false);
    expect(loadWorkoutSession()).toEqual({
      queue: [],
      currentIdx: 0,
      startTime: null,
      name: '',
      activeSlide: null,
    });
  });

  it('does not touch unrelated keys', () => {
    localStorage.setItem('other_key', 'keep-me');
    saveWorkoutSession({ queue: [], currentIdx: 0, startTime: 1, name: '', activeSlide: 0 });
    clearWorkoutSession();
    expect(localStorage.getItem('other_key')).toBe('keep-me');
  });
});
