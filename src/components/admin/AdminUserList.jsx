import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Clock, Filter, X, ChevronDown, ChevronUp } from '@utils/icons';
import { Avatar, Input, Badge, Button } from '@components/ui';
import { FILTER_OPTIONS } from './useAdminPanel';

const SORT_OPTIONS = [
  { id: 'activity', label: 'Activité' },
  { id: 'reps', label: 'Reps' },
  { id: 'days', label: 'Jours' },
  { id: 'name', label: 'Nom A-Z' },
];

/** Searchable user list of the admin panel. */
export function AdminUserList({ searchQuery, setSearchQuery, sortBy, sortReversed, cycleSort, activeFilters, toggleFilter, clearFilters, filteredUsers, onSelectUser }) {
  const [showFilters, setShowFilters] = useState(false);
  const filterCount = activeFilters.length;

  return (
    <>
      {/* Search Bar + Filter toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-3)', flexShrink: 0, alignItems: 'center' }}>
        <Input
          type="search"
          placeholder="Rechercher par pseudo, email ou UID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={Search}
          fullWidth
        />
        <div style={{ position: 'relative' }}>
          <Button
            iconOnly
            icon={Filter}
            onClick={() => setShowFilters(s => !s)}
            aria-label="Filtres"
            variant={showFilters || filterCount ? 'primary' : 'glass'}
            className="hover-lift"
          />
          {filterCount > 0 && (
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px', minWidth: '18px', height: '18px',
              padding: '0 4px', borderRadius: '999px', background: 'var(--accent-glow)', color: '#fff',
              fontSize: '0.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {filterCount}
            </span>
          )}
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="scale-in" style={{
          marginBottom: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)',
          background: 'var(--surface-muted)', border: '1px solid var(--border-default)', flexShrink: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Filtres
            </span>
            {filterCount > 0 && (
              <button
                onClick={clearFilters}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer',
                  background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                  fontSize: '0.75rem', fontWeight: '700'
                }}
              >
                <X size={14} /> Réinitialiser
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {FILTER_OPTIONS.map(opt => {
              const active = activeFilters.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleFilter(opt.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 'var(--radius-full)', cursor: 'pointer',
                    fontSize: '0.78rem', fontWeight: '700', whiteSpace: 'nowrap',
                    background: active ? 'var(--accent)' : 'transparent',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border-subtle)'}`,
                    color: active ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sort selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)', flexShrink: 0 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
          Trier
        </span>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {SORT_OPTIONS.map(opt => {
            const active = (sortBy || 'activity') === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => cycleSort(opt.id)}
                title={active ? 'Cliquer pour inverser l\'ordre' : undefined}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: '2px',
                  padding: '6px 12px', borderRadius: 'var(--radius-full)', cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: '700', whiteSpace: 'nowrap',
                  background: active ? 'var(--surface-hover)' : 'transparent',
                  border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease'
                }}
              >
                {opt.label}
                {active && (sortReversed ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', paddingRight: '4px' }}>
        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Aucun utilisateur trouvé
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.uid}
              onClick={() => onSelectUser(user)}
              className="hover-lift glass"
              style={{
                padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-default)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer', transition: 'background-color 0.2s ease, border-color 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                <Avatar photoURL={user.photoURL} name={user.displayName} size={44} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.displayName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.email || "Email non renseigné"}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    <Badge variant={user.isSetup ? 'success' : 'default'} size="sm">
                      {user.isSetup ? '✓ Configuré' : '✗ Non configuré'}
                    </Badge>
                    {user.startDate && (
                      <Badge variant="info" size="sm">Début {user.startDate}</Badge>
                    )}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontFamily: 'monospace', marginTop: '4px' }}>
                    UID: {user.uid}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {user.isPro && (
                    <Badge variant="pro" size="sm">PRO</Badge>
                  )}
                  {user.isSupporter && (
                    <Badge variant="warning" size="sm">SUPPORT</Badge>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Jours: <strong style={{ color: 'var(--text-primary)' }}>{user.completionsCount}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Reps: <strong style={{ color: 'var(--text-primary)' }}>{(user.totalReps || 0).toLocaleString()}</strong>
                </div>
                {user.lastSeen && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
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
  );
}

