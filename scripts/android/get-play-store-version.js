import { google } from 'googleapis';

/**
 * Fetches the highest versionCode currently uploaded to any track on Google Play.
 * Requires SERVICE_ACCOUNT_JSON and PACKAGE_NAME environment variables.
 */
async function getLatestVersion() {
  const serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON;
  const packageName = process.env.PACKAGE_NAME;

  if (!serviceAccountJson || !packageName) {
    console.error('❌ Error: SERVICE_ACCOUNT_JSON or PACKAGE_NAME not provided.');
    process.exit(1);
  }

  const credentials = JSON.parse(serviceAccountJson);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  try {
    const authClient = await auth.getClient();
    const publisher = google.androidpublisher({
      version: 'v3',
      auth: authClient,
    });

    // We need to create an "edit" to list tracks
    const edit = await publisher.edits.insert({ packageName });
    const editId = edit.data.id;

    const tracksRes = await publisher.edits.tracks.list({
      packageName,
      editId,
    });

    let maxCode = 0;
    if (tracksRes.data.tracks) {
      for (const track of tracksRes.data.tracks) {
        if (track.releases) {
          for (const release of track.releases) {
            if (release.versionCodes) {
              for (const code of release.versionCodes) {
                const c = parseInt(code, 10);
                if (c > maxCode) maxCode = c;
              }
            }
          }
        }
      }
    }

    // Cleanup: delete the temporary edit
    await publisher.edits.delete({ packageName, editId });

    // Output the max code to stdout so the workflow can capture it
    console.log(maxCode);
  } catch (err) {
    console.error('❌ Error fetching version from Play Store:', err.message);
    // If we can't reach the store, we'll exit with 0 but print 0 to allow the workflow to fallback
    // Actually, exiting with 1 is safer to let the workflow know there's a real issue
    process.exit(1);
  }
}

getLatestVersion();
