import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, X } from '@utils/icons';
import { useAuth } from '@contexts/AuthContext';
import { GoogleIcon } from '@components/ui/GoogleIcon';
import { Button } from '@components/ui';

const DISMISS_KEY = 'oneup_guest_cloud_banner_dismissed';

/**
 * GuestCloudBackupBanner — Subtle, theme-integrated banner for guest users
 * with streak or reps progress. Fits naturally into the dashboard flow using
 * muted glass surfaces and standard tokens.
 */
export function GuestCloudBackupBanner({ displayStreak = 0, totalReps = 0 }) {
  const { t } = useTranslation();
  const auth = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (auth.isSignedIn || (displayStreak <= 0 && totalReps <= 0) || dismissed) {
    return null;
  }

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* fallback in-memory */
    }
    setDismissed(true);
  };

  const handleSignIn = async () => {
    try {
      if (typeof auth?.signIn === 'function') {
        await auth.signIn();
      }
    } catch {
      /* error is handled within AuthContext */
    }
  };

  return (
    <div
      role="region"
      aria-label={t('cloud.backupBannerTitle')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-section)',
        border: '1px solid var(--border-default)',
        color: 'var(--text-primary)',
        boxShadow: 'var(--shadow-sm)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      <Cloud size={18} style={{ color: 'var(--accent-glow)', flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
        <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
          {t('cloud.backupBannerTitle')}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
          {t('cloud.backupBannerSubtitle')}
        </div>
      </div>

      <Button
        variant="ghost"
        onClick={handleSignIn}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          height: '30px',
          borderRadius: 'var(--radius-full)',
          background: isHovered ? 'rgba(255, 255, 255, 0.95)' : '#ffffff',
          border: 'none',
          color: '#0f172a',
          fontWeight: 600,
          fontSize: '0.75rem',
          fontFamily: 'inherit',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          boxSizing: 'border-box',
          lineHeight: 1,
          transition: 'background 0.2s ease, opacity 0.2s ease',
          opacity: isHovered ? 0.92 : 1,
        }}
      >
        <GoogleIcon size={14} />
        <span style={{ fontSize: '0.75rem', lineHeight: 1 }}>
          {t('cloud.backupButton')}
        </span>
      </Button>

      <Button
        variant="ghost"
        onClick={dismiss}
        aria-label={t('common.close')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-tertiary)',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <X size={16} />
      </Button>
    </div>
  );
}
