import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { useTranslation } from 'react-i18next';
import { X, Check } from '../../../utils/icons';
import { Z_INDEX } from '../../../utils/zIndex';

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

  // set each dimensions to double largest dimension to allow for a safe area for the
  // image to rotate in without being clipped by canvas context
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

  // Return base64 with moderate quality
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
    <div className="fade-in" style={{
      position: 'fixed', inset: 0,
      background: '#0a0a0f',
      zIndex: Z_INDEX.MODAL + 100,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header — frosted glass nav bar */}
      <div style={{
        padding: '14px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(15, 15, 25, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative', zIndex: 2,
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            width: '38px', height: '38px',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <X size={20} />
        </button>

        <span style={{
          color: 'white', fontWeight: 700, fontSize: '0.95rem',
          letterSpacing: '-0.01em',
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        }}>
          {t('share.cropImage', 'Cadrage de l\'image')}
        </span>

        <button
          onClick={handleSave}
          style={{
            background: 'linear-gradient(135deg, #818cf8, #6366f1)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            width: '38px', height: '38px',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
          }}
        >
          <Check size={20} />
        </button>
      </div>

      {/* Crop area */}
      <div style={{
        position: 'relative', flex: 1, overflow: 'hidden',
        margin: '12px',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4)',
      }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          // The share card is roughly 360 wide and potentially dynamic height. Let's use 3:4 for portrait layout
          aspect={3 / 4}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          zoomSpeed={0.4}
          minZoom={1}
          maxZoom={3}
          cropShape="rect"
          showGrid={false}
          style={{
            containerStyle: {
              borderRadius: '20px',
              background: '#0a0a0f',
            },
            cropAreaStyle: {
              border: '2px solid rgba(129,140,248,0.5)',
              borderRadius: '16px',
              boxShadow: '0 0 0 9999px rgba(5,5,10,0.7), 0 0 30px rgba(129,140,248,0.15)',
            },
            mediaStyle: {
              borderRadius: '0',
            },
          }}
        />
      </div>

    </div>
  );
}
