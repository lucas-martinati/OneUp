import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Clock, Filter, X, Check, ChevronDown, ChevronUp, ChevronRight, Crown, Dumbbell, Calendar, Heart } from '@utils/icons';
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
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
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
          padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)',
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
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border-default)'}`,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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
                  border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border-default)'}`,
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
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        paddingRight: '4px',
        overflow: 'visible'
        }}>
        {filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            Aucun utilisateur trouvé
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.uid}
              onClick={() => onSelectUser(user)}
              className="admin-user-card glass"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectUser(user);
                }
              }}
            >
              <div className="admin-user-card-left">
                <div className="admin-user-avatar-wrap">
                  <Avatar photoURL={user.photoURL} name={user.displayName} size={46} />
                  {user.isPro && (
                    <div className="admin-user-pro-crown" title="Utilisateur PRO">
                      <Crown size={11} />
                    </div>
                  )}
                </div>

                <div className="admin-user-info">
                  <div className="admin-user-name-row">
                    <span className="admin-user-name">{user.displayName}</span>
                    {user.isPro && !user.photoURL && (
                      <Badge variant="pro" size="sm">PRO</Badge>
                    )}
                  </div>

                  <div className="admin-user-email">
                    {user.email || 'Email non renseigné'}
                  </div>

                  <div className="admin-user-meta-row">
                    <Badge variant={user.isSetup ? 'success' : 'default'} size="sm" icon={user.isSetup ? Check : X}>
                      {user.isSetup ? 'Configuré' : 'Non configuré'}
                    </Badge>
                    {user.startDate && (
                      <Badge variant="info" size="sm" icon={Calendar}>
                        {user.startDate}
                      </Badge>
                    )}
                    <span className="admin-user-uid-pill" title={`UID: ${user.uid}`}>
                      {user.uid.length > 12 ? `${user.uid.slice(0, 8)}…` : user.uid}
                    </span>
                  </div>
                </div>
              </div>

              <div className="admin-user-card-right">
                <div className="admin-user-stats-col">
                  {(user.isPro || user.isSupporter) && (
                    <div className="admin-user-badges-top">
                      {user.isPro && (
                        <Badge variant="pro" size="sm" icon={Crown}>PRO</Badge>
                      )}
                      {user.isSupporter && (
                        <Badge variant="warning" size="sm" icon={Heart}>SUPPORT</Badge>
                      )}
                    </div>
                  )}

                  <div className="admin-stat-pills">
                    <div className="admin-stat-pill" title="Jours d'entraînement complétés">
                      <Calendar size={12} color="var(--warning)" />
                      <span><strong>{user.completionsCount}</strong> j</span>
                    </div>
                    <div className="admin-stat-pill" title="Répétitions totales">
                      <Dumbbell size={12} color="var(--accent-glow)" />
                      <span><strong>{(user.totalReps || 0).toLocaleString()}</strong> reps</span>
                    </div>
                  </div>

                  {user.lastSeen && (
                    <div className="admin-last-seen" title={`Dernière activité : ${new Date(user.lastSeen).toLocaleString()}`}>
                      <Clock size={10} />
                      <span>{new Date(user.lastSeen).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <ChevronRight size={18} className="admin-user-chevron" />
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}


