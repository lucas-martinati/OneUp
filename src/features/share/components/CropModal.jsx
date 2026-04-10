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
      background: 'rgba(5,5,5,0.99)', zIndex: Z_INDEX.MODAL + 100,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'white', cursor: 'pointer',
        }}>
          <X size={24} />
        </button>
        <span style={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>
          {t('share.cropImage', 'Cadrage de l\'image')}
        </span>
        <button onClick={handleSave} style={{
          background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer',
          fontWeight: 700, fontSize: '1rem',
        }}>
          <Check size={24} />
        </button>
      </div>
      
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          // The share card is roughly 360 wide and potentially dynamic height. Let's use 3:4 for portrait layout
          aspect={3 / 4}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      </div>

      <div style={{
        padding: '24px', display: 'flex', alignItems: 'center', gap: '16px',
        background: 'linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0))'
      }}>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', width: '40px' }}>Zoom</span>
        <input
          type="range"
          value={zoom}
          min={1}
          max={3}
          step={0.1}
          aria-labelledby="Zoom"
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ flex: 1, accentColor: '#818cf8' }}
        />
      </div>
    </div>
  );
}
