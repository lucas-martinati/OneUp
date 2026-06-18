import React from 'react';
import { X, Shield, ArrowLeft, Loader2, RefreshCw } from '../../utils/icons';
import { Z_INDEX } from '../../utils/zIndex';
import { useAdminPanel } from './useAdminPanel';
import { AdminUserList } from './AdminUserList';
import { AdminUserForm } from './AdminUserForm';
import { AdminJsonSectionsEditor } from './AdminJsonSectionsEditor';

const tabButtonStyle = (isActive) => ({
  flex: 1, padding: '10px', borderRadius: 'var(--radius-md)',
  background: isActive ? 'var(--surface-hover)' : 'transparent',
  border: `1px solid ${isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
  fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s ease'
});

const roundButtonStyle = {
  background: 'var(--surface-hover)', border: 'none', borderRadius: '50%',
  width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--text-primary)', cursor: 'pointer'
};

export function AdminPanel({ onClose }) {
  const {
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
  } = useAdminPanel();

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
                ...roundButtonStyle,
                width: 'var(--touch-min)', height: 'var(--touch-min)'
              }}>
                <ArrowLeft size={22} />
              </button>
            )}
            <h2 className="panel-title" style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                style={roundButtonStyle}
              >
                <RefreshCw size={18} className={refreshing ? 'spin-anim' : ''} />
              </button>
            )}
            <button onClick={onClose} className="hover-lift glass" style={{ ...roundButtonStyle, flexShrink: 0 }}>
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
          <AdminUserList
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            sortReversed={sortReversed}
            cycleSort={cycleSort}
            activeFilters={activeFilters}
            toggleFilter={toggleFilter}
            clearFilters={clearFilters}
            filteredUsers={filteredUsers}
            onSelectUser={handleSelectUser}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Tabs Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--spacing-md)', flexShrink: 0 }}>
              <button onClick={() => setEditMode('form')} style={tabButtonStyle(editMode === 'form')}>
                Formulaire
              </button>
              <button onClick={() => setEditMode('json')} style={tabButtonStyle(editMode === 'json')}>
                Éditeur JSON Sections
              </button>
            </div>

            {/* Scrollable Workspace */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 'var(--spacing-md)', paddingRight: '4px' }}>
              {editMode === 'form' ? (
                <AdminUserForm
                  formState={formState}
                  setFormState={setFormState}
                  meta={selectedMeta}
                  saveLoading={saveLoading}
                  onSave={handleSaveForm}
                  onResetProgress={handleResetProgress}
                  onDeleteUser={handleDeleteUser}
                  onBack={() => setSelectedUid(null)}
                />
              ) : (
                <AdminJsonSectionsEditor
                  selectedUserKeys={selectedUserKeys}
                  expandedKeys={expandedKeys}
                  onToggleKey={toggleKeyAccordion}
                  keyJsonContents={keyJsonContents}
                  keyJsonErrors={keyJsonErrors}
                  keyEditorFormats={keyEditorFormats}
                  setKeyEditorFormats={setKeyEditorFormats}
                  keyJsonDirty={keyJsonDirty}
                  onRevertJson={handleRevertKeyJson}
                  onJsonChange={handleKeyJsonChange}
                  onFormatJson={handleFormatKeyJson}
                  onSaveJson={handleSaveKeyJson}
                  saveLoading={saveLoading}
                  onBack={() => setSelectedUid(null)}
                />
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
