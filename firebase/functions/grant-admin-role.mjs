/**
 * One-off bootstrap: grants the `{ admin: true }` custom claim to the ADMIN_UID
 * account. Run once after `npm run deploy:functions` — deploying alone does NOT
 * grant the claim; it must be created before the database rules (which gate on
 * `auth.token.admin === true`) will let the admin account through.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT=/path/to/serviceAccountKey.json \
 *   ADMIN_UID=<your-uid> node grant-admin-role.mjs
 *
 * The service account key is generated in the Firebase console
 * (Project settings → Service accounts → Generate new private key) and must
 * stay outside the repository.
 */
import { readFile } from 'node:fs/promises';
import admin from 'firebase-admin';

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT;
const adminUid = process.env.ADMIN_UID;

if (!serviceAccountPath || !adminUid) {
  console.error('Missing env vars: FIREBASE_SERVICE_ACCOUNT and ADMIN_UID are required.');
  process.exit(1);
}

const serviceAccount = JSON.parse(await readFile(serviceAccountPath, 'utf8'));

if (admin.apps.length === 0) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const existing = await admin.auth().getUser(adminUid);
if (!existing) {
  console.error(`No Firebase Auth user found for UID ${adminUid}.`);
  process.exit(1);
}

await admin.auth().setCustomUserClaims(adminUid, { admin: true });
const { customClaims } = await admin.auth().getUser(adminUid);
console.log('Claims after update:', customClaims);
console.log(`Claim { admin: true } granted to ${existing.email} (${adminUid}).`);
console.log('Now sign out / sign in again in the app (or getIdToken(true)) so the ID token carries the claim.');