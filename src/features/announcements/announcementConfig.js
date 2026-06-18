/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  ANNOUNCEMENT CONFIGURATION                                      ║
 * ║                                                                   ║
 * ║  ⚠️  CE FICHIER EST SUSCEPTIBLE DE CHANGER CONSTAMMENT.          ║
 * ║  Il peut être réécrit à chaque mise à jour de l'application.      ║
 * ║                                                                   ║
 * ║  Les images dans /public/announcements/ sont aussi temporaires    ║
 * ║  et seront remplacées à chaque nouvelle annonce.                  ║
 * ╚════════════════════════════════════════════════════════════════════╝
 *
 * ── CONVENTION i18n ──
 * Les textes vivent à PLAT sous la clé `announcement.*` dans
 * src/i18n/locales/*.json (announcement.title, announcement.body,
 * announcement.cta, announcement.highlights.*).
 *
 * Il n'y a JAMAIS de sous-objet par annonce (pas de `announcement.cardio.*`
 * ni `announcement.uiRefresh.*`). À chaque nouvelle annonce, on REMPLACE
 * entièrement le contenu de `announcement.*` : on n'accumule pas les
 * anciennes annonces, on les écrase. Les clés ci-dessous pointent donc
 * toujours vers le même emplacement, quel que soit le sujet de l'annonce.
 *
 * ── HOW TO USE ──
 * 1. Set `enabled: true` with a unique `id` and your content.
 * 2. The announcement shows ONCE per user (tracked in localStorage).
 * 3. It only shows to returning users (who already opened the app before).
 * 4. To disable the announcement, set `enabled: false`.
 * 5. To show a NEW announcement later, change the `id` to a new value
 *    AND rewrite the `announcement.*` strings in every locale file.
 *
 * Fields:
 *   id       — unique string, change it for each new announcement
 *   enabled  — master toggle (set false to stop showing)
 *   emoji    — big emoji displayed at the top
 *   titleKey — i18n key for the title
 *   bodyKey  — i18n key for the body text
 *   ctaKey   — i18n key for the dismiss button label
 *   highlights — optional array of { emoji, key } feature rows (i18n keys)
 *   images   — optional array of image paths (relative to public/) to display
 */
const CURRENT_ANNOUNCEMENT = {
  id: 'ui-refresh-v1',
  enabled: true,
  emoji: '✨',
  titleKey: 'announcement.title',
  bodyKey: 'announcement.body',
  ctaKey: 'announcement.cta',
  highlights: [
    { emoji: '🎨', key: 'announcement.highlights.design' },
    { emoji: '⚡', key: 'announcement.highlights.motion' },
    { emoji: '🧩', key: 'announcement.highlights.components' },
    { emoji: '🚀', key: 'announcement.highlights.onboarding' },
  ],
  images: [],
};

export default CURRENT_ANNOUNCEMENT;
