import React, { useRef, useCallback } from 'react';
import { X, Shield, ArrowLeft, RefreshCw } from '@utils/icons';
import { Z_INDEX } from '@utils/zIndex';
import { Spinner, Button, SegmentedControl } from '@components/ui';
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

  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const touch = e.changedTouches[0];
    const start = touchStartRef.current;
    const diffX = start.x - touch.clientX;
    const diffY = start.y - touch.clientY;
    const duration = Date.now() - start.time;

    if (Math.abs(diffX) > 60 && Math.abs(diffY) < Math.abs(diffX) * 0.6 && duration < 300) {
      const tabs = ['form', 'json'];
      const currentIndex = tabs.indexOf(editMode);
      if (diffX > 0) {
        if (currentIndex < tabs.length - 1) setEditMode(tabs[currentIndex + 1]);
      } else {
        if (currentIndex > 0) setEditMode(tabs[currentIndex - 1]);
      }
    }
  }, [editMode, setEditMode]);


  return (
    <div className="fade-in modal-overlay" style={{ zIndex: Z_INDEX.MODAL }}>
      <div 
        className="modal-content" 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ maxWidth: '840px', display: 'flex', flexDirection: 'column', height: '90vh' }}
      >

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexShrink: 0 }}>
          <div className="flex-align-center gap-12" style={{ alignItems: 'center' }}>
            {selectedUid && (
              <Button
                iconOnly
                icon={ArrowLeft}
                onClick={() => setSelectedUid(null)}
                aria-label="Retour"
                variant="glass"
                className="hover-lift"
              />
            )}
            <h2 className="panel-title" style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={22} color="var(--error)" />
              {selectedUid ? 'Modifier Utilisateur' : "Panel d'Administration"}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!selectedUid && (
              <Button
                iconOnly
                icon={RefreshCw}
                onClick={() => loadData(true)}
                disabled={refreshing || loading}
                aria-label="Actualiser"
                variant="glass"
                className={`hover-lift ${refreshing ? 'spin' : ''}`}
              />
            )}
            <Button
              iconOnly
              icon={X}
              onClick={onClose}
              aria-label="Fermer"
              variant="glass"
              className="hover-lift"
            />
          </div>
        </div>

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

