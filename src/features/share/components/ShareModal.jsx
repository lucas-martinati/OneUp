import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Download, Loader2 } from '@utils/icons';
import { Button, ModalHeader, ModalContainer } from '@components/ui';
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

  return (
    <>
    <ModalContainer open={true} onClose={onClose}>
      {/* Header */}
      <ModalHeader title={t('common.share')} onClose={onClose} />

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
            <Button
              variant="secondary"
              icon={isExporting ? Loader2 : Download}
              loading={isExporting}
              fullWidth
              onClick={handleDownload}
            >
              {t('share.download')}
            </Button>
            <Button
              icon={isExporting ? Loader2 : Share2}
              loading={isExporting}
              fullWidth
              onClick={handleShare}
            >
              {canShareNatively()
                ? t('common.share')
                : t('share.download')}
            </Button>
          </div>
        </div>
      </div>
      </ModalContainer>

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
    </>
  );
}
