import { ref, set, get, remove, push, update, onValue, serverTimestamp, runTransaction } from 'firebase/database';
import { createLogger } from '../utils/logger';
import { getAuthInstance, getDatabaseInstance } from './firebase';
import i18n from '../i18n';

const logger = createLogger('Clan');

export async function createClan(name) {
  try {
    const auth = getAuthInstance();
    const database = getDatabaseInstance();
    if (!auth?.currentUser || !database) throw new Error('Not initialized');

    const uid = auth.currentUser.uid;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let attempts = 0;
    while (attempts < 5) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if code exists first (cheap local check before write)
      const codeSnapshot = await get(ref(database, `clanCodes/${code}`));
      if (!codeSnapshot.exists()) {
        try {
          const newClanRef = push(ref(database, 'clans'));
          const clanId = newClanRef.key;

          const updates = {};
          updates[`clans/${clanId}`] = { name, code, createdBy: uid, createdAt: serverTimestamp(), members: { [uid]: 'admin' } };
          updates[`clanCodes/${code}`] = clanId;
          updates[`users/${uid}/clans/${clanId}`] = 'admin';

          await update(ref(database), updates);

          logger.success(`Clan ${name} created with code ${code}`);
          return { success: true, clanId, code };
        } catch (err) {
          logger.warn(`Collision or write failure for code ${code}, retrying...`, err);
        }
      }
      attempts++;
    }

    throw new Error('Could not generate a unique clan code');
  } catch (error) {
    logger.error('Error creating clan:', error);
    return { success: false, error: i18n.t('clan.createError') };
  }
}

export async function joinClan(code) {
  try {
    const auth = getAuthInstance();
    const database = getDatabaseInstance();
    if (!auth?.currentUser || !database) throw new Error('Not initialized');

    const uid = auth.currentUser.uid;
    const cleanCode = code.toUpperCase().trim();

    // Direct lookup on the unique mapping table
    const codeSnapshot = await get(ref(database, `clanCodes/${cleanCode}`));
    if (!codeSnapshot.exists()) return { success: false, error: i18n.t('clan.invalidCode') };

    const foundClanId = codeSnapshot.val();

    // Verify clan exists
    const clanSnapshot = await get(ref(database, `clans/${foundClanId}`));
    if (!clanSnapshot.exists()) return { success: false, error: i18n.t('clan.invalidCode') };

    const userClanSnapshot = await get(ref(database, `users/${uid}/clans/${foundClanId}`));
    if (userClanSnapshot.exists()) return { success: false, error: i18n.t('clan.alreadyMember') };

    await set(ref(database, `clans/${foundClanId}/members/${uid}`), 'member');
    await set(ref(database, `users/${uid}/clans/${foundClanId}`), 'member');

    logger.success(`Joined clan ${foundClanId}`);
    return { success: true, clanId: foundClanId };
  } catch (error) {
    logger.error('Error joining clan:', error);
    return { success: false, error: i18n.t('clan.joinError') };
  }
}

export async function leaveClan(clanId) {
  try {
    const auth = getAuthInstance();
    const database = getDatabaseInstance();
    if (!auth?.currentUser || !database) throw new Error('Not initialized');
    if (!clanId) return { success: false, error: i18n.t('clan.missingId') };

    const uid = auth.currentUser.uid;
    const userSnapshot = await get(ref(database, `users/${uid}/clans/${clanId}`));
    if (!userSnapshot.exists()) return { success: true };

    await remove(ref(database, `clans/${clanId}/members/${uid}`));
    await remove(ref(database, `users/${uid}/clans/${clanId}`));

    const clanSnapshot = await get(ref(database, `clans/${clanId}`));
    if (clanSnapshot.exists()) {
      const clanData = clanSnapshot.val();
      const remainingMembers = clanData.members || {};
      if (Object.keys(remainingMembers).length === 0) {
        const updates = {};
        updates[`clans/${clanId}`] = null;
        if (clanData.code) {
          updates[`clanCodes/${clanData.code}`] = null;
        }
        await update(ref(database), updates);
        logger.success(`Clan ${clanId} deleted because it became empty.`);
      }
    }

    logger.success(`Left clan ${clanId} successfully`);
    return { success: true };
  } catch (error) {
    logger.error('Error leaving clan:', error);
    return { success: false, error: i18n.t('clan.leaveError') };
  }
}

export async function getUserClans() {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return [];

  const uid = auth.currentUser.uid;
  const userClansSnapshot = await get(ref(database, `users/${uid}/clans`));
  if (!userClansSnapshot.exists()) return [];

  const userClans = userClansSnapshot.val();
  const clansData = [];
  for (const clanId of Object.keys(userClans)) {
    const clanSnapshot = await get(ref(database, `clans/${clanId}`));
    if (clanSnapshot.exists()) {
      const data = clanSnapshot.val();
      clansData.push({
        id: clanId, name: data.name, code: data.code,
        role: userClans[clanId], memberCount: Object.keys(data.members || {}).length
      });
    }
  }
  return clansData;
}

export async function getClanDetails(clanId) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database || !clanId) return null;

  const uid = auth.currentUser.uid;
  const clanSnapshot = await get(ref(database, `clans/${clanId}`));
  if (!clanSnapshot.exists()) return null;

  const clanData = clanSnapshot.val();
  const lbSnapshot = await get(ref(database, 'leaderboard'));
  const leaderboards = lbSnapshot.exists() ? lbSnapshot.val() : {};

  const members = Object.keys(clanData.members || {}).map(memberUid => {
    const lbData = leaderboards[memberUid] || {};
    return {
      uid: memberUid, role: clanData.members[memberUid],
      pseudo: lbData.pseudo || i18n.t('common.anonymous'), photoURL: lbData.photoURL || null,
      totalReps: lbData.totalReps || 0, weightsTotalReps: lbData.weightsTotalReps || 0,
      exerciseReps: lbData.exerciseReps || {}, achievements: lbData.achievements || 0,
      lastActiveDay: lbData.lastActiveDay || null, difficultyMultiplier: lbData.difficultyMultiplier || 1,
      lastUpdated: lbData.lastUpdated || null,
      isSupporter: !!lbData.isSupporter, isPro: !!lbData.isPro,
      isPerfectToday: !!lbData.isPerfectToday,
      shieldGreen: !!lbData.shieldGreen,
      shieldOrange: !!lbData.shieldOrange,
      shieldDate: lbData.shieldDate || null,
      isCurrentUser: memberUid === uid
    };
  });

  members.sort((a, b) => b.totalReps - a.totalReps);
  return { id: clanId, name: clanData.name, code: clanData.code, members };
}

/**
 * Send a poke to another user. Pokes are aggregated into a single node per
 * sender (`notifications/{target}/{fromUid}`): repeated pokes just bump a
 * `count` via a transaction, instead of pushing an unbounded list of nodes.
 * This keeps the data self-grouping, bounded, and cheap to clear.
 */
export async function sendPoke(targetUid, type = 'nudge', message = i18n.t('common.poke')) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database || !targetUid) return false;

  const fromUid = auth.currentUser.uid;
  if (targetUid === fromUid) return false; // can't poke yourself

  // Best-effort sender identity; falls back gracefully if the read fails.
  let fromName = i18n.t('common.member');
  let fromPhoto = null;
  try {
    const lb = await get(ref(database, `leaderboard/${fromUid}`));
    if (lb.exists()) {
      const v = lb.val();
      if (v.pseudo) fromName = v.pseudo;
      if (v.photoURL) fromPhoto = v.photoURL;
    }
  } catch { /* keep fallback identity */ }

  try {
    const notifRef = ref(database, `notifications/${targetUid}/${fromUid}`);
    await runTransaction(notifRef, (current) => ({
      type,
      message,
      fromUid,
      fromName,
      fromPhoto,
      count: (current?.count || 0) + 1,
      timestamp: Date.now(),
      read: false,
    }));
    logger.success(`Poke sent to ${targetUid}`);
    return true;
  } catch (e) {
    logger.error?.(`Poke failed: ${e?.message || e}`);
    return false;
  }
}

export function listenToNotifications(callback) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

  // Children are keyed by sender uid; each carries an aggregated `count`.
  return onValue(ref(database, `notifications/${auth.currentUser.uid}`), (snapshot) => {
    if (snapshot.exists()) {
      const notifs = [];
      snapshot.forEach((child) => notifs.push({ id: child.key, ...child.val() }));
      callback(notifs);
    } else {
      callback([]);
    }
  });
}

export async function deleteNotification(notifId) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  await remove(ref(database, `notifications/${auth.currentUser.uid}/${notifId}`));
  return true;
}
