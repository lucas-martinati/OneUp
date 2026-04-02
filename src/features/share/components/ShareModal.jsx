import React from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Download, X, Loader2 } from 'lucide-react';
import { Z_INDEX } from '../../../utils/zIndex';
import { ShareCard } from './ShareCard';
import { ShareOptions } from './ShareOptions';
import { canShareNatively } from '../services/shareService';

export function ShareModal({ shareHook, onClose, isPro = false }) {
  const { t } = useTranslation();
  const {
    cardRef, options, toggleOption, setOption, toggleCategory,
    exportCard, shareCard, isExporting,
    sessionData, stats, sessionHistory, mode,
  } = shareHook;

  const handleShare = async () => { await shareCard(); };
  const handleDownload = async () => { await exportCard(); };

  return (
    <div className="fade-in" style={{
      position: 'fixed', inset: 0,
      background: 'rgba(5,5,5,0.97)',
      zIndex: Z_INDEX.TOAST,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {/* Header */}
      <div style={{
        width: '100%', maxWidth: '400px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px 8px',
      }}>
        <h2 style={{
          margin: 0, fontSize: '1.3rem', fontWeight: 800,
          background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {t('share.title', 'Partager')}
        </h2>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none',
          borderRadius: '50%', width: '36px', height: '36px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', cursor: 'pointer',
        }}>
          <X size={20} />
        </button>
      </div>

      {/* Card preview - full width, scroll if too tall */}
      <div style={{
        width: '100%', maxWidth: '400px',
        padding: '0 20px 12px',
      }}>
        <div ref={cardRef} style={{ width: '100%' }}>
          <ShareCard
            cardRef={cardRef}
            sessionData={sessionData}
            stats={stats}
            sessionHistory={sessionHistory}
            options={options}
            mode={mode}
          />
        </div>
      </div>

      {/* Options */}
      <div style={{
        width: '100%', maxWidth: '400px',
        padding: '8px 20px',
      }}>
        <ShareOptions
          options={options}
          toggleOption={toggleOption}
          setOption={setOption}
          toggleCategory={toggleCategory}
          mode={mode}
          isPro={isPro}
          sessionData={sessionData}
        />
      </div>

      {/* Action buttons */}
      <div style={{
        width: '100%', maxWidth: '400px',
        padding: '8px 20px 24px',
        display: 'flex', gap: '10px',
      }}>
        <button
          onClick={handleDownload}
          disabled={isExporting}
          className="hover-lift"
          style={{
            flex: 1, padding: '14px', borderRadius: '14px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'white', fontSize: '0.85rem', fontWeight: 700,
            cursor: isExporting ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', opacity: isExporting ? 0.5 : 1,
          }}
        >
          {isExporting ? <Loader2 size={18} className="spin" /> : <Download size={18} />}
          {t('share.download', 'T\u00e9l\u00e9charger')}
        </button>
        <button
          onClick={handleShare}
          disabled={isExporting}
          className="hover-lift"
          style={{
            flex: 1, padding: '14px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #818cf8, #6366f1)',
            border: 'none',
            color: 'white', fontSize: '0.85rem', fontWeight: 700,
            cursor: isExporting ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', opacity: isExporting ? 0.7 : 1,
          }}
        >
          {isExporting ? <Loader2 size={18} className="spin" /> : <Share2 size={18} />}
          {canShareNatively()
            ? t('share.share', 'Partager')
            : t('share.download', 'T\u00e9l\u00e9charger')}
        </button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
