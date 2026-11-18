const fs = require('fs');
const { google } = require('googleapis');

/**
 * Uploads the Wear OS AAB to the `wear:production` track on Google Play.
 * Automatically tries full rollout (`status: completed`) first, and falls back
 * to `changesNotSentForReview: true` or `status: draft` if Google Play Console
 * requires a manual first-time Wear OS form-factor review/checklist completion.
 */
async function deployWear() {
  const serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON;
  const packageName = process.env.PACKAGE_NAME || 'com.lucasm548.oneup';
  const aabPath =
    process.env.WEAR_AAB_PATH ||
    'android/wear/build/outputs/bundle/prodRelease/wear-prod-release.aab';
  const versionName = process.env.VERSION_NAME || '3.5.0';
  const notesFr = (process.env.NOTES_FR || '').trim();
  const notesEn = (process.env.NOTES_EN || '').trim();
  const sendForReview = process.env.SEND_FOR_REVIEW !== 'false';
  const trackName = process.env.WEAR_TRACK || 'wear:production';

  if (!serviceAccountJson) {
    console.error('❌ Error: SERVICE_ACCOUNT_JSON not provided.');
    process.exit(1);
  }
  if (!fs.existsSync(aabPath)) {
    console.error(`❌ Error: Wear AAB not found at ${aabPath}`);
    process.exit(1);
  }

  const releaseNotes = [];
  if (notesFr) releaseNotes.push({ language: 'fr-FR', text: notesFr });
  if (notesEn) releaseNotes.push({ language: 'en-US', text: notesEn });

  const credentials = JSON.parse(serviceAccountJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const authClient = await auth.getClient();
  const publisher = google.androidpublisher({
    version: 'v3',
    auth: authClient,
  });

  let editId = null;
  try {
    console.log(`⌚ Creating Google Play edit for ${packageName} (${trackName})...`);
    const edit = await publisher.edits.insert({ packageName });
    editId = edit.data.id;

    console.log(`📦 Uploading Wear OS bundle: ${aabPath}...`);
    const uploadRes = await publisher.edits.bundles.upload({
      packageName,
      editId,
      media: {
        mimeType: 'application/octet-stream',
        body: fs.createReadStream(aabPath),
      },
    });

    const versionCode = uploadRes.data.versionCode;
    console.log(`✅ Uploaded Wear OS AAB versionCode=${versionCode}`);

    const attempts = sendForReview
      ? [
          { status: 'completed', changesNotSentForReview: false },
          { status: 'completed', changesNotSentForReview: true },
          { status: 'draft', changesNotSentForReview: false },
          { status: 'draft', changesNotSentForReview: true },
        ]
      : [
          { status: 'completed', changesNotSentForReview: true },
          { status: 'draft', changesNotSentForReview: true },
          { status: 'draft', changesNotSentForReview: false },
        ];

    let committed = false;
    let lastError = null;

    for (const attempt of attempts) {
      try {
        console.log(
          `🚀 Assigning versionCode ${versionCode} to ${trackName} (status=${attempt.status}, changesNotSentForReview=${attempt.changesNotSentForReview})...`
        );
        const releaseObj = {
          name: `${versionName} (${versionCode})`,
          versionCodes: [String(versionCode)],
          status: attempt.status,
        };
        if (releaseNotes.length > 0) {
          releaseObj.releaseNotes = releaseNotes;
        }

        await publisher.edits.tracks.update({
          packageName,
          editId,
          track: trackName,
          requestBody: {
            track: trackName,
            releases: [releaseObj],
          },
        });

        await publisher.edits.commit({
          packageName,
          editId,
          changesNotSentForReview: attempt.changesNotSentForReview,
        });

        console.log(
          `🎉 Successfully deployed Wear OS release ${versionName} (${versionCode}) to ${trackName} [status=${attempt.status}]!`
        );
        committed = true;
        editId = null;
        break;
      } catch (err) {
        lastError = err;
        console.warn(
          `⚠️ Attempt (status=${attempt.status}, changesNotSentForReview=${attempt.changesNotSentForReview}) rejected: ${err.message}`
        );
      }
    }

    if (!committed) {
      throw lastError || new Error('All Wear OS deployment attempts failed.');
    }
  } catch (err) {
    console.error('❌ Failed to deploy Wear OS bundle:', err.message);
    process.exit(1);
  } finally {
    if (editId) {
      await publisher.edits.delete({ packageName, editId }).catch(() => {});
    }
  }
}

deployWear();
