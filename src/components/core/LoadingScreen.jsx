import { useTranslation } from 'react-i18next';
import { Skeleton } from '@components/ui';

/**
 * Full-screen splash loading indicator shown during app initialization
 * and as the Suspense fallback for lazy-loaded routes.
 * Mirrors the static HTML skeleton in index.html for a 100% smooth, single-screen transition.
 */
export function LoadingScreen() {
  const { t } = useTranslation();

  return (
    <div className="splash-screen">
      <div className="splash-logo-wrap">
        <img src="/logo-64x64.webp" alt="OneUp" className="splash-logo" width="48" height="48" fetchPriority="high" />
      </div>
      <div className="splash-title">OneUp</div>
      <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.55)', fontWeight: '500', marginTop: '-4px' }}>
        {t('app.initializing')}
      </div>
      <Skeleton width="120px" height="3px" borderRadius="3px" style={{ marginTop: '6px' }} />
    </div>
  );
}
