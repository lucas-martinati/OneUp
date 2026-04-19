/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  ANNOUNCEMENT CONFIGURATION                                      ║
 * ║                                                                   ║
 * ║  ⚠️  CE FICHIER EST SUSCEPTIBLE DE CHANGER CONSTAMMENT.          ║
 * ║  Il peut être réécrit à chaque mise à jour de l'application.      ║
 * ║  Les traductions associées (announcement.*) dans les fichiers     ║
 * ║  i18n/locales/*.json suivront le même cycle de vie.               ║
 * ║                                                                   ║
 * ║  Les images dans /public/announcements/ sont aussi temporaires    ║
 * ║  et seront remplacées à chaque nouvelle annonce.                  ║
 * ╚════════════════════════════════════════════════════════════════════╝
 *
 * ── HOW TO USE ──
 * 1. Set `enabled: true` with a unique `id` and your content.
 * 2. The announcement shows ONCE per user (tracked in localStorage).
 * 3. It only shows to returning users (who already opened the app before).
 * 4. To disable the announcement, set `enabled: false`.
 * 5. To show a NEW announcement later, change the `id` to a new value.
 *
 * Fields:
 *   id       — unique string, change it for each new announcement
 *   enabled  — master toggle (set false to stop showing)
 *   emoji    — big emoji displayed at the top
 *   titleKey — i18n key for the title
 *   bodyKey  — i18n key for the body text
 *   ctaKey   — i18n key for the dismiss button label
 *   images   — optional array of image paths (relative to public/) to display
 */
const CURRENT_ANNOUNCEMENT = {
  id: 'widgets-v1',
  enabled: true,
  emoji: '📱',
  titleKey: 'announcement.widgets.title',
  bodyKey: 'announcement.widgets.body',
  ctaKey: 'announcement.widgets.cta',
  images: [
    '/announcements/widget_preview_small.png',
    '/announcements/widget_preview_large.png',
  ],
};

export default CURRENT_ANNOUNCEMENT;
