import { useState, useEffect, useMemo } from 'react';
import { ref, get, set } from 'firebase/database';
import { getDatabaseInstance } from '@services/firebase';
import { fetchAllUsersData, updateUserProfile, updateUserSettings, updateUserProgress, updateUserPurchase, saveUserData, resetUserProgress, deleteUserData } from '@services/adminService';
import { paths } from '@shared/dbSchema.js';

/** Activity timestamp used for the default sort (most recent first). */
function activityTs(u) {
  if (u.lastSeen) { const t = Date.parse(u.lastSeen); if (!isNaN(t)) return t; }
  if (u.lastActiveDay) { const t = Date.parse(u.lastActiveDay); if (!isNaN(t)) return t; }
  return 0;
}

/** Comparators for the account list, keyed by sort mode. */
const SORTERS = {
  activity: (a, b) => activityTs(b) - activityTs(a),
  reps: (a, b) => (b.totalReps || 0) - (a.totalReps || 0),
  days: (a, b) => (b.completionsCount || 0) - (a.completionsCount || 0),
  name: (a, b) => a.displayName.localeCompare(b.displayName),
};

/**
 * Account list filters. Options sharing a `group` are mutually exclusive
 * (selecting one clears the others in that group); across groups they AND.
 */
export const FILTER_OPTIONS = [
  { id: 'setup_yes', group: 'setup', label: 'Configuré', test: u => u.isSetup },
  { id: 'setup_no', group: 'setup', label: 'Non configuré', test: u => !u.isSetup },
  { id: 'active', group: 'active', label: 'Actif', test: u => u.completionsCount > 0 },
  { id: 'inactive', group: 'active', label: 'Inactif', test: u => !u.completionsCount },
  { id: 'pro', group: 'pro', label: 'PRO', test: u => u.isPro },
  { id: 'supporter', group: 'supporter', label: 'Support', test: u => u.isSupporter },
  { id: 'no_photo', group: 'photo', label: 'Sans photo', test: u => !u.photoURL },
];

function matchActiveFilter(u, filterId) {
  const opt = FILTER_OPTIONS.find(o => o.id === filterId);
  return opt ? opt.test(u) : true;
}

const makeQueryFilter = (query) => (u) => {
  return (
    u.uid.toLowerCase().includes(query) ||
    u.email.toLowerCase().includes(query) ||
    u.displayName.toLowerCase().includes(query)
  );
};

const makeActiveFiltersFilter = (activeFilters) => (u) => {
  return activeFilters.every(id => matchActiveFilter(u, id));
};

const makeSorter = (sortBy, sortReversed) => (a, b) => {
  const r = (SORTERS[sortBy] || SORTERS.activity)(a, b);
  return sortReversed ? -r : r;
};

/**
 * All state and Firebase logic of the admin panel: user list loading,
 * search filtering, form edition and per-key JSON section edition.
 */
export function useAdminPanel() {
  // Store both the users list and leaderboard fallbacks
  const [dataState, setDataState] = useState({ usersData: null, leaderboardData: null, publicProfilesData: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('activity'); // 'activity' | 'reps' | 'days' | 'name'
  const [sortReversed, setSortReversed] = useState(false); // invert the active sort order
  const [activeFilters, setActiveFilters] = useState([]); // array of FILTER_OPTIONS ids

  // Click a sort: same one toggles its direction, a new one resets to natural order.
  const cycleSort = (id) => {
    if (id === sortBy) setSortReversed(r => !r);
    else { setSortBy(id); setSortReversed(false); }
  };

  const toggleFilter = (id) => {
    setActiveFilters(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      const opt = FILTER_OPTIONS.find(o => o.id === id);
      const sameGroup = FILTER_OPTIONS.filter(o => o.group === opt?.group).map(o => o.id);
      return [...prev.filter(x => !sameGroup.includes(x)), id];
    });
  };

  const clearFilters = () => setActiveFilters([]);

  // Selection & Editor state
  const [selectedUid, setSelectedUid] = useState(null);
  const [editMode, setEditMode] = useState('form'); // 'form' or 'json'

  // JSON Collapsible / Section Editor States
  const [expandedKeys, setExpandedKeys] = useState({}); // { [key]: boolean }
  const [keyJsonContents, setKeyJsonContents] = useState({}); // { [key]: string }
  const [keyJsonErrors, setKeyJsonErrors] = useState({}); // { [key]: string | null }
  const [keyEditorFormats, setKeyEditorFormats] = useState({}); // { [key]: 'tree' | 'raw' }

  const [formState, setFormState] = useState({
    email: '',
    displayName: '',
    photoURL: '',
    leaderboardPseudo: '',
    leaderboardEnabled: false,
    notificationsEnabled: false,
    notificationTime: { hour: 9, minute: 0 },
    soundsEnabled: true,
    appTheme: 'dark',
    isPro: false,
    isSupporter: false,
    hadPro: false,
    startDate: '',
    isSetup: false,
  });

  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setMessage(null);
    try {
      const uData = await fetchAllUsersData();

      let lbData = {};
      let publicProfilesData = {};
      try {
        const db = getDatabaseInstance();
        if (db) {
          // The badge count is published by the Cloud Function to
          // `publicProfiles/{uid}.achievements`, NOT to the leaderboard entry —
          // load both so the user detail sheet can show the real success count.
          const [lbSnap, ppSnap] = await Promise.all([
            get(ref(db, paths.leaderboard())),
            get(ref(db, 'publicProfiles')),
          ]);
          if (lbSnap.exists()) lbData = lbSnap.val();
          if (ppSnap.exists()) publicProfilesData = ppSnap.val();
        }
      } catch (lbErr) {
        console.warn('Could not load leaderboard/publicProfiles for details', lbErr);
      }

      setDataState({
        usersData: uData || {},
        leaderboardData: lbData,
        publicProfilesData
      });
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors du chargement des utilisateurs. Vérifiez vos permissions.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered list computed from dataState
  const filteredUsers = useMemo(() => {
    if (!dataState.usersData) return [];
    const query = searchQuery.toLowerCase().trim();
    const lb = dataState.leaderboardData || {};

    return Object.entries(dataState.usersData).map(([uid, data]) => {
      const completionsCount = data.progress?.completions
        ? Object.keys(data.progress.completions).length
        : 0;

      const lbEntry = lb[uid] || {};

      return {
        uid,
        email: data.profile?.email || '',
        displayName: data.profile?.displayName || lbEntry.pseudo || data.settings?.leaderboardPseudo || 'Utilisateur Anonyme',
        photoURL: data.profile?.photoURL || lbEntry.photoURL || null,
        lastSeen: data.profile?.lastSeen || null,
        isPro: !!data.purchase?.isPro,
        isSupporter: !!data.purchase?.isSupporter,
        completionsCount,
        startDate: data.progress?.startDate || null,
        isSetup: !!data.progress?.isSetup,
        totalReps: (lbEntry.totalReps || 0) + (lbEntry.weightsTotalReps || 0),
        lastActiveDay: lbEntry.lastActiveDay || null,
        rawData: data
      };
    })
      .filter(makeQueryFilter(query))
      .filter(makeActiveFiltersFilter(activeFilters))
      .sort(makeSorter(sortBy, sortReversed));
  }, [dataState, searchQuery, sortBy, sortReversed, activeFilters]);

  // Select User
  const handleSelectUser = (user) => {
    setSelectedUid(user.uid);
    setEditMode('form');
    setMessage(null);
    setExpandedKeys({});
    setKeyJsonErrors({});

    const lbEntry = (dataState.leaderboardData && dataState.leaderboardData[user.uid]) || {};

    // Set form fields with proper fallbacks
    setFormState({
      email: user.rawData.profile?.email || '',
      displayName: user.rawData.profile?.displayName || lbEntry.pseudo || user.rawData.settings?.leaderboardPseudo || '',
      photoURL: user.rawData.profile?.photoURL || lbEntry.photoURL || '',
      leaderboardPseudo: user.rawData.settings?.leaderboardPseudo || lbEntry.pseudo || '',
      leaderboardEnabled: !!user.rawData.settings?.leaderboardEnabled,
      notificationsEnabled: !!user.rawData.settings?.notificationsEnabled,
      notificationTime: user.rawData.settings?.notificationTime || { hour: 9, minute: 0 },
      soundsEnabled: user.rawData.settings?.soundsEnabled !== false,
      appTheme: user.rawData.settings?.appTheme || 'dark',
      isPro: !!user.rawData.purchase?.isPro,
      isSupporter: !!user.rawData.purchase?.isSupporter,
      hadPro: !!user.rawData.purchase?.hadPro,
      startDate: user.rawData.progress?.startDate || '',
      isSetup: !!user.rawData.progress?.isSetup,
    });

    // Set up collapsible JSON contents for each key
    const contents = {};
    Object.keys(user.rawData || {}).forEach(k => {
      contents[k] = JSON.stringify(user.rawData[k], null, 2);
    });
    // Add raw full document key
    contents['__full__'] = JSON.stringify(user.rawData, null, 2);

    setKeyJsonContents(contents);
  };

  // Get keys of selected user, prioritizing main keys
  const selectedUserKeys = useMemo(() => {
    if (!selectedUid || !dataState.usersData) return [];
    const userObj = dataState.usersData[selectedUid] || {};
    const keys = Object.keys(userObj);

    const order = ['profile', 'settings', 'purchase', 'progress'];
    keys.sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    // Append the '__full__' pseudo key to allow full document editing at the end
    return [...keys, '__full__'];
  }, [selectedUid, dataState]);

  // Read-only metadata shown at the top of the selected user's detail sheet.
  const selectedMeta = useMemo(() => {
    if (!selectedUid || !dataState.usersData) return null;
    const data = dataState.usersData[selectedUid] || {};
    const lbEntry = (dataState.leaderboardData && dataState.leaderboardData[selectedUid]) || {};
    const publicProfile = (dataState.publicProfilesData && dataState.publicProfilesData[selectedUid]) || {};
    return {
      uid: selectedUid,
      lastSeen: data.profile?.lastSeen || null,
      completionsCount: data.progress?.completions ? Object.keys(data.progress.completions).length : 0,
      totalReps: lbEntry.totalReps || 0,
      weightsTotalReps: lbEntry.weightsTotalReps || 0,
      // Badge count lives in publicProfiles (function-computed), not the leaderboard entry.
      achievements: publicProfile.achievements || 0,
      lastActiveDay: lbEntry.lastActiveDay || null,
      lastCompletionChange: data.progress?.lastCompletionChange || null,
    };
  }, [selectedUid, dataState]);

  // Per-section "has unsaved changes" flags, derived by comparing the edited
  // text against the last-saved cloud value (normalised, so reformatting alone
  // is not flagged). Invalid JSON always counts as dirty.
  const keyJsonDirty = useMemo(() => {
    const result = {};
    if (!selectedUid) return result;
    const userObj = (dataState.usersData && dataState.usersData[selectedUid]) || {};
    for (const key of selectedUserKeys) {
      const content = keyJsonContents[key];
      if (content === undefined) { result[key] = false; continue; }
      const baseline = key === '__full__' ? userObj : userObj[key];
      try {
        result[key] = JSON.stringify(JSON.parse(content)) !== JSON.stringify(baseline ?? null);
      } catch {
        result[key] = true;
      }
    }
    return result;
  }, [selectedUid, dataState, keyJsonContents, selectedUserKeys]);

  // Discard local edits for a section, restoring the last-saved cloud value.
  const handleRevertKeyJson = (key) => {
    const userObj = (dataState.usersData && dataState.usersData[selectedUid]) || {};
    const baseline = key === '__full__' ? userObj : userObj[key];
    setKeyJsonContents(prev => ({ ...prev, [key]: JSON.stringify(baseline ?? {}, null, 2) }));
    setKeyJsonErrors(prev => ({ ...prev, [key]: null }));
  };

  // Handle collapsible key expand/collapse toggling
  const toggleKeyAccordion = (key) => {
    setExpandedKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handle JSON text change inside individual collapsible key
  const handleKeyJsonChange = (key, textValue) => {
    setKeyJsonContents(prev => ({ ...prev, [key]: textValue }));
    try {
      JSON.parse(textValue);
      setKeyJsonErrors(prev => ({ ...prev, [key]: null }));
    } catch (err) {
      setKeyJsonErrors(prev => ({ ...prev, [key]: err.message }));
    }
  };

  // Format single JSON key
  const handleFormatKeyJson = (key) => {
    try {
      const parsed = JSON.parse(keyJsonContents[key]);
      setKeyJsonContents(prev => ({ ...prev, [key]: JSON.stringify(parsed, null, 2) }));
      setKeyJsonErrors(prev => ({ ...prev, [key]: null }));
    } catch (err) {
      setKeyJsonErrors(prev => ({ ...prev, [key]: 'Formatage impossible: ' + err.message }));
    }
  };

  // Save changes inside a single collapsible accordion key
  const handleSaveKeyJson = async (key) => {
    if (!selectedUid || keyJsonErrors[key]) return;
    setSaveLoading(true);
    setMessage(null);
    try {
      const parsedValue = JSON.parse(keyJsonContents[key]);
      const db = getDatabaseInstance();
      if (!db) throw new Error('Database not initialized');

      let finalValue = parsedValue;
      if (key === 'progress') {
        finalValue = {
          ...parsedValue,
          lastCompletionChange: new Date().toISOString()
        };
      } else if (key === '__full__') {
        finalValue = {
          ...parsedValue,
          progress: parsedValue.progress ? {
            ...parsedValue.progress,
            lastCompletionChange: new Date().toISOString()
          } : {
            lastCompletionChange: new Date().toISOString()
          }
        };
      }

      if (key === '__full__') {
        // Save full overwrite
        await saveUserData(selectedUid, finalValue);
        // Refresh entire local contents map
        const contents = {};
        Object.keys(finalValue || {}).forEach(k => {
          contents[k] = JSON.stringify(finalValue[k], null, 2);
        });
        contents['__full__'] = JSON.stringify(finalValue, null, 2);
        setKeyJsonContents(contents);

        setDataState(prev => ({
          ...prev,
          usersData: {
            ...prev.usersData,
            [selectedUid]: finalValue
          }
        }));
      } else {
        // Save sub-key update
        await set(ref(db, `${paths.user(selectedUid)}/${key}`), finalValue);

        // Update local state and '__full__' content
        setDataState(prev => {
          const originalUser = prev.usersData[selectedUid] || {};
          const updatedUser = {
            ...originalUser,
            [key]: finalValue
          };

          setKeyJsonContents(c => ({
            ...c,
            [key]: JSON.stringify(finalValue, null, 2),
            '__full__': JSON.stringify(updatedUser, null, 2)
          }));

          return {
            ...prev,
            usersData: {
              ...prev.usersData,
              [selectedUid]: updatedUser
            }
          };
        });
      }

      setMessage({ type: 'success', text: `Section "${key === '__full__' ? 'Fiche complète' : key}" enregistrée avec succès.` });
    } catch (err) {
      setMessage({ type: 'error', text: `Erreur lors de la sauvegarde : ` + err.message });
    } finally {
      setSaveLoading(false);
    }
  };

  // Save changes via Form
  const handleSaveForm = async () => {
    if (!selectedUid) return;
    setSaveLoading(true);
    setMessage(null);
    try {
      const originalUser = dataState.usersData[selectedUid] || {};

      const profile = {
        ...originalUser.profile,
        email: formState.email,
        displayName: formState.displayName,
        photoURL: formState.photoURL
      };

      const settings = {
        ...originalUser.settings,
        leaderboardPseudo: formState.leaderboardPseudo,
        leaderboardEnabled: formState.leaderboardEnabled,
        notificationsEnabled: formState.notificationsEnabled,
        notificationTime: formState.notificationTime,
        soundsEnabled: formState.soundsEnabled,
        appTheme: formState.appTheme,
      };
      // The graphics/performance mode is device-local and must never live in
      // the cloud — strip any stale value left by older versions.
      delete settings.performanceMode;

      const purchase = {
        ...originalUser.purchase,
        isPro: formState.isPro,
        isSupporter: formState.isSupporter,
        hadPro: formState.hadPro || formState.isPro
      };

      const progress = {
        ...originalUser.progress,
        startDate: formState.startDate,
        isSetup: formState.isSetup,
        lastCompletionChange: new Date().toISOString()
      };

      await updateUserProfile(selectedUid, profile);
      await updateUserSettings(selectedUid, settings);
      await updateUserPurchase(selectedUid, purchase);
      await updateUserProgress(selectedUid, progress);

      // Update local state
      setDataState(prev => ({
        ...prev,
        usersData: {
          ...prev.usersData,
          [selectedUid]: {
            ...originalUser,
            profile,
            settings,
            purchase,
            progress
          }
        }
      }));

      setMessage({ type: 'success', text: 'Modifications enregistrées avec succès.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde : ' + err.message });
    } finally {
      setSaveLoading(false);
    }
  };

  // Danger action: clear completions + zero leaderboard totals.
  const handleResetProgress = async () => {
    if (!selectedUid) return;
    setSaveLoading(true);
    setMessage(null);
    try {
      await resetUserProgress(selectedUid);
      setDataState(prev => {
        const originalUser = prev.usersData[selectedUid] || {};
        const updatedUser = {
          ...originalUser,
          progress: {
            ...originalUser.progress,
            completions: {},
            lastCompletionChange: new Date().toISOString(),
          },
        };
        setKeyJsonContents(c => ({
          ...c,
          progress: JSON.stringify(updatedUser.progress, null, 2),
          '__full__': JSON.stringify(updatedUser, null, 2),
        }));
        return { ...prev, usersData: { ...prev.usersData, [selectedUid]: updatedUser } };
      });
      setMessage({ type: 'success', text: 'Progression réinitialisée (jours et totaux remis à zéro).' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la réinitialisation : ' + err.message });
    } finally {
      setSaveLoading(false);
    }
  };

  // Danger action: delete the user's database record + leaderboard entry.
  const handleDeleteUser = async () => {
    if (!selectedUid) return;
    setSaveLoading(true);
    setMessage(null);
    const deletedUid = selectedUid;
    try {
      await deleteUserData(deletedUid);
      setSelectedUid(null);
      setDataState(prev => {
        const nextUsers = { ...prev.usersData };
        delete nextUsers[deletedUid];
        return { ...prev, usersData: nextUsers };
      });
      setMessage({ type: 'success', text: 'Données de l\'utilisateur supprimées (compte Auth non affecté).' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression : ' + err.message });
    } finally {
      setSaveLoading(false);
    }
  };

  return {
    loading, refreshing, loadData, message,
    searchQuery, setSearchQuery, filteredUsers,
    sortBy, sortReversed, cycleSort,
    activeFilters, toggleFilter, clearFilters,
    selectedUid, setSelectedUid, editMode, setEditMode,
    handleSelectUser, selectedUserKeys, selectedMeta,
    expandedKeys, toggleKeyAccordion,
    keyJsonContents, keyJsonErrors, keyEditorFormats, setKeyEditorFormats,
    keyJsonDirty, handleRevertKeyJson,
    handleKeyJsonChange, handleFormatKeyJson, handleSaveKeyJson,
    formState, setFormState, saveLoading, handleSaveForm,
    handleResetProgress, handleDeleteUser,
  };
}
