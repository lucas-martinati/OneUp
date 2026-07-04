import { toPng, toJpeg } from 'html-to-image';
import { Share as CapacitorShare } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * Share Service
 * Captures a DOM element as an image and shares it via native API or Web Share.
 */

const isNative = () => Capacitor.isNativePlatform();

/**
 * Builds a CSS string with the app's webfont (Outfit) embedded as base64
 * data URIs, so the exported image renders with the real font instead of a
 * system fallback. Only the latin subsets are embedded to stay light.
 * Cached for the session; resolves to '' on failure (e.g. offline) so the
 * capture falls back to skipping fonts, as before.
 */
let fontCssPromise = null;

async function buildFontEmbedCss() {
  const hrefs = Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'))
    .map(l => l.href);
  if (hrefs.length === 0) return '';

  const cssTexts = await Promise.all(hrefs.map(async (href) => (await fetch(href)).text()));
  const blocks = cssTexts.join('\n').match(/@font-face\s*{[^}]*}/g) || [];
  const latinBlocks = blocks.filter(b => b.includes('U+0000-00FF'));

  const embedded = await Promise.all(latinBlocks.map(async (block) => {
    const urlMatch = block.match(/url\((https:[^)]+)\)/);
    if (!urlMatch) return block;
    const res = await fetch(urlMatch[1]);
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return block.replace(urlMatch[1], dataUrl);
  }));
  return embedded.join('\n');
}

export function getFontEmbedCss() {
  if (!fontCssPromise) {
    fontCssPromise = buildFontEmbedCss().catch(() => {
      fontCssPromise = null; // retry on next capture (e.g. back online)
      return '';
    });
  }
  return fontCssPromise;
}

export async function captureElement(element, { format = 'png', quality = 0.92, pixelRatio = 2, height, width } = {}) {
  if (!element) throw new Error('No element to capture');

  const captureFn = format === 'jpeg' ? toJpeg : toPng;
  const fontEmbedCSS = await getFontEmbedCss();

  const options = {
    quality,
    pixelRatio,
    cacheBust: true,
    backgroundColor: '#0a0a0f',
    style: {
      transform: 'none',
    },
    ...(fontEmbedCSS ? { fontEmbedCSS } : { skipFonts: true }),
  };

  // Pass explicit dimensions to ensure full content is captured
  if (height) options.height = height;
  if (width) options.width = width;

  const dataUrl = await captureFn(element, options);

  return dataUrl;
}

export async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function shareImage(dataUrl, { title = 'OneUp', text = '' } = {}) {
  if (isNative()) {
    try {
      // Save image to filesystem first, then share with URL
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const base64Data = dataUrl.split(',')[1];
      const fileName = `oneup-share-${Date.now()}.png`;
      
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      await CapacitorShare.share({
        title,
        text,
        url: result.uri,
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

  // Web Share API - always sends both image and text
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
  if (isNative()) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const base64Data = dataUrl.split(',')[1];
      const fileName = filename || `oneup-session-${Date.now()}.png`;
      
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });
      
      const { Share } = await import('@capacitor/share');
      await Share.share({
        url: result.uri,
        title: 'OneUp',
      });
      
      return { success: true, method: 'native-share' };
    } catch (err) {
      console.error('Native download failed:', err);
    }
  }
  
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
