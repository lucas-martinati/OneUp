import { useState, useRef, useCallback } from 'react';
import { captureElement, shareImage, downloadImage } from '../services/shareService';

const DEFAULT_OPTIONS = {
  showDuration: true,
  showVolume: true,
  showExercises: true,
  showStreak: false,
  showSessionHistory: false,
  showWeights: true,
  statsCategories: ['bodyweight', 'weights', 'custom'],
  format: 'png',
  theme: 'dark',
  taggedUsers: [],
  backgroundImage: null,
};

const OPTIONS_STORAGE_KEY = 'oneup_share_options';

function loadSavedOptions() {
  try {
    const saved = localStorage.getItem(OPTIONS_STORAGE_KEY);
    if (saved) return { ...DEFAULT_OPTIONS, ...JSON.parse(saved) };
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
 * @returns {Object} { cardRef, options, setOption, toggleOption, exportCard, shareCard, isExporting, mode }
 */
export function useShareCard({ sessionData, stats = {}, sessionHistory = [], mode = 'session' } = {}) {
  const cardRef = useRef(null);
  const [options, setOptions] = useState(loadSavedOptions);
  const [isExporting, setIsExporting] = useState(false);

  const setOption = useCallback((key, value) => {
    setOptions(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleOption = useCallback((key) => {
    setOptions(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleCategory = useCallback((cat) => {
    setOptions(prev => {
      const cats = prev.statsCategories || DEFAULT_OPTIONS.statsCategories;
      const next = cats.includes(cat)
        ? cats.filter(c => c !== cat)
        : [...cats, cat];
      // Don't allow empty selection
      if (next.length === 0) return prev;
      const updated = { ...prev, statsCategories: next };
      localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setBackgroundImage = useCallback((imageDataUrl) => {
    setOptions(prev => {
      const next = { ...prev, backgroundImage: imageDataUrl };
      localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearBackgroundImage = useCallback(() => {
    setOptions(prev => {
      const next = { ...prev, backgroundImage: null };
      localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const captureCard = useCallback(async () => {
    if (!cardRef.current) throw new Error('Card ref not attached');
    setIsExporting(true);
    const el = cardRef.current;
    const prevWidth = el.style.width;
    const prevMaxWidth = el.style.maxWidth;
    try {
      // Force fixed size for consistent export
      el.style.width = '360px';
      el.style.maxWidth = '360px';
      const dataUrl = await captureElement(el, {
        format: options.format,
        quality: 0.95,
        pixelRatio: 2,
      });
      return dataUrl;
    } finally {
      // Restore original sizing
      el.style.width = prevWidth;
      el.style.maxWidth = prevMaxWidth;
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
    const exerciseCount = sessionData?.exercises?.length || 0;
    const text = `OneUp - ${exerciseCount} exercice${exerciseCount > 1 ? 's' : ''} complété${exerciseCount > 1 ? 's' : ''} ! 💪`;
    const result = await shareImage(dataUrl, { title: 'OneUp', text });

    if (!result.success && !result.canceled) {
      await downloadImage(dataUrl, `oneup-session-${Date.now()}.png`);
      return { success: true, method: 'download-fallback' };
    }
    return result;
  }, [captureCard, sessionData]);

  return {
    cardRef,
    options,
    setOption,
    toggleOption,
    toggleCategory,
    setBackgroundImage,
    clearBackgroundImage,
    exportCard,
    shareCard,
    isExporting,
    sessionData,
    stats,
    sessionHistory,
    mode,
  };
}
