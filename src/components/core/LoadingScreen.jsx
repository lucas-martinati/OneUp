import { useTranslation } from 'react-i18next';

/**
 * Full-screen loading indicator shown during app initialization
 * and as the Suspense fallback for lazy-loaded routes.
 */
export function LoadingScreen() {
  const { t } = useTranslation();

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#050505',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: '600'
    }}>
      {t('app.initializing')}
    </div>
  );
}
