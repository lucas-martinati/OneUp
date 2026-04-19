import { useState, useEffect } from 'react';
import CURRENT_ANNOUNCEMENT from './announcementConfig';

const STORAGE_PREFIX = 'announcement_seen_';
const RETURNING_USER_KEY = 'oneup_has_opened';

/**
 * Hook that manages announcement visibility.
 *
 * Logic:
 *  - On FIRST ever app open, marks the user as "has opened" but does NOT show
 *    the announcement (new users shouldn't see it).
 *  - On subsequent opens, if the current announcement is enabled and hasn't
 *    been dismissed yet (by this id), it shows.
 *  - Once dismissed, the id is saved so it never shows again.
 *
 * @returns {{ showAnnouncement: boolean, announcement: object, dismissAnnouncement: () => void }}
 */
export function useAnnouncement() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!CURRENT_ANNOUNCEMENT.enabled) return;

    const hasOpenedBefore = localStorage.getItem(RETURNING_USER_KEY);

    if (!hasOpenedBefore) {
      // First ever app open → mark as returning for next time, but don't show
      localStorage.setItem(RETURNING_USER_KEY, '1');
      return;
    }

    // Returning user → check if this announcement was already seen
    const seenKey = STORAGE_PREFIX + CURRENT_ANNOUNCEMENT.id;
    const alreadySeen = localStorage.getItem(seenKey);

    if (!alreadySeen) {
      // Small delay so the app renders first, then the announcement slides in
      const timer = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    const seenKey = STORAGE_PREFIX + CURRENT_ANNOUNCEMENT.id;
    localStorage.setItem(seenKey, '1');
  };

  return {
    showAnnouncement: show,
    announcement: CURRENT_ANNOUNCEMENT,
    dismissAnnouncement: dismiss,
  };
}
