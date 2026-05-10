import React from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Download, X, Loader2 } from '../../../utils/icons';
import { Z_INDEX } from '../../../utils/zIndex';
import { ShareCard } from './ShareCard';
import { ShareOptions } from './ShareOptions';
import { CropModal } from './CropModal';
import { canShareNatively } from '../services/shareService';
import { useProgressStore } from '../../../store/useProgressStore';

export function ShareModal({ shareHook, onClose, isPro = false, completions = {}, getDayNumber, settings }) {
  const { t } = useTranslation();
  const hasShared = useProgressStore(s => s.hasShared);
  const setHasShared = useProgressStore(s => s.setHasShared);
  const {
    cardRef, options, toggleOption, setOption, toggleCategory,
    setBackgroundImage, clearBackgroundImage,
    originalImage, cropData, isCropModalOpen, openCropModal, closeCropModal, applyCrop,
    exportCard, shareCard, isExporting,
    sessionData, stats, sessionHistory, mode,
  } = shareHook;

  const handleShareSuccess = () => {
    if (!hasShared) {
      setHasShared();
      // Trigger achievement toast via global event (listened by Dashboard's useAchievementToast)
      window.dispatchEvent(new CustomEvent('show-achievement', { detail: { badgeId: 'first_share' } }));
    }
  };

  const handleShare = async () => { 
    await shareCard(); 
    handleShareSuccess();
  };
  const handleDownload = async () => { 
    await exportCard(); 
    handleShareSuccess();
  };

  return (
    <div className="fade-in modal-overlay" style={{ zIndex: Z_INDEX.TOAST }}>
      <div className="modal-content">
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 0 8px',
      }}>
        <h2 className="panel-title" style={{
          margin: 0,
          background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {t('common.share')}
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

      {/* Card preview */}
      <div style={{
        padding: '0 0 12px', display: 'flex', justifyContent: 'center',
      }}>
          <ShareCard
            cardRef={cardRef}
            sessionData={sessionData}
            stats={stats}
            sessionHistory={sessionHistory}
            completions={completions}
            getDayNumber={getDayNumber}
            settings={settings}
            options={options}
            mode={mode}
          />
      </div>

      {/* Options */}
      <div style={{
        padding: '8px 0',
      }}>
        <ShareOptions
          options={options}
          toggleOption={toggleOption}
          setOption={setOption}
          toggleCategory={toggleCategory}
          setBackgroundImage={setBackgroundImage}
          clearBackgroundImage={clearBackgroundImage}
          originalImage={originalImage}
          cropData={cropData}
          openCropModal={openCropModal}
          mode={mode}
          isPro={isPro}
          sessionData={sessionData}
        />
      </div>

      {/* Crop Modal */}
      {isCropModalOpen && originalImage && (
        <CropModal
          imageSrc={originalImage}
          initialCrop={cropData?.crop}
          initialZoom={cropData?.zoom}
          onSave={applyCrop}
          onClose={closeCropModal}
        />
      )}

      {/* Action buttons */}
      <div style={{
        padding: '8px 0 24px',
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
          {t('share.download')}
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
            ? t('common.share')
            : t('share.download')}
        </button>
      </div>
      </div>
    </div>
  );
}
