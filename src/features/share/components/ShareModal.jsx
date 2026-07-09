import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Share2, Download, X, Loader2 } from '@utils/icons';
import { IconButton } from '@components/ui';
import { Z_INDEX } from '@utils/zIndex';
import { ShareCard } from './ShareCard';
import { SharePreview } from './SharePreview';
import { ShareOptions } from './ShareOptions';
import { CropModal } from './CropModal';
import { canShareNatively } from '@features/share/services/shareService';
import { useProgressStore } from '@store/useProgressStore';
import { useUIStore } from '@store/useUIStore';
import styles from './ShareModal.module.css';

export function ShareModal({ shareHook, onClose, isPro = false, completions = {}, getDayNumber, settings }) {
  const { t } = useTranslation();
  const hasShared = useProgressStore(s => s.hasShared);
  const setHasShared = useProgressStore(s => s.setHasShared);
  const [cardFormat, setCardFormat] = useState(null);
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

  // Shared by the ref-holding preview card and its enlarged zoom copy
  const cardProps = {
    sessionData, stats, sessionHistory, completions, getDayNumber,
    settings, options, mode, isPro,
  };

  return createPortal(
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
        <IconButton icon={X} variant="glass" onClick={onClose} aria-label="Close" />
      </div>

      <div className={styles.layout}>
        {/* Card preview — stays visible while options are tweaked */}
        <div className={styles.preview}>
          <SharePreview
            formatLabel={cardFormat}
            className={styles.stage}
            zoomContent={<ShareCard {...cardProps} />}
          >
            <ShareCard
              {...cardProps}
              cardRef={cardRef}
              onFormatChange={setCardFormat}
            />
          </SharePreview>
        </div>

        {/* Options + actions */}
        <div className={styles.side}>
          <div style={{ padding: '8px 0' }}>
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
              onOpenStore={() => {
                onClose();
                useUIStore.getState().openStore();
              }}
            />
          </div>

          <div className={styles.actions}>
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
      </div>
    </div>,
    document.body
  );
}
