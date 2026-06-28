import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Rocket, ArrowRight, X } from '@utils/icons';
import { isNativePlatform } from '@utils/platform';
import { APP_URL, APP_URL_DISPLAY } from '@config/app';

// Dismissal is kept per-session only: the user should keep being reminded on
// later visits until they actually move to the new domain.
const DISMISS_KEY = 'oneup_migration_dismissed';

/**
 * Detects whether the app is being served from a legacy origin (e.g. the old
 * GitHub Pages domain) instead of the canonical APP_URL host. Local data is
 * origin-scoped, so users stranded on the old origin neither get updates nor
 * see their data on the new one — this nudges them to move.
 *
 * Returns false on native (the bundled app has no "old domain") and on
 * localhost / dev, and whenever no canonical host is configured.
 */
function isLegacyOrigin() {
  if (isNativePlatform() || typeof window === 'undefined') return false;
  if (!APP_URL_DISPLAY) return false;
  const host = window.location.hostname;
  if (!host || host === 'localhost' || host === '127.0.0.1') return false;
  const canonical = APP_URL_DISPLAY.replace(/^www\./, '');
  return host.replace(/^www\./, '') !== canonical;
}

/**
 * In-flow "we moved" banner. Mount it alongside {@link OfflineBanner} at the top
 * of the dashboard shell. Renders nothing on the canonical domain / native /
 * dev, so it costs nothing for the vast majority of sessions.
 */
export function MigrationBanner() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed || !isLegacyOrigin()) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* sessionStorage may be unavailable (private mode) — dismiss in-memory. */
    }
    setDismissed(true);
  };

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
        boxShadow: '0 4px 14px rgba(109,40,217,0.35)',
        color: '#fff',
        flexShrink: 0,
      }}
    >
      <Rocket size={18} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.3 }}>
        <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>
          {t('migration.title', { host: APP_URL_DISPLAY })}
        </div>
        <div style={{ fontSize: '0.72rem', opacity: 0.92 }}>
          {t('migration.message')}
        </div>
      </div>
      <a
        href={APP_URL}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '7px 12px',
          borderRadius: '999px',
          background: 'rgba(255,255,255,0.18)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.75rem',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {t('migration.button')}
        <ArrowRight size={14} />
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t('common.close')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          border: 'none',
          background: 'transparent',
          color: '#fff',
          cursor: 'pointer',
          opacity: 0.8,
          flexShrink: 0,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
