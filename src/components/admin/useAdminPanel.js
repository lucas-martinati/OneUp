import { useState, useEffect, useMemo } from 'react';
import { ref, get, set } from 'firebase/database';
import { getDatabaseInstance } from '../../services/firebase';
import { fetchAllUsersData, updateUserProfile, updateUserSettings, updateUserProgress, updateUserPurchase, saveUserData } from '../../services/adminService';

/**
 * All state and Firebase logic of the admin panel: user list loading,
 * search filtering, form edition and per-key JSON section edition.
 */
export function useAdminPanel() {
  // Store both the users list and leaderboard fallbacks
  const [dataState, setDataState] = useState({ usersData: null, leaderboardData: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    isPro: false,
    isSupporter: false,
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
      try {
        const db = getDatabaseInstance();
        if (db) {
          const snapshot = await get(ref(db, 'leaderboard'));
          if (snapshot.exists()) {
            lbData = snapshot.val();
          }
        }
      } catch (lbErr) {
        console.warn('Could not load leaderboard for fallback details', lbErr);
      }

      setDataState({
        usersData: uData || {},
        leaderboardData: lbData
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
        rawData: data
      };
    }).filter(u => {
      return (
        u.uid.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.displayName.toLowerCase().includes(query)
      );
    });
  }, [dataState, searchQuery]);

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
      isPro: !!user.rawData.purchase?.isPro,
      isSupporter: !!user.rawData.purchase?.isSupporter,
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
        await set(ref(db, `users/${selectedUid}/${key}`), finalValue);

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
        leaderboardPseudo: formState.leaderboardPseudo
      };

      const purchase = {
        ...originalUser.purchase,
        isPro: formState.isPro,
        isSupporter: formState.isSupporter,
        hadPro: formState.isPro || !!originalUser.purchase?.hadPro
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

  return {
    loading, refreshing, loadData, message,
    searchQuery, setSearchQuery, filteredUsers,
    selectedUid, setSelectedUid, editMode, setEditMode,
    handleSelectUser, selectedUserKeys,
    expandedKeys, toggleKeyAccordion,
    keyJsonContents, keyJsonErrors, keyEditorFormats, setKeyEditorFormats,
    handleKeyJsonChange, handleFormatKeyJson, handleSaveKeyJson,
    formState, setFormState, saveLoading, handleSaveForm,
  };
}
