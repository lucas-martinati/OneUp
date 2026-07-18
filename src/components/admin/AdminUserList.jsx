import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Clock, Filter, X, ChevronDown, ChevronUp } from '@utils/icons';
import { Avatar } from '@components/ui/Avatar';
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
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexShrink: 0 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
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
        <button
          onClick={() => setShowFilters(s => !s)}
          aria-label="Filtres"
          style={{
            position: 'relative', flexShrink: 0, width: '48px', borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            background: (showFilters || filterCount) ? 'var(--surface-hover)' : 'var(--surface-muted)',
            border: `1px solid ${filterCount ? 'var(--accent)' : 'var(--border-subtle)'}`,
            color: filterCount ? 'var(--accent-glow)' : 'var(--text-secondary)'
          }}
        >
          <Filter size={18} />
          {filterCount > 0 && (
            <span style={{
              position: 'absolute', top: '-6px', right: '-6px', minWidth: '18px', height: '18px',
              padding: '0 4px', borderRadius: '9px', background: 'var(--accent)', color: '#fff',
              fontSize: '0.65rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {filterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="scale-in" style={{
          marginBottom: '10px', padding: '12px', borderRadius: 'var(--radius-lg)',
          background: 'var(--surface-section)', border: '1px solid var(--border-subtle)', flexShrink: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
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
                    padding: '6px 14px', borderRadius: '999px', cursor: 'pointer',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-md)', flexShrink: 0 }}>
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
                  padding: '6px 12px', borderRadius: '999px', cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: '700', whiteSpace: 'nowrap',
                  background: active ? 'var(--surface-hover)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(255,255,255,0.2)' : 'var(--border-subtle)'}`,
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
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Aucun utilisateur trouvé
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.uid}
              onClick={() => onSelectUser(user)}
              className="hover-lift glass-premium"
              style={{
                padding: '16px', borderRadius: 'var(--radius-lg)',
                background: 'var(--surface-section)',
                border: '1px solid var(--border-subtle)',
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    <span style={metaChip(user.isSetup ? '#10b981' : '#6b7280')}>
                      {user.isSetup ? '✓ Configuré' : '✗ Non configuré'}
                    </span>
                    {user.startDate && (
                      <span style={metaChip('#06b6d4')}>Début&nbsp;{user.startDate}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', marginTop: '4px' }}>
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
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Reps: <strong style={{ color: 'var(--text-primary)' }}>{(user.totalReps || 0).toLocaleString()}</strong>
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
  );
}

function metaChip(color) {
  return {
    fontSize: '0.6rem', fontWeight: '700', padding: '1px 7px', borderRadius: '10px',
    background: `${color}1f`, border: `1px solid ${color}40`, color,
    whiteSpace: 'nowrap'
  };
}
