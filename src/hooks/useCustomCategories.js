import { useCallback, useMemo } from 'react';
import { useLocalStorageScoped } from './useLocalStorageScoped';

const STORAGE_KEY = 'oneup_custom_categories';
const MAX_CUSTOM_CATEGORIES = 5;

/**
 * Hook for managing user-created exercise categories (Pro feature).
 * Each category: { id, name, color, createdAt }
 */
export function useCustomCategories(userId) {
  const [customCategories, setCustomCategories] = useLocalStorageScoped(STORAGE_KEY, userId, []);

  const addCategory = useCallback((name, color) => {
    if (!name?.trim()) return false;
    if (customCategories.length >= MAX_CUSTOM_CATEGORIES) return false;

    setCustomCategories((prev) => {
      if (prev.length >= MAX_CUSTOM_CATEGORIES) return prev;
      return [...prev, {
        id: `cat_${crypto.randomUUID()}`,
        name: name.trim(),
        color: color || '#8b5cf6',
        createdAt: Date.now(),
      }];
    });
    return true;
  }, [customCategories, setCustomCategories]);

  const updateCategory = useCallback((id, updates) => {
    setCustomCategories((prev) => {
      const exists = prev.some((cat) => cat.id === id);
      if (exists) {
        return prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat));
      }
      // If it's the built-in custom category and not yet in the list, add it as an override
      if (id === 'custom') {
        return [...prev, { id, ...updates, createdAt: Date.now() }];
      }
      return prev;
    });
  }, [setCustomCategories]);

  const deleteCategory = useCallback((id) => {
    setCustomCategories((prev) => prev.filter((cat) => cat.id !== id));
  }, [setCustomCategories]);

  const setCategoriesFromCloud = useCallback((cloudData) => {
    if (Array.isArray(cloudData)) {
      setCustomCategories(prev => {
        if (JSON.stringify(prev) === JSON.stringify(cloudData)) return prev;
        return cloudData;
      });
    }
  }, [setCustomCategories]);

  const moveCategory = useCallback((id, direction) => {
    setCustomCategories((prev) => {
      const index = prev.findIndex((c) => c.id === id);
      if (index === -1) return prev;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newArr = [...prev];
      const [moved] = newArr.splice(index, 1);
      newArr.splice(newIndex, 0, moved);
      return newArr;
    });
  }, [setCustomCategories]);

  const customCategoriesMap = useMemo(() => {
    const map = {};
    customCategories.forEach(cat => { map[cat.id] = cat; });
    return map;
  }, [customCategories]);

  return {
    customCategories,
    customCategoriesMap,
    addCategory,
    updateCategory,
    deleteCategory,
    moveCategory,
    setCategoriesFromCloud,
    maxCustomCategories: MAX_CUSTOM_CATEGORIES,
  };
}
