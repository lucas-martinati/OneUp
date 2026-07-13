import { createLogger } from './logger';

const logger = createLogger('SyncUtils');

function getTimestamp(lcc, isPlaceholder) {
  if (isPlaceholder || !lcc) return 0;
  return new Date(lcc).getTime();
}

export function sanitizeForCloud(data) {
  if (!data || !data.completions) return data;
  const sanitizedCompletions = {};
  Object.keys(data.completions).forEach(dateStr => {
    const dayEntry = data.completions[dateStr];
    if (!dayEntry || typeof dayEntry !== 'object') return;
    const sanitizedDay = {};
    Object.keys(dayEntry).forEach(exerciseId => {
      const ex = dayEntry[exerciseId];
      if (!ex || typeof ex !== 'object') return;
      sanitizedDay[exerciseId] = {
        isCompleted: ex.isCompleted || false,
        timestamp: ex.timestamp || null,
        // Sync the local completion hour so the Cloud Function can compute the
        // time-of-day badges (incl. the 3-4am ghost) from the user's real hour
        // rather than an unrecoverable UTC approximation — see @shared/achievementStats.
        ...(Number.isInteger(ex.localHour) ? { localHour: ex.localHour } : {}),
        ...(ex.weight !== undefined ? { weight: ex.weight } : {}),
        ...(ex.difficulty !== undefined ? { difficulty: ex.difficulty } : {})
      };
    });
    sanitizedCompletions[dateStr] = sanitizedDay;
  });
  
  // Strip fields that must never be written under `users/{uid}/progress`:
  // - achievements / hasShared: handled independently or deprecated.
  // - cardio: sessions live in their own `users/{uid}/cardioSessions` node; the
  //   store keeps an in-memory `cardio` mirror (fed by useCardio for stats), but
  //   it must NOT be synced back into progress (that recreated the legacy
  //   `progress/cardio` node).
  const restOfData = { ...data };
  delete restOfData.achievements;
  delete restOfData.hasShared;
  delete restOfData.cardio;
  return { ...restOfData, completions: sanitizedCompletions };
}

function reattachLocalCounts(cloudCompletions, localCompletions) {
  const result = { ...(cloudCompletions || {}) };
  if (!localCompletions) return result;
  for (const dateStr of Object.keys(result)) {
    const cloudDay = result[dateStr];
    const localDay = localCompletions[dateStr];
    if (!cloudDay || typeof cloudDay !== 'object' || !localDay) continue;
    let mergedDay = null;
    for (const exId of Object.keys(cloudDay)) {
      const cloudEx = cloudDay[exId];
      const localEx = localDay[exId];
      if (
        cloudEx && typeof cloudEx === 'object' &&
        cloudEx.count === undefined && localEx?.count !== undefined &&
        !!cloudEx.isCompleted === !!localEx.isCompleted
      ) {
        if (!mergedDay) mergedDay = { ...cloudDay };
        mergedDay[exId] = { ...cloudEx, count: localEx.count };
      }
    }
    if (mergedDay) result[dateStr] = mergedDay;
  }
  return result;
}

/**
 * Merge two streak-freeze states. Frozen days are UNIONed (a freeze-protected
 * day must never be lost on either side); the inventory keeps the side with the
 * most recent monthly refill, and the lower count when refills tie (conservative
 * against double-spending across devices).
 */
function mergeStreakFreeze(localData, cloudData) {
  const frozenDays = { ...(cloudData.frozenDays || {}), ...(localData.frozenDays || {}) };
  const localInv = localData.streakFreezes;
  const cloudInv = cloudData.streakFreezes;
  let streakFreezes;
  if (!localInv) streakFreezes = cloudInv;
  else if (!cloudInv) streakFreezes = localInv;
  else if ((localInv.lastRefill || '') === (cloudInv.lastRefill || '')) {
    // Same refill month → take the lower count. Trade-off: if a user spends
    // freezes on two devices in one month (e.g. 2 on mobile, 1 on web), the
    // merge keeps min(0,1)=0 — slightly over-conservative (it can "lose" a
    // freeze) but it can never DOUBLE-SPEND, which matters more than recovering
    // the odd freeze in a rare offline-on-two-devices race.
    streakFreezes = { lastRefill: localInv.lastRefill, count: Math.min(localInv.count ?? 0, cloudInv.count ?? 0) };
  } else {
    streakFreezes = (localInv.lastRefill || '') > (cloudInv.lastRefill || '') ? localInv : cloudInv;
  }
  return { frozenDays, streakFreezes };
}

export function mergeData(localData, cloudData) {
  if (!cloudData) return localData;
  if (!localData) return cloudData;

  const localLCC = localData.lastCompletionChange;
  const cloudLCC = cloudData.lastCompletionChange;
  const localLCCIsPlaceholder = localLCC && typeof localLCC === 'object' && localLCC['.sv'];
  const cloudLCCIsPlaceholder = cloudLCC && typeof cloudLCC === 'object' && cloudLCC['.sv'];
  
  const localLCCTs = getTimestamp(localLCC, localLCCIsPlaceholder);
  const cloudLCCTs = getTimestamp(cloudLCC, cloudLCCIsPlaceholder);

  // If cloud data is strictly newer (e.g. updated by admin or another device)
  // and local does not have a pending placeholder write, we treat the cloud
  // data as the absolute ground truth and overwrite local state.
  if (cloudLCCTs > localLCCTs && !localLCCIsPlaceholder) {
    logger.info('Cloud data is newer than local data. Overwriting local cache with cloud state.');
    return {
      startDate: cloudData.startDate,
      userStartDate: cloudData.userStartDate,
      completions: reattachLocalCounts(cloudData.completions, localData.completions),
      isSetup: cloudData.isSetup,
      lastCompletionChange: cloudData.lastCompletionChange,
      cardio: cloudData.cardio || { sessions: {} },
      notes: cloudData.notes || {},
      ...mergeStreakFreeze(localData, cloudData),
    };
  }

  logger.info(`Merging data: local has ${Object.keys(localData.completions).length} days, cloud has ${cloudData.completions ? Object.keys(cloudData.completions).length : 0} days`);

  const mergedCompletions = { ...localData.completions };
  if (cloudData.completions) {
    Object.keys(cloudData.completions).forEach(dateStr => {
      const cloudDay = cloudData.completions[dateStr];
      const localDay = mergedCompletions[dateStr];
      if (!localDay) {
        mergedCompletions[dateStr] = cloudDay;
      } else if (cloudDay && typeof cloudDay === 'object') {
        const merged = { ...localDay };
        Object.keys(cloudDay).forEach(exId => {
          const cloudEx = cloudDay[exId];
          const localEx = merged[exId];
          
          // Use cloud version if it has a strictly newer timestamp,
          // or if local has a placeholder and cloud has a real timestamp.
          const localIsPlaceholder = localEx?.timestamp && typeof localEx.timestamp === 'object' && localEx.timestamp['.sv'];
          const cloudIsPlaceholder = cloudEx?.timestamp && typeof cloudEx.timestamp === 'object' && cloudEx.timestamp['.sv'];
          
          const localTs = getTimestamp(localEx?.timestamp, localIsPlaceholder);
          const cloudTs = getTimestamp(cloudEx?.timestamp, cloudIsPlaceholder);
          
          const cloudIsNewer = !localIsPlaceholder && cloudTs > localTs;
          const localHasNoTimestamp = (cloudEx?.timestamp && !localEx?.timestamp);
          const valuesMatch = localEx?.isCompleted === cloudEx?.isCompleted &&
            (localEx?.count === undefined || cloudEx?.count === undefined || localEx?.count === cloudEx?.count);
          const cloudReplacesPlaceholder = localIsPlaceholder && !cloudIsPlaceholder && cloudEx?.timestamp && valuesMatch;

          if (!localEx || cloudIsNewer || localHasNoTimestamp || cloudReplacesPlaceholder) {
            merged[exId] = { ...localEx, ...cloudEx };
          }
        });
        // Ensure local-only exercises (added offline) are preserved on shared days
        Object.keys(localDay).forEach(exId => {
          if (!merged[exId]) {
            merged[exId] = localDay[exId];
          }
        });
        mergedCompletions[dateStr] = merged;
      }
    });
  }

  const finalLCC = (cloudLCCTs > localLCCTs || (localLCCIsPlaceholder && !cloudLCCIsPlaceholder)) 
    ? cloudLCC 
    : localLCC;

  const mergedSessions = { 
    ...(localData.cardio?.sessions || {}), 
    ...(cloudData.cardio?.sessions || {}) 
  };

  const result = {
    startDate: localData.startDate || cloudData.startDate,
    userStartDate: localData.userStartDate || cloudData.userStartDate,
    completions: mergedCompletions,
    isSetup: localData.isSetup || cloudData.isSetup,
    lastCompletionChange: finalLCC,
    cardio: {
      ...localData.cardio,
      ...cloudData.cardio,
      sessions: mergedSessions
    },
    notes: { ...(localData.notes || {}), ...(cloudData.notes || {}) },
    ...mergeStreakFreeze(localData, cloudData),
  };

  logger.debug(`Merge complete. Final completion days: ${Object.keys(result.completions).length}`);
  return result;
}
