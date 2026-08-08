import React from 'react';
import { Shield, RefreshCw } from '@utils/icons';
import { Z_INDEX } from '@utils/zIndex';
import { useSwipeGesture } from '@hooks/useSwipeGesture';
import { Spinner, Button, SegmentedControl, ModalHeader } from '@components/ui';
import { useAdminPanel } from './useAdminPanel';
import { AdminUserList } from './AdminUserList';
import { AdminUserForm } from './AdminUserForm';
import { AdminJsonSectionsEditor } from './AdminJsonSectionsEditor';

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

  const { handleTouchStart, handleTouchEnd } = useSwipeGesture({
    onSwipeLeft: () => {
      const tabs = ['form', 'json'];
      const currentIndex = tabs.indexOf(editMode);
      if (currentIndex < tabs.length - 1) setEditMode(tabs[currentIndex + 1]);
    },
    onSwipeRight: () => {
      const tabs = ['form', 'json'];
      const currentIndex = tabs.indexOf(editMode);
      if (currentIndex > 0) setEditMode(tabs[currentIndex - 1]);
    }
  });


  return (
    <div className="fade-in modal-overlay" style={{ zIndex: Z_INDEX.MODAL }}>
      <div 
        className="modal-content" 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ maxWidth: '840px', display: 'flex', flexDirection: 'column', height: '90vh' }}
      >

        {/* Header */}
        <ModalHeader
          title={selectedUid ? 'Modifier Utilisateur' : "Panel d'Administration"}
          icon={Shield}
          onBack={selectedUid ? () => setSelectedUid(null) : undefined}
          onClose={onClose}
          actions={
            !selectedUid && (
              <Button
                iconOnly
                icon={RefreshCw}
                onClick={() => loadData(true)}
                disabled={refreshing || loading}
                aria-label="Actualiser"
                variant="glass"
                className={`${refreshing ? 'spin' : ''}`}
              />
            )
          }
        />

        {/* Global Notifications Alert */}
        {message && (
          <div className="scale-in" style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: message.type === 'success' ? 'color-mix(in srgb, var(--success) 15%, transparent)' : 'color-mix(in srgb, var(--error) 15%, transparent)',
            border: `1px solid ${message.type === 'success' ? 'color-mix(in srgb, var(--success) 35%, transparent)' : 'color-mix(in srgb, var(--error) 35%, transparent)'}`,
            color: message.type === 'success' ? 'var(--success)' : 'var(--error)',
            fontSize: '0.9rem',
            fontWeight: '600',
            marginBottom: 'var(--space-4)',
            flexShrink: 0
          }}>
            {message.text}
          </div>
        )}

        {/* Content Workspace */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <Spinner size={36} color="var(--error)" label="Chargement de la base de données..." />
          </div>
        )}
        {!loading && !selectedUid && (
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
        )}
        {!loading && selectedUid && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Tabs Selector */}
            <div style={{ marginBottom: 'var(--space-4)', flexShrink: 0 }}>
              <SegmentedControl
                variant="tabs"
                fullWidth
                options={[
                  { id: 'form', label: 'Formulaire' },
                  { id: 'json', label: 'Éditeur JSON Sections' },
                ]}
                value={editMode}
                onChange={(id) => setEditMode(id)}
              />
            </div>

            {/* Scrollable Workspace */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 'var(--space-4)', paddingRight: '4px' }}>
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

