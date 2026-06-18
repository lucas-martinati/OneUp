import { useTranslation } from 'react-i18next';
import { GoogleIcon } from './GoogleIcon';

/**
 * The single "Sign in with Google" button used across the app (CloudSyncPanel,
 * Leaderboard, ClanManager, …). Centralised so the brand mark, copy and styling
 * live in one place — and so future auth providers can be added here once.
 *
 * `label` overrides the default "Sign in with Google" copy.
 */
export function GoogleSignInButton({ onClick, disabled = false, label, className = '', style }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className={`btn-cloud-signin ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      <GoogleIcon className="google-icon" />
      {label ?? t('cloud.signInWithGoogle')}
    </button>
  );
}
