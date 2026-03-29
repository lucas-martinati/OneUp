import { ref, set, get, remove, push, onValue, serverTimestamp } from 'firebase/database';
import { createLogger } from '../utils/logger';
import { getAuthInstance, getDatabaseInstance } from './firebase';
import i18n from '../i18n';

const logger = createLogger('Clan');

export async function createClan(name) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) throw new Error('Not initialized');

  const uid = auth.currentUser.uid;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));

  const newClanRef = push(ref(database, 'clans'));
  const clanId = newClanRef.key;

  await set(newClanRef, { name, code, createdBy: uid, createdAt: serverTimestamp(), members: { [uid]: 'admin' } });
  await set(ref(database, `users/${uid}/clans/${clanId}`), 'admin');

  logger.success(`Clan ${name} created with code ${code}`);
  return { success: true, clanId, code };
}

export async function joinClan(code) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) throw new Error('Not initialized');

  const uid = auth.currentUser.uid;
  const cleanCode = code.toUpperCase().trim();

  const snapshot = await get(ref(database, 'clans'));
  if (!snapshot.exists()) return { success: false, error: 'Code invalide' };

  const clans = snapshot.val();
  let foundClanId = null;
  for (const [id, clan] of Object.entries(clans)) {
    if (clan.code === cleanCode) { foundClanId = id; break; }
  }
  if (!foundClanId) return { success: false, error: 'Code invalide' };

  const userClanSnapshot = await get(ref(database, `users/${uid}/clans/${foundClanId}`));
  if (userClanSnapshot.exists()) return { success: false, error: 'Tu es déjà dans ce clan' };

  await set(ref(database, `clans/${foundClanId}/members/${uid}`), 'member');
  await set(ref(database, `users/${uid}/clans/${foundClanId}`), 'member');

  logger.success(`Joined clan ${foundClanId}`);
  return { success: true, clanId: foundClanId };
}

export async function leaveClan(clanId) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) throw new Error('Not initialized');
  if (!clanId) return { success: false, error: 'ID de clan manquant' };

  const uid = auth.currentUser.uid;
  const userSnapshot = await get(ref(database, `users/${uid}/clans/${clanId}`));
  if (!userSnapshot.exists()) return { success: true };

  await remove(ref(database, `clans/${clanId}/members/${uid}`));
  await remove(ref(database, `users/${uid}/clans/${clanId}`));

  const clanSnapshot = await get(ref(database, `clans/${clanId}`));
  if (clanSnapshot.exists()) {
    const remainingMembers = clanSnapshot.val().members || {};
    if (Object.keys(remainingMembers).length === 0) {
      await remove(ref(database, `clans/${clanId}`));
      logger.success(`Clan ${clanId} deleted because it became empty.`);
    }
  }

  logger.success(`Left clan ${clanId} successfully`);
  return { success: true };
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
      pseudo: lbData.pseudo || 'Anonyme', photoURL: lbData.photoURL || null,
      totalReps: lbData.totalReps || 0, weightsTotalReps: lbData.weightsTotalReps || 0,
      exerciseReps: lbData.exerciseReps || {}, achievements: lbData.achievements || 0,
      lastActiveDay: lbData.lastActiveDay || null, difficultyMultiplier: lbData.difficultyMultiplier || 1,
      lastUpdated: lbData.lastUpdated || null,
      isSupporter: !!lbData.isSupporter, isPro: !!lbData.isPro,
      isCurrentUser: memberUid === uid
    };
  });

  members.sort((a, b) => b.totalReps - a.totalReps);
  return { id: clanId, name: clanData.name, code: clanData.code, members };
}

export async function sendClanNotification(targetUid, type = 'nudge', message = i18n.t('common.poke')) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return false;

  const fromUid = auth.currentUser.uid;
  const lbSnapshot = await get(ref(database, `leaderboard/${fromUid}`));
  const pseudo = lbSnapshot.exists() && lbSnapshot.val().pseudo ? lbSnapshot.val().pseudo : i18n.t('common.member');
  const photoURL = lbSnapshot.exists() && lbSnapshot.val().photoURL ? lbSnapshot.val().photoURL : null;

  const newNotifRef = push(ref(database, `notifications/${targetUid}`));
  await set(newNotifRef, { type, message, fromUid, fromName: pseudo, fromPhoto: photoURL, timestamp: serverTimestamp(), read: false });

  logger.success(`Nudge sent to ${targetUid}`);
  return true;
}

export function listenToNotifications(callback) {
  const auth = getAuthInstance();
  const database = getDatabaseInstance();
  if (!auth?.currentUser || !database) return null;

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
