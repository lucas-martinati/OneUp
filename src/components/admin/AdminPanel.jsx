import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search } from 'lucide-react';
import { ref, get, set } from 'firebase/database';
import { getDatabaseInstance } from '../../services/firebase';
import { 
  X, Shield, User, Sparkles, Heart, Save, Calendar, 
  Clock, Edit2, ArrowLeft, Loader2, RefreshCw, Lock, Code
} from '../../utils/icons';
import { fetchAllUsersData, updateUserProfile, updateUserSettings, updateUserProgress, updateUserPurchase, saveUserData } from '../../services/adminService';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { SettingRow } from '../ui/SettingRow';
import { JsonTreeEditor } from './JsonTreeEditor';
import { Z_INDEX } from '../../utils/zIndex';

// Custom Line-Numbered Textarea resembling VSCode
function LineNumberTextarea({ value, onChange, placeholder, height = '350px' }) {
  const lineCount = value.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
  const textareaRef = useRef(null);
  const lineRef = useRef(null);

  const handleScroll = () => {
    if (textareaRef.current && lineRef.current) {
      lineRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange({ target: { value: newValue } });
      
      // Keep cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      border: '1px solid var(--border-subtle)', 
      borderRadius: 'var(--radius-lg)', 
      background: '#0a0a0f', 
      overflow: 'hidden', 
      height: height,
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)'
    }}>
      {/* Line Numbers column */}
      <div 
        ref={lineRef}
        style={{
          width: '44px', padding: '16px 8px', background: '#07070a',
          color: '#555577', textAlign: 'right', fontFamily: 'Fira Code, Consolas, Monaco, monospace',
          fontSize: '0.85rem', lineHeight: '1.5', overflow: 'hidden',
          borderRight: '1px solid rgba(255,255,255,0.05)', userSelect: 'none',
          whiteSpace: 'pre', boxSizing: 'border-box'
        }}
      >
        {lineNumbers}
      </div>
      {/* Main Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        spellCheck="false"
        style={{
          flex: 1, padding: '16px', background: 'transparent',
          color: '#c084fc', fontFamily: 'Fira Code, Consolas, Monaco, monospace', fontSize: '0.85rem',
          lineHeight: '1.5', border: 'none', outline: 'none',
          resize: 'none', height: '100%', boxSizing: 'border-box',
          overflowY: 'auto', whiteSpace: 'pre', tabSize: 2
        }}
      />
    </div>
  );
}

export function AdminPanel({ onClose }) {
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

  const sectionTitleStyle = {
    marginBottom: 'var(--spacing-md)', fontSize: '0.85rem', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: '1px',
    color: 'var(--text-secondary)'
  };

  return (
    <div className="fade-in modal-overlay" style={{ zIndex: Z_INDEX.MODAL }}>
      <div className="modal-content" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', height: '90vh' }}>
        
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 'var(--spacing-md)', flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {selectedUid && (
              <button onClick={() => setSelectedUid(null)} className="hover-lift glass" style={{
                background: 'var(--surface-hover)', border: 'none', borderRadius: '50%',
                width: 'var(--touch-min)', height: 'var(--touch-min)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-primary)', cursor: 'pointer'
              }}>
                <ArrowLeft size={22} />
              </button>
            )}
            <h2 className="panel-title rainbow-gradient" style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={22} color="#ef4444" />
              {selectedUid ? 'Modifier Utilisateur' : "Panel d'Administration"}
            </h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!selectedUid && (
              <button 
                onClick={() => loadData(true)} 
                disabled={refreshing || loading}
                className="hover-lift glass" 
                style={{
                  background: 'var(--surface-hover)', border: 'none', borderRadius: '50%',
                  width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-primary)', cursor: 'pointer'
                }}
              >
                <RefreshCw size={18} className={refreshing ? 'spin-anim' : ''} />
              </button>
            )}
            <button onClick={onClose} className="hover-lift glass" style={{
              background: 'var(--surface-hover)', border: 'none', borderRadius: '50%',
              width: '40px', height: '40px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-primary)', cursor: 'pointer'
            }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Global Notifications Alert */}
        {message && (
          <div className="scale-in" style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: message.type === 'success' ? '#10b981' : '#fca5a5',
            fontSize: '0.9rem',
            fontWeight: '600',
            marginBottom: 'var(--spacing-md)',
            flexShrink: 0
          }}>
            {message.text}
          </div>
        )}

        {/* Content Workspace */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px' }}>
            <Loader2 size={36} className="spin-anim" color="#ef4444" />
            <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Chargement de la base de données...</span>
          </div>
        ) : !selectedUid ? (
          /* ==================== USER LIST VIEW ==================== */
          <>
            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: 'var(--spacing-md)', flexShrink: 0 }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="Rechercher par pseudo, email ou UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px 12px 42px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-muted)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem', fontWeight: '600',
                  outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
              {filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  Aucun utilisateur trouvé
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div 
                    key={user.uid}
                    onClick={() => handleSelectUser(user)}
                    className="hover-lift glass-premium"
                    style={{
                      padding: '16px', borderRadius: 'var(--radius-lg)',
                      background: 'var(--surface-section)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName}
                          style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
                        />
                      ) : (
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05))',
                          border: '2px solid rgba(239, 68, 68, 0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444'
                        }}>
                          <User size={20} />
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.displayName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {user.email || "Email non renseigné"}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', marginTop: '2px' }}>
                          UID: {user.uid}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {user.isPro && (
                          <span style={{ fontSize: '0.65rem', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>
                            PRO
                          </span>
                        )}
                        {user.isSupporter && (
                          <span style={{ fontSize: '0.65rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>
                            SUPPORT
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Jours: <strong style={{ color: 'var(--text-primary)' }}>{user.completionsCount}</strong>
                      </div>
                      {user.lastSeen && (
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={10} />
                          {new Date(user.lastSeen).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* ==================== USER EDITOR VIEW ==================== */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Tabs Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--spacing-md)', flexShrink: 0 }}>
              <button 
                onClick={() => setEditMode('form')}
                style={{
                  flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                  background: editMode === 'form' ? 'var(--surface-hover)' : 'transparent',
                  border: `1px solid ${editMode === 'form' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                  color: editMode === 'form' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                Formulaire
              </button>
              <button 
                onClick={() => setEditMode('json')}
                style={{
                  flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
                  background: editMode === 'json' ? 'var(--surface-hover)' : 'transparent',
                  border: `1px solid ${editMode === 'json' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                  color: editMode === 'json' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                Éditeur JSON Sections
              </button>
            </div>

            {/* Scrollable Workspace */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 'var(--spacing-md)', paddingRight: '4px' }}>
              {editMode === 'form' ? (
                /* FORM MODE */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Section Profile */}
                  <div className="glass-premium" style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)', background: 'var(--surface-section)' }}>
                    <h3 style={sectionTitleStyle}>Profil Utilisateur</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                          Email de connexion
                        </label>
                        <input
                          type="email"
                          value={formState.email}
                          onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                          style={{
                            width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)', background: 'var(--surface-muted)',
                            color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: '600', outline: 'none', boxSizing: 'border-box'
                          }}
                        />
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '6px', opacity: 0.6 }}>
                          ℹ️ Pour récupérer les e-mails de tout le monde, déployez et exécutez la fonction Cloud de backfill une seule fois.
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                          Nom d'affichage (Display Name)
                        </label>
                        <input
                          type="text"
                          value={formState.displayName}
                          onChange={(e) => setFormState(prev => ({ ...prev, displayName: e.target.value }))}
                          style={{
                            width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)', background: 'var(--surface-muted)',
                            color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: '600', outline: 'none', boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                          URL de Photo de profil
                        </label>
                        <input
                          type="text"
                          value={formState.photoURL}
                          onChange={(e) => setFormState(prev => ({ ...prev, photoURL: e.target.value }))}
                          style={{
                            width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)', background: 'var(--surface-muted)',
                            color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: '600', outline: 'none', boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section Abonnements / Droits */}
                  <div className="glass-premium" style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)', background: 'var(--surface-section)' }}>
                    <h3 style={sectionTitleStyle}>Abonnements & Droits</h3>

                    <SettingRow
                      icon={Sparkles}
                      title="Utilisateur PRO"
                      description="Déverrouille les catégories personnalisées, les thèmes Pro, etc."
                      color="#8b5cf6"
                      isLast={false}
                    >
                      <ToggleSwitch
                        enabled={formState.isPro}
                        onClick={() => setFormState(prev => ({ ...prev, isPro: !prev.isPro }))}
                        activeGradient="linear-gradient(135deg, #8b5cf6, #6d28d9)"
                      />
                    </SettingRow>

                    <SettingRow
                      icon={Heart}
                      title="Utilisateur SUPPORT"
                      description="Indique que l'utilisateur soutient l'application."
                      color="#ef4444"
                      isLast={true}
                    >
                      <ToggleSwitch
                        enabled={formState.isSupporter}
                        onClick={() => setFormState(prev => ({ ...prev, isSupporter: !prev.isSupporter }))}
                        activeGradient="linear-gradient(135deg, #ef4444, #dc2626)"
                      />
                    </SettingRow>
                  </div>

                  {/* Section Configuration settings */}
                  <div className="glass-premium" style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)', background: 'var(--surface-section)' }}>
                    <h3 style={sectionTitleStyle}>Préférences App</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                          Pseudo pour le Classement (Leaderboard)
                        </label>
                        <input
                          type="text"
                          value={formState.leaderboardPseudo}
                          onChange={(e) => setFormState(prev => ({ ...prev, leaderboardPseudo: e.target.value.slice(0, 20) }))}
                          placeholder="Pseudo du classement"
                          maxLength={20}
                          style={{
                            width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)', background: 'var(--surface-muted)',
                            color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: '600', outline: 'none', boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section Progrès */}
                  <div className="glass-premium" style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)', background: 'var(--surface-section)' }}>
                    <h3 style={sectionTitleStyle}>Progression</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                          Date de commencement du défi (Format YYYY-MM-DD)
                        </label>
                        <input
                          type="text"
                          value={formState.startDate}
                          onChange={(e) => setFormState(prev => ({ ...prev, startDate: e.target.value }))}
                          placeholder="Ex: 2026-01-01"
                          style={{
                            width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)', background: 'var(--surface-muted)',
                            color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: '600', outline: 'none', boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    <SettingRow
                      icon={Calendar}
                      title="Configuration Complétée"
                      description="Indique si le profil a passé l'onboarding initial."
                      color="#10b981"
                      isLast={true}
                    >
                      <ToggleSwitch
                        enabled={formState.isSetup}
                        onClick={() => setFormState(prev => ({ ...prev, isSetup: !prev.isSetup }))}
                        activeGradient="linear-gradient(135deg, #10b981, #059669)"
                      />
                    </SettingRow>
                  </div>

                  {/* Form Save Button */}
                  <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
                    <button
                      disabled={saveLoading}
                      onClick={handleSaveForm}
                      className="hover-lift"
                      style={{
                        flex: 1, padding: '14px', borderRadius: 'var(--radius-lg)',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: 'white', fontWeight: '800', fontSize: '0.95rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '8px', cursor: saveLoading ? 'not-allowed' : 'pointer', border: 'none',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      {saveLoading ? (
                        <Loader2 size={18} className="spin-anim" />
                      ) : (
                        <Save size={18} />
                      )}
                      <span>Enregistrer Profil & Droits</span>
                    </button>
                    <button
                      onClick={() => setSelectedUid(null)}
                      style={{
                        padding: '14px 24px', borderRadius: 'var(--radius-lg)',
                        background: 'transparent',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)', fontWeight: '700', fontSize: '0.95rem',
                        cursor: 'pointer'
                      }}
                    >
                      Retour
                    </button>
                  </div>

                </div>
              ) : (
                /* ACCORDION / COLLAPSIBLE JSON EDITOR MODE */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedUserKeys.map((key) => {
                    const isExpanded = !!expandedKeys[key];
                    const contentValue = keyJsonContents[key] || '';
                    const hasError = keyJsonErrors[key];
                    const isFullDoc = key === '__full__';

                    return (
                      <div 
                        key={key}
                        style={{
                          borderRadius: 'var(--radius-lg)',
                          border: isExpanded ? '1px solid rgba(167,139,250,0.3)' : '1px solid var(--border-subtle)',
                          background: isExpanded ? 'rgba(10, 10, 15, 0.6)' : 'var(--surface-section)',
                          transition: 'all 0.2s ease',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Accordion Header */}
                        <div 
                          onClick={() => toggleKeyAccordion(key)}
                          style={{
                            padding: '12px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            background: isExpanded ? 'rgba(167, 139, 250, 0.08)' : 'transparent',
                            userSelect: 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              color: isExpanded ? '#a78bfa' : 'var(--text-secondary)', 
                              fontSize: '0.75rem',
                              transition: 'transform 0.2s',
                              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                              display: 'inline-block'
                            }}>
                              ▶
                            </span>
                            <span style={{ 
                              fontFamily: 'monospace', 
                              fontWeight: '700', 
                              color: isFullDoc ? '#ef4444' : (isExpanded ? '#a78bfa' : 'var(--text-primary)'),
                              fontSize: '0.95rem'
                            }}>
                              {isFullDoc ? '📄 Fiche complète (Raw)' : `"${key}"`}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                            {isExpanded ? 'Clic pour plier' : `Clic pour déplier { ... }`}
                          </span>
                        </div>

                        {/* Accordion Content */}
                        {isExpanded && (
                          <div className="scale-in" style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div style={{
                                background: isFullDoc ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${isFullDoc ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)'}`,
                                padding: '6px 12px', borderRadius: 'var(--radius-md)', 
                                color: isFullDoc ? '#fca5a5' : 'var(--text-secondary)',
                                fontSize: '0.72rem', display: 'flex', gap: '6px', alignItems: 'center'
                              }}>
                                <Lock size={12} />
                                <span>{isFullDoc ? 'Édition globale directe.' : `Modifie uniquement la clé "${key}".`}</span>
                              </div>

                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {/* Editor Format Toggle Switcher */}
                                <div style={{ 
                                  display: 'flex', 
                                  background: 'rgba(255, 255, 255, 0.04)', 
                                  padding: '2px', 
                                  borderRadius: 'var(--radius-md)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)'
                                }}>
                                  <button
                                    onClick={() => setKeyEditorFormats(prev => ({ ...prev, [key]: 'tree' }))}
                                    style={{
                                      padding: '4px 10px',
                                      background: keyEditorFormats[key] !== 'raw' ? 'rgba(255,255,255,0.08)' : 'transparent',
                                      border: 'none',
                                      borderRadius: '4px',
                                      color: keyEditorFormats[key] !== 'raw' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                      fontSize: '0.72rem',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    Arborescence
                                  </button>
                                  <button
                                    onClick={() => setKeyEditorFormats(prev => ({ ...prev, [key]: 'raw' }))}
                                    style={{
                                      padding: '4px 10px',
                                      background: keyEditorFormats[key] === 'raw' ? 'rgba(255,255,255,0.08)' : 'transparent',
                                      border: 'none',
                                      borderRadius: '4px',
                                      color: keyEditorFormats[key] === 'raw' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                      fontSize: '0.72rem',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    Code brut
                                  </button>
                                </div>

                                {keyEditorFormats[key] === 'raw' && (
                                  <button
                                    onClick={() => handleFormatKeyJson(key)}
                                    className="hover-lift"
                                    style={{
                                      padding: '6px 10px',
                                      background: 'var(--surface-hover)',
                                      border: '1px solid rgba(255,255,255,0.08)',
                                      borderRadius: 'var(--radius-md)',
                                      color: 'var(--text-primary)',
                                      fontSize: '0.72rem',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <Code size={12} />
                                    Formater
                                  </button>
                                )}
                                
                                <button
                                  disabled={saveLoading || !!hasError}
                                  onClick={() => handleSaveKeyJson(key)}
                                  className="hover-lift"
                                  style={{
                                    padding: '6px 12px',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'white',
                                    fontSize: '0.72rem',
                                    fontWeight: '800',
                                    cursor: (saveLoading || !!hasError) ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    opacity: (saveLoading || !!hasError) ? 0.6 : 1
                                  }}
                                >
                                  <Save size={12} />
                                  Sauvegarder Section
                                </button>
                              </div>
                            </div>

                            {/* Section Editor content (Tree or LineNumberTextarea) */}
                            <div style={{ marginTop: '12px' }}>
                              {keyEditorFormats[key] !== 'raw' ? (
                                <JsonTreeEditor
                                  value={contentValue}
                                  onChange={(newValue) => {
                                    const textVal = JSON.stringify(newValue, null, 2);
                                    handleKeyJsonChange(key, textVal);
                                  }}
                                />
                              ) : (
                                <LineNumberTextarea
                                  value={contentValue}
                                  onChange={(e) => handleKeyJsonChange(key, e.target.value)}
                                  placeholder={`Saisissez le contenu pour ${key}...`}
                                  height={isFullDoc ? '380px' : '220px'}
                                />
                              )}
                            </div>

                            {/* Live syntax error check for this section */}
                            {keyEditorFormats[key] === 'raw' && (
                              <div style={{
                                marginTop: '8px',
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                                color: hasError ? '#ef4444' : '#10b981',
                                padding: '6px 10px',
                                background: hasError ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                                borderRadius: 'var(--radius-sm)',
                                border: `1px solid ${hasError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'}`
                              }}>
                                {hasError ? `❌ Erreur : ${hasError}` : `✅ JSON pour "${key}" valide`}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Cancel/Close Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-md)' }}>
                    <button
                      onClick={() => setSelectedUid(null)}
                      style={{
                        padding: '12px 24px', borderRadius: 'var(--radius-lg)',
                        background: 'transparent',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)', fontWeight: '700', fontSize: '0.95rem',
                        cursor: 'pointer'
                      }}
                    >
                      Retour aux utilisateurs
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
