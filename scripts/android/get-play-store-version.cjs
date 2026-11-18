const { google } = require('googleapis');

/**
 * Fetches the highest versionCode currently uploaded to any track on Google Play.
 * - Default: returns highest phone versionCode (< 1000000).
 * - With `--wear`: returns highest Wear OS versionCode (>= 1000000, default 1000000).
 * Requires SERVICE_ACCOUNT_JSON and PACKAGE_NAME environment variables.
 */
async function getLatestVersion() {
  const serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON;
  const packageName = process.env.PACKAGE_NAME;
  const isWear = process.argv.includes('--wear');

  if (!serviceAccountJson || !packageName) {
    console.error('❌ Error: SERVICE_ACCOUNT_JSON or PACKAGE_NAME not provided.');
    process.exit(1);
  }

  const credentials = JSON.parse(serviceAccountJson);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  let editId = null;
  const authClient = await auth.getClient();
  const publisher = google.androidpublisher({
    version: 'v3',
    auth: authClient,
  });

  try {
    const edit = await publisher.edits.insert({ packageName });
    editId = edit.data.id;

    const tracksRes = await publisher.edits.tracks.list({
      packageName,
      editId,
    });

    let maxPhoneCode = 0;
    let maxWearCode = 1000000;

    if (tracksRes.data.tracks) {
      for (const track of tracksRes.data.tracks) {
        const isWearTrack = typeof track.track === 'string' && track.track.startsWith('wear:');
        if (track.releases) {
          for (const release of track.releases) {
            if (release.versionCodes) {
              for (const code of release.versionCodes) {
                const c = parseInt(code, 10);
                if (isWearTrack || c >= 1000000) {
                  if (c > maxWearCode) maxWearCode = c;
                } else if (c > maxPhoneCode) {
                  maxPhoneCode = c;
                }
              }
            }
          }
        }
      }
    }

    console.log(isWear ? maxWearCode : maxPhoneCode);
  } catch (err) {
    console.error('❌ Error fetching version from Play Store:', err.message);
    process.exit(1);
  } finally {
    if (editId) {
      await publisher.edits.delete({ packageName, editId }).catch(() => {});
    }
  }
}

getLatestVersion();
