import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CloudOff, Check } from '@utils/icons';
import { useNetworkStatus } from '@hooks/useNetworkStatus';

// How long the green "back online" confirmation stays before collapsing away.
const RECONNECTED_MS = 2600;

/**
 * In-flow connectivity banner.
 *
 * Unlike a floating overlay, this lives in the document flow and animates its
 * real height (grid-template-rows 0fr→1fr), so it physically pushes the content
 * below it down — smoothly on the way in and on the way out, mirroring how
 * Google surfaces "No internet" / "Back online".
 *
 * States:
 *  - offline      → red strip with the "sessions will sync" reminder,
 *  - reconnected  → green strip, shown briefly then collapses on its own,
 *  - hidden       → renders nothing (no leftover space / flex gap).
 *
 * Mount it as the first child of a flex-column (the dashboard shell, the
 * exercise panel). Driven by {@link useNetworkStatus}, so it also reacts to the
 * `oneup-debug-network` event from the OneUp debug console.
 *
 * Steady state when online is `null` (zero render cost), and it never runs a
 * continuous animation — only one-shot transitions on appear/disappear — so it
 * keeps the long-lived exercise panel cool.
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const isOnline = useNetworkStatus();

  // 'hidden' | 'offline' | 'reconnected' — drives the open/closed height.
  const [status, setStatus] = useState(isOnline ? 'hidden' : 'offline');
  // The visual variant (colour + text). Tracked separately from `status` so it
  // stays put while the banner collapses — otherwise the green "reconnected"
  // strip would flash back to red during its own closing animation.
  const [variant, setVariant] = useState('offline');
  // Kept mounted through the collapse transition, then unmounted so we leave no
  // empty space behind.
  const [mounted, setMounted] = useState(!isOnline);
  const wasOnlineRef = useRef(isOnline);

  useEffect(() => {
    // Defer state updates a frame so we never setState synchronously inside the
    // effect body (avoids cascading renders). Mounting collapsed first, then
    // expanding on the next frame, lets the height transition animate from 0.
    if (!isOnline) {
      wasOnlineRef.current = false;
      let raf2;
      const raf1 = requestAnimationFrame(() => {
        setVariant('offline');
        setMounted(true);
        raf2 = requestAnimationFrame(() => setStatus('offline'));
      });
      return () => { cancelAnimationFrame(raf1); if (raf2) cancelAnimationFrame(raf2); };
    }
    // Only flash the green confirmation when we actually recover from offline.
    if (wasOnlineRef.current === false) {
      wasOnlineRef.current = true;
      const raf = requestAnimationFrame(() => { setVariant('reconnected'); setStatus('reconnected'); });
      const id = setTimeout(() => setStatus('hidden'), RECONNECTED_MS);
      return () => { cancelAnimationFrame(raf); clearTimeout(id); };
    }
    wasOnlineRef.current = true;
    return undefined;
  }, [isOnline]);

  if (!mounted) return null;

  const open = status !== 'hidden';
  const reconnected = variant === 'reconnected';

  return (
    <div
      aria-hidden={!open}
      onTransitionEnd={(e) => {
        // Once fully collapsed, drop out of the flow entirely.
        if (e.propertyName === 'grid-template-rows' && !open) setMounted(false);
      }}
      style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.36s cubic-bezier(0.22,1,0.36,1)',
        flexShrink: 0,
      }}
    >
      <div style={{ overflow: 'hidden', minHeight: 0 }}>
        <div
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            fontWeight: 600,
            lineHeight: 1.3,
            textAlign: 'center',
            color: '#fff',
            background: reconnected
              ? 'linear-gradient(135deg, #16a34a, #22c55e)'
              : 'linear-gradient(135deg, #dc2626, var(--error))',
            boxShadow: reconnected
              ? '0 4px 14px rgba(34,197,94,0.35)'
              : '0 4px 14px rgba(239,68,68,0.32)',
            transition: 'background 0.4s ease, box-shadow 0.4s ease',
          }}
        >
          {reconnected ? <Check size={16} /> : <CloudOff size={16} />}
          <span>{reconnected ? t('cloud.backOnline') : t('cloud.offlineMessage')}</span>
        </div>
      </div>
    </div>
  );
}
