import { useState, useRef, useCallback, useEffect } from 'react';
import { captureElement, shareImage, downloadImage } from '@features/share/services/shareService';
import { CATEGORIES } from '@config/categories';
import { useTranslation } from 'react-i18next';
import { generateShareTextFromSession } from '@utils/sessionNameGenerator';

const DEFAULT_OPTIONS = {
  showDuration: true,
  showVolume: true,
  showExercises: true,
  showStreak: false,
  showSessionHistory: false,
  showWeights: true,
  statsCategories: [CATEGORIES.BODYWEIGHT, CATEGORIES.WEIGHTS, CATEGORIES.CUSTOM, CATEGORIES.CARDIO],
  format: 'png',
  theme: 'dark',
  taggedUsers: [],
  backgroundImage: null,
};

const OPTIONS_STORAGE_KEY = 'oneup_share_options';

function loadSavedOptions() {
  try {
    const saved = localStorage.getItem(OPTIONS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      delete parsed.backgroundImage; // Prevent large background images from clogging storage
      return { ...DEFAULT_OPTIONS, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_OPTIONS };
}

/**
 * useShareCard hook
 * Manages share card state, customization options, and export logic.
 *
 * @param {Object} params
 * @param {Object} params.sessionData - { date, exercises, duration, name, type }
 * @param {Object} params.stats - computed stats from useComputedStats (for streak, etc.)
 * @param {Array} params.sessionHistory - last 10 sessions from sessionHistoryService
 * @param {string} params.mode - 'session' | 'global'
 * @param {Array} params.initialCategories - initial categories to select ['bodyweight', 'weights', 'custom']
 * @param {boolean} params.isPro - whether the user has pro access
 * @returns {Object} { cardRef, options, setOption, toggleOption, exportCard, shareCard, isExporting, mode }
 */
export function useShareCard({ sessionData, stats = {}, sessionHistory = [], mode = 'session', initialCategories, isPro = false } = {}) {
  const { t } = useTranslation();
  const cardRef = useRef(null);
  
  // Apply initial categories only once on mount (when modal opens)
  const getInitialOptions = () => {
    const saved = loadSavedOptions();
    saved.globalDate = new Date().toISOString().split('T')[0]; // Always reset date to today
    if (!isPro) {
      saved.theme = 'dark';
      saved.backgroundImage = null;
    }
    if (initialCategories && initialCategories.length > 0) {
      return { ...saved, statsCategories: initialCategories };
    }
    return saved;
  };
  
  const [options, setOptions] = useState(getInitialOptions);
  const [isExporting, setIsExporting] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [cropData, setCropData] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  const saveOptionsToStorage = useCallback((opts) => {
    const safeOpts = { ...opts };
    delete safeOpts.backgroundImage;
    localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(safeOpts));
  }, []);

  // Reset theme and background image if Pro is lost/inactive (e.g. user signs out)
  useEffect(() => {
    if (!isPro) {
      setOptions(prev => {
        if (prev.theme === 'dark' && prev.backgroundImage === null) return prev;
        const next = { ...prev, theme: 'dark', backgroundImage: null };
        saveOptionsToStorage(next);
        return next;
      });
    }
  }, [isPro, saveOptionsToStorage]);

  const openCropModal = useCallback((imgBase64) => {
    if (imgBase64) setOriginalImage(imgBase64);
    setIsCropModalOpen(true);
  }, []);

  const closeCropModal = useCallback(() => {
    setIsCropModalOpen(false);
  }, []);

  const applyCrop = useCallback((croppedBase64, crop, zoom) => {
    setOptions(prev => {
      const next = { ...prev, backgroundImage: croppedBase64 };
      saveOptionsToStorage(next);
      return next;
    });
    setCropData({ crop, zoom });
    setIsCropModalOpen(false);
  }, [saveOptionsToStorage]);

  const setOption = useCallback((key, value) => {
    setOptions(prev => {
      if (prev[key] === value) return prev;
      
      // Special handling for arrays (like statsCategories) - Order insensitive comparison
      if (Array.isArray(value) && Array.isArray(prev[key])) {
        if (new Set(value).size === new Set(prev[key]).size && value.every(v => prev[key].includes(v))) {
          return prev;
        }
      }

      const next = { ...prev, [key]: value };
      saveOptionsToStorage(next);
      return next;
    });
  }, [saveOptionsToStorage]);

  const toggleOption = useCallback((key) => {
    setOptions(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveOptionsToStorage(next);
      return next;
    });
  }, [saveOptionsToStorage]);

  const toggleCategory = useCallback((cat) => {
    setOptions(prev => {
      const cats = prev.statsCategories || DEFAULT_OPTIONS.statsCategories;
      const next = cats.includes(cat)
        ? cats.filter(c => c !== cat)
        : [...cats, cat];
      // Don't allow empty selection
      if (next.length === 0) return prev;
      
      // Check if logically the same
      if (next.length === cats.length && next.every((v, i) => v === cats[i])) {
        return prev;
      }

      const updated = { ...prev, statsCategories: next };
      saveOptionsToStorage(updated);
      return updated;
    });
  }, [saveOptionsToStorage]);

  const setBackgroundImage = useCallback((imageDataUrl) => {
    setOptions(prev => {
      const next = { ...prev, backgroundImage: imageDataUrl };
      saveOptionsToStorage(next);
      return next;
    });
  }, [saveOptionsToStorage]);

  const clearBackgroundImage = useCallback(() => {
    setOptions(prev => {
      const next = { ...prev, backgroundImage: null };
      saveOptionsToStorage(next);
      return next;
    });
    setOriginalImage(null);
    setCropData(null);
  }, [saveOptionsToStorage]);

  const captureCard = useCallback(async () => {
    if (!cardRef.current) throw new Error('Card ref not attached');
    setIsExporting(true);
    const el = cardRef.current;
    const prevWidth = el.style.width;
    const prevMaxWidth = el.style.maxWidth;
    const prevOverflow = el.style.overflow;
    try {
      // Force fixed size for consistent export
      el.style.width = '360px';
      el.style.maxWidth = '360px';
      // Temporarily remove overflow:hidden so scrollHeight reflects full content
      el.style.overflow = 'visible';
      
      // Wait for layout to settle after forced resize and for any potential re-renders
      await new Promise(r => setTimeout(r, 50));

      // Capture the full content height (overflow:visible ensures scrollHeight == full content)
      const fullHeight = el.scrollHeight;

      const dataUrl = await captureElement(el, {
        format: options.format,
        quality: 0.95,
        pixelRatio: 2,
        height: fullHeight,
        width: 360,
      });
      return dataUrl;
    } finally {
      // Restore original sizing
      el.style.width = prevWidth;
      el.style.maxWidth = prevMaxWidth;
      el.style.overflow = prevOverflow;
      setIsExporting(false);
    }
  }, [options.format]);

  const exportCard = useCallback(async () => {
    const dataUrl = await captureCard();
    await downloadImage(dataUrl, `oneup-session-${Date.now()}.png`);
    return { success: true };
  }, [captureCard]);

  const shareCard = useCallback(async () => {
    const dataUrl = await captureCard();
    const isPerfectDay = stats?.isPerfectToday || false;
    const shareText = generateShareTextFromSession(t, sessionData, mode, isPerfectDay);
    const result = await shareImage(dataUrl, { title: 'OneUp', text: shareText });

    if (!result.success && !result.canceled) {
      await downloadImage(dataUrl, `oneup-session-${Date.now()}.png`);
      return { success: true, method: 'download-fallback' };
    }
    return result;
  }, [captureCard, mode, sessionData, stats?.isPerfectToday, t]);

  return {
    cardRef,
    options,
    setOption,
    toggleOption,
    toggleCategory,
    setBackgroundImage,
    clearBackgroundImage,
    originalImage,
    cropData,
    isCropModalOpen,
    openCropModal,
    closeCropModal,
    applyCrop,
    exportCard,
    shareCard,
    isExporting,
    sessionData,
    stats,
    sessionHistory,
    mode,
  };
}
