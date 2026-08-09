import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useTranslation } from 'react-i18next';
import { Check } from '@utils/icons';
import { Button, ModalContainer, ModalHeader } from '@components/ui';
import styles from './CropModal.module.css';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

async function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width / 2,
    safeArea / 2 - image.height / 2
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width / 2 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height / 2 - pixelCrop.y)
  );

  return canvas.toDataURL('image/jpeg', 0.85);
}

export function CropModal({ imageSrc, initialCrop, initialZoom, onSave, onClose }) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState(initialCrop || { x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialZoom || 1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedImageBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(croppedImageBase64, crop, zoom);
    } catch (e) {
      console.error(e);
      onClose(); // fallback
    }
  };

  return (
    <ModalContainer open={true} onClose={onClose} style={{ zIndex: 1010 }}>
      {/* Header standardisé */}
      <ModalHeader 
        title={t('share.cropImage')} 
        onClose={onClose} 
      />

      {/* Zone de recadrage */}
      <div className={styles.cropArea}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          // Format portrait 3:4 pour les cartes de partage
          aspect={3 / 4}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          zoomSpeed={0.4}
          minZoom={1}
          maxZoom={3}
          cropShape="rect"
          showGrid={false}
          classes={{
            containerClassName: styles.cropperContainer,
            cropAreaClassName: styles.cropAreaOverlay,
            mediaClassName: styles.mediaStyle,
          }}
        />
      </div>

      {/* Footer avec bouton de validation */}
      <div className={styles.footer}>
        <Button variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" icon={Check} onClick={handleSave}>
          {t('common.save')}
        </Button>
      </div>
    </ModalContainer>
  );
}
