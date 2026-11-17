import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@services/firebase', () => ({ getAuthInstance: () => null, getDatabaseInstance: () => null }));
import { applyWearSessionEffect } from '../wearSession';
import { getSessionHistory } from '@features/share/services/sessionHistoryService';
import { getWorkoutSessionId, isWorkoutSessionStarted, saveWorkoutSession } from '@utils/workoutSessionStorage';
import { useUIStore } from '@store/useUIStore';
import { getLocalDateStr } from '@shared/dateUtils';

function workout(type) {
  const date = getLocalDateStr(new Date());
  const endedAt = Date.now() - 30000;
  return {
    effect: { type, sessionId: 'watch-session-1', queue: ['pushups'], startedAt: endedAt - 60000, endedAt,
      catalog: { date, exercises: [{ id: 'pushups', name: 'Pompes', goal: 100, color: '#818cf8', icon: 'Dumbbell' }] } },
    progress: { completions: { [date]: { pushups: { count: 50, goal: 100, level: 5 } } } },
  };
}
beforeEach(() => { localStorage.clear(); useUIStore.getState().setSessionInProgress(false); });
describe('sessions shared with the phone', () => {
  it('makes a watch-started session resumable on the phone', () => {
    const { effect, progress } = workout('session_start'); applyWearSessionEffect(effect, progress);
    expect(isWorkoutSessionStarted()).toBe(true);
    expect(getWorkoutSessionId()).toBe(effect.sessionId);
    expect(useUIStore.getState().sessionInProgress).toBe(true);
  });
  it('keeps one history entry on replay and uses the offline finish time', () => {
    const { effect, progress } = workout('session_start'); applyWearSessionEffect(effect, progress);
    const finished = { ...effect, type: 'session_finish' };
    applyWearSessionEffect(finished, progress); applyWearSessionEffect(finished, progress);
    expect(getSessionHistory()).toHaveLength(1);
    expect(getSessionHistory()[0]).toMatchObject({ id: effect.sessionId, source: 'wear', duration: 60,
      exercises: [{ id: 'pushups', label: 'Pompes', reps: 50 }] });
    expect(isWorkoutSessionStarted()).toBe(false);
    expect(useUIStore.getState().sessionInProgress).toBe(false);
  });
  it('does not replace or close a different session already running on the phone', () => {
    saveWorkoutSession({ sessionId: 'phone-session', queue: ['squats'], currentIdx: 0, startTime: Date.now(), name: '', activeSlide: 1 });
    useUIStore.getState().setSessionInProgress(true);
    const { effect, progress } = workout('session_start'); applyWearSessionEffect(effect, progress);
    applyWearSessionEffect({ ...effect, type: 'session_finish' }, progress);
    expect(getWorkoutSessionId()).toBe('phone-session');
    expect(useUIStore.getState().sessionInProgress).toBe(true);
  });
});
