import { useState, useEffect, useRef } from 'react';

/**
 * Load and parse a value from localStorage.
 * Defined outside the hook to avoid re-creation on every render.
 */
function loadFromStorage(key, defaultValue, parse) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    const parsed = JSON.parse(saved);
    return parse ? (parse(parsed) ?? defaultValue) : parsed;
  } catch {
    return defaultValue;
  }
}

/**
 * Generic hook for UID-scoped localStorage persistence.
 * Handles account switching, legacy data migration, and sign-out reset.
 *
 * @param {string} baseKey    — The base localStorage key (e.g. 'oneup_routines')
 * @param {string|undefined} userId — The current user's UID (undefined when signed out)
 * @param {*} defaultValue    — The default value for a fresh/signed-out state
 * @param {function} [parse]  — Optional parser for loaded data (e.g. validateProgressData)
 * @returns {[any, function]}  — [value, setValue] like useState
 */
export function useLocalStorageScoped(baseKey, userId, defaultValue, parse) {
  const storageKey = userId ? `${baseKey}_${userId}` : baseKey;

  // Keep stable refs for config values that shouldn't trigger re-runs
  const defaultValueRef = useRef(defaultValue);
  const parseRef = useRef(parse);
  defaultValueRef.current = defaultValue;
  parseRef.current = parse;

  const [value, setValue] = useState(() => loadFromStorage(storageKey, defaultValue, parse));

  // Reload when userId changes (account switch)
  const prevKeyRef = useRef(storageKey);
  useEffect(() => {
    if (prevKeyRef.current !== storageKey) {
      prevKeyRef.current = storageKey;
      if (userId) {
        // Migrate legacy data if UID-scoped key doesn't exist yet
        if (!localStorage.getItem(storageKey)) {
          const legacyData = localStorage.getItem(baseKey);
          if (legacyData) {
            localStorage.setItem(storageKey, legacyData);
          }
        }
        setValue(loadFromStorage(storageKey, defaultValueRef.current, parseRef.current));
      } else {
        // Signed out — reset to defaults
        setValue(defaultValueRef.current);
      }
    }
  }, [storageKey, userId, baseKey]);

  // Persist to scoped localStorage on change (skip initial mount to avoid
  // overwriting a legacy key before migration has a chance to read it)
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(value));
  }, [value, storageKey]);

  return [value, setValue];
}
