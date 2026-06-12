/**
 * Centralized access to the persisted workout session state.
 *
 * All `sessionStarted` / `workout_session_*` localStorage keys live here so
 * the session lifecycle (start / resume / discard) stays consistent across
 * Dashboard, SessionBubble and useWorkoutSession.
 */
const KEYS = {
    started: 'sessionStarted',
    queue: 'workout_session_queue',
    currentIdx: 'workout_session_current_idx',
    startTime: 'workout_session_start_time',
    name: 'workout_session_name',
    activeSlide: 'workout_session_active_slide',
};

export function isWorkoutSessionStarted() {
    if (localStorage.getItem(KEYS.started) !== 'true') return false;
    // A session without exercises is not resumable — treat it as not started
    // (self-heals states persisted before empty queues discarded the session)
    try {
        const queue = JSON.parse(localStorage.getItem(KEYS.queue) || '[]');
        return Array.isArray(queue) && queue.length > 0;
    } catch {
        return false;
    }
}

/** Reads the full persisted session. Missing fields fall back to safe defaults. */
export function loadWorkoutSession() {
    let queue = [];
    try {
        const raw = localStorage.getItem(KEYS.queue);
        if (raw) queue = JSON.parse(raw);
    } catch (e) {
        console.error(e);
    }
    const idx = localStorage.getItem(KEYS.currentIdx);
    const startTime = localStorage.getItem(KEYS.startTime);
    const activeSlide = localStorage.getItem(KEYS.activeSlide);
    return {
        queue,
        currentIdx: idx !== null ? parseInt(idx, 10) : 0,
        startTime: startTime !== null ? parseInt(startTime, 10) : null,
        name: localStorage.getItem(KEYS.name) || '',
        activeSlide: activeSlide !== null ? parseInt(activeSlide, 10) : null,
    };
}

export function saveWorkoutSession({ queue, currentIdx, startTime, name, activeSlide }) {
    localStorage.setItem(KEYS.started, 'true');
    localStorage.setItem(KEYS.queue, JSON.stringify(queue));
    localStorage.setItem(KEYS.currentIdx, String(currentIdx));
    if (startTime != null) {
        localStorage.setItem(KEYS.startTime, String(startTime));
    }
    localStorage.setItem(KEYS.name, name);
    localStorage.setItem(KEYS.activeSlide, String(activeSlide));
}

export function clearWorkoutSession() {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}
