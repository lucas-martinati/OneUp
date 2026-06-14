import React from 'react';
import { Search } from 'lucide-react';
import { User, Clock } from '../../utils/icons';

/** Searchable user list of the admin panel. */
export function AdminUserList({ searchQuery, setSearchQuery, filteredUsers, onSelectUser }) {
  return (
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
  );
}
