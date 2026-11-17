import { describe, expect, it } from 'vitest';
import { reduceWearOperation, validateWearReceipts } from '../wearProtocol';

const scope = 'account-a';
const date = '2026-10-29';
const catalog = { scope, date, ready: true, exercises: [{ id: 'pushups', goal: 50, count: 10 }, { id: 'squats', goal: 50 }] };
const initial = () => ({ completions: { [date]: { pushups: { count: 10, goal: 50, level: 2, isCompleted: true } } }, wearReceipts: {} });
const op = overrides => ({ version: 1, scope, device: 'watch-a', sequence: 1, type: 'count', date, exerciseId: 'pushups', delta: 5, localHour: 9, ...overrides });

describe('durable Wear operation streams', () => {
  it('adds offline work to current phone progress and cannot apply a delivery twice', () => {
    const first = reduceWearOperation(initial(), op(), catalog, scope);
    expect(first.state.completions[date].pushups).toMatchObject({ count: 15, level: 3, goal: 50, localHour: 9 });
    expect(reduceWearOperation(first.state, op(), catalog, scope).status).toBe('duplicate');
    const concurrent = { ...first.state, completions: { [date]: { pushups: { count: 25, goal: 50 } } } };
    const second = reduceWearOperation(concurrent, op({ sequence: 2 }), catalog, scope);
    expect(second.state.completions[date].pushups.count).toBe(30);
  });
  it('defers out-of-order delivery until the missing action is imported', () => {
    expect(reduceWearOperation(initial(), op({ sequence: 2 }), catalog, scope).status).toBe('deferred');
    const first = reduceWearOperation(initial(), op(), catalog, scope);
    expect(reduceWearOperation(first.state, op({ sequence: 2 }), catalog, scope).state.wearReceipts['watch-a']).toBe(2);
  });
  it('never imports another account or a catalog from another day', () => {
    expect(reduceWearOperation(initial(), op({ scope: 'account-b' }), catalog, scope).status).toBe('invalid');
    expect(reduceWearOperation(initial(), op(), { ...catalog, date: '2026-10-30' }, scope).status).toBe('deferred');
    expect(reduceWearOperation(initial(), op(), { ...catalog, scope: 'account-b' }, scope).status).toBe('deferred');
  });
  it('locks the original goal, clamps corrections and preserves the validation hour', () => {
    const state = initial(); state.completions[date].pushups.localHour = 7;
    const result = reduceWearOperation(state, op({ delta: 3600 }), { ...catalog, exercises: [{ id: 'pushups', goal: 100 }] }, scope);
    expect(result.state.completions[date].pushups).toMatchObject({ count: 50, goal: 50, localHour: 7, level: 10 });
    const corrected = reduceWearOperation(result.state, op({ sequence: 2, delta: -3600 }), catalog, scope);
    expect(corrected.state.completions[date].pushups).toMatchObject({ count: 0, level: 0, isCompleted: false });
  });
  it('uses rounded shared thresholds for small goals', () => {
    const result = reduceWearOperation(initial(), op({ exerciseId: 'squats', delta: 1 }), { ...catalog, exercises: [{ id: 'squats', goal: 3 }] }, scope);
    expect(result.state.completions[date].squats.level).toBe(3);
  });
  it.each([{ delta: NaN }, { delta: 0 }, { delta: 1.5 }, { delta: 3601 }, { exerciseId: 'deleted' }, { sequence: -1 }, { type: 'unknown' }])('rejects invalid actions %j', invalid => {
    expect(reduceWearOperation(initial(), op(invalid), catalog, scope).status).toBe('invalid');
  });
  it('respects the catalog entitlement and rejects tampered session queues', () => {
    expect(reduceWearOperation(initial(), op(), { ...catalog, exercises: [{ id: 'pushups', goal: 50, locked: true }] }, scope).status).toBe('invalid');
    const session = op({ type: 'session_start', sessionId: 'session-a', startedAt: Date.now() - 2000, queue: ['pushups', 'pushups'] });
    expect(reduceWearOperation(initial(), session, catalog, scope).status).toBe('invalid');
  });
  it('keeps a finished session’s original end time after offline delivery', () => {
    const endedAt = Date.now() - 100000;
    const result = reduceWearOperation(initial(), op({ type: 'session_finish', sessionId: 'session-a', queue: ['pushups'], startedAt: endedAt - 60000, occurredAt: endedAt }), catalog, scope);
    expect(result.effect.endedAt - result.effect.startedAt).toBe(60000);
  });
  it('validates receipt storage without accepting unsafe sequence values', () => {
    expect(validateWearReceipts({ a: 2, b: -1, c: '3', d: 1.1 })).toEqual({ a: 2 });
  });
});
