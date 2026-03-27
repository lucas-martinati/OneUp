const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK using Default Compute Service Account
admin.initializeApp();
const db = admin.database();

/**
 * onRevenueCatWebhook
 * Listens for RevenueCat subscription events and updates Firebase Realtime Database.
 * Endpoint URL: https://<REGION>-<PROJECT_ID>.cloudfunctions.net/onRevenueCatWebhook
 */
exports.onRevenueCatWebhook = onRequest(async (req, res) => {
  // Reject non-POST requests immediately
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const event = req.body?.event;
    if (!event) {
      res.status(400).send("Bad Request: Missing 'event' payload");
      return;
    }

    const { type, app_user_id, entitlement_ids } = event;

    // We only process lifecycle events that alter boolean entitlement status
    const actionableEvents = [
      "INITIAL_PURCHASE",
      "RENEWAL",
      "UNCANCELLATION",  // User resumed before expiration
      "TRANSFER",        // Subscription moved to another UI
      "EXPIRATION"
    ];

    if (!actionableEvents.includes(type)) {
      // NOTE: CANCELLATION is ignored because canceling auto-renew does NOT revoke access until EXPIRATION.
      res.status(200).send(`Event type ${type} ignored by design.`);
      return;
    }

    if (!app_user_id) {
      res.status(400).send("Missing app_user_id in RevenueCat payload");
      return;
    }

    // Determine target boolean status:
    // If purchased or renewed, isActive is true. If expired, isActive is false.
    const isActive = ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "TRANSFER"].includes(type);

    const updatePayload = {};

    // Map RevenueCat custom Entitlements back to OneUp database fields
    if (entitlement_ids && entitlement_ids.length > 0) {
      entitlement_ids.forEach((entId) => {
        const key = entId.toLowerCase();
        if (key === "pro") updatePayload.isPro = isActive;
        if (key === "club") updatePayload.isClub = isActive;
        if (key === "supporter") updatePayload.isSupporter = isActive;
      });
    } else {
      res.status(200).send("No entitlements specified in event");
      return;
    }

    // If no matching OneUp tiers were found within this payload
    if (Object.keys(updatePayload).length === 0) {
      res.status(200).send("No OneUp compatible tiers found");
      return;
    }

    console.log(`[RevenueCat DB Update] UID ${app_user_id} | Type: ${type} ->`, updatePayload);

    // Apply the update selectively to BOTH Firebase nodes
    const profileRef = db.ref(`users/${app_user_id}/purchase`);
    const leaderboardRef = db.ref(`leaderboard/${app_user_id}`);

    // Update private profile
    await profileRef.update(updatePayload);
    
    // For leaderboard, we only update IF the user ALREADY exists.
    // We do not want to force-create a dummy leaderboard entry for private users.
    const lbSnapshot = await leaderboardRef.once("value");
    if (lbSnapshot.exists()) {
      await leaderboardRef.update(updatePayload);
    }

    res.status(200).send("Webhook processed successfully");

  } catch (error) {
    console.error("Critical Webhook Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
