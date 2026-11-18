import { getLevelForCount } from '@shared/exerciseLevels';

export const WEAR_VERSION = 1;
export const WEAR_SESSION_EVENT = 'oneup:workout-session';
export const WEAR_MANUAL_SYNC_EVENT = 'oneup:wear-manual-sync';
export const WEAR_STATUS_EVENT = 'oneup:wear-status';
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STREAM = /^[a-zA-Z0-9_-]{1,100}$/;
const TYPES = new Set(['count', 'session_start', 'session_finish']);

/** Strict, ordered, per-account streams make retries safe, including after a crash. */
export function reduceWearOperation(state, operation, catalog, scope) {
  if (!operation || operation.version !== WEAR_VERSION || operation.scope !== scope
    || !STREAM.test(operation.device || '') || !Number.isSafeInteger(operation.sequence) || operation.sequence < 1
    || !TYPES.has(operation.type) || !DATE.test(operation.date || '')) return { status: 'invalid' };
  const through = Object.hasOwn(state.wearReceipts || {}, operation.device) ? state.wearReceipts[operation.device] : 0;
  if (operation.sequence <= through) return { status: 'duplicate' };
  if (operation.sequence !== through + 1) return { status: 'deferred' };
  if (!catalog || catalog.scope !== scope || catalog.date !== operation.date || !catalog.ready) return { status: 'deferred' };
  const byId = new Map(catalog.exercises.map(ex => [ex.id, ex]));
  let completions = state.completions;
  let effect = null;
  if (operation.type === 'count') {
    const ex = byId.get(operation.exerciseId);
    if (!ex || ex.locked || !Number.isSafeInteger(operation.delta) || Math.abs(operation.delta) > 3600 || !operation.delta) return { status: 'invalid' };
    const day = completions[operation.date] || {};
    const entry = day[ex.id] || {};
    const goal = entry.goal > 0 ? entry.goal : ex.goal;
    const count = Math.max(0, Math.min(goal, (entry.count || 0) + operation.delta));
    const level = getLevelForCount(count, goal);
    const next = {
      ...entry, count, goal, level, isCompleted: level > 0, timestamp: Date.now(),
      ...(Number.isInteger(entry.localHour) ? {} : { localHour: Math.max(0, Math.min(23, operation.localHour || 0)) }),
      ...(Number.isFinite(ex.weight) ? { weight: ex.weight } : {}),
    };
    delete next.timestampEstimated;
    completions = { ...completions, [operation.date]: { ...day, [ex.id]: next } };
  } else {
    if (!STREAM.test(operation.sessionId || '') || !Array.isArray(operation.queue) || !operation.queue.length
      || operation.queue.length > 100 || new Set(operation.queue).size !== operation.queue.length
      || operation.queue.some(id => !byId.has(id) || byId.get(id).locked)) return { status: 'invalid' };
    const startedAt = Number(operation.startedAt);
    if (!Number.isFinite(startedAt) || startedAt <= 0 || startedAt > Date.now() + 60000) return { status: 'invalid' };
    const routineName = typeof operation.routineName === 'string' ? operation.routineName.trim().slice(0, 60) : '';
    effect = {
      type: operation.type, sessionId: operation.sessionId, queue: operation.queue, startedAt,
      endedAt: Math.min(Date.now(), Number(operation.occurredAt) || Date.now()), catalog,
      ...(routineName ? { routineName } : {}),
    };
  }
  return {
    status: 'applied', effect,
    state: { completions, wearReceipts: { ...state.wearReceipts, [operation.device]: operation.sequence } },
  };
}

export function validateWearReceipts(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([id, sequence]) => STREAM.test(id) && Number.isSafeInteger(sequence) && sequence >= 0));
}
