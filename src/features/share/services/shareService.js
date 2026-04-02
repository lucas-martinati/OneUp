import { toPng, toJpeg } from 'html-to-image';
import { Share as CapacitorShare } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * Share Service
 * Captures a DOM element as an image and shares it via native API or Web Share.
 */

const isNative = () => Capacitor.isNativePlatform();

export async function captureElement(element, { format = 'png', quality = 0.92, pixelRatio = 2 } = {}) {
  if (!element) throw new Error('No element to capture');

  const captureFn = format === 'jpeg' ? toJpeg : toPng;
  const dataUrl = await captureFn(element, {
    quality,
    pixelRatio,
    cacheBust: true,
    backgroundColor: '#0a0a0f',
    style: {
      transform: 'none',
    },
  });

  return dataUrl;
}

export async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function shareImage(dataUrl, { title = 'OneUp', text = '' } = {}) {
  if (isNative()) {
    try {
      await CapacitorShare.share({
        title,
        text,
        dialogTitle: title,
      });
      return { success: true, method: 'capacitor' };
    } catch (err) {
      if (err.message === 'Share canceled' || err.message === 'Share canceled.') {
        return { success: false, canceled: true };
      }
      throw err;
    }
  }

  if (navigator.share && navigator.canShare) {
    try {
      const blob = await dataUrlToBlob(dataUrl);
      const file = new File([blob], 'oneup-session.png', { type: blob.type });
      const shareData = { title, text, files: [file] };

      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return { success: true, method: 'web-share-api' };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        return { success: false, canceled: true };
      }
    }
  }

  return { success: false, method: 'none' };
}

export async function downloadImage(dataUrl, filename = 'oneup-session.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return { success: true, method: 'download' };
}

export function canShareNatively() {
  return isNative() || (!!navigator.share && !!navigator.canShare);
}
