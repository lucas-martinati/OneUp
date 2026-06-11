import React from 'react';
import { Sparkles, Heart, Save, Calendar, Loader2 } from '../../utils/icons';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { SettingRow } from '../ui/SettingRow';

const sectionTitleStyle = {
  marginBottom: 'var(--spacing-md)', fontSize: '0.85rem', fontWeight: '700',
  textTransform: 'uppercase', letterSpacing: '1px',
  color: 'var(--text-secondary)'
};

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-subtle)', background: 'var(--surface-muted)',
  color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: '600', outline: 'none', boxSizing: 'border-box'
};

const labelStyle = {
  fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '6px'
};

/** Form mode of the admin user editor: profile, entitlements, settings, progress. */
export function AdminUserForm({ formState, setFormState, saveLoading, onSave, onBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Section Profile */}
      <div className="glass-premium" style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)', background: 'var(--surface-section)' }}>
        <h3 style={sectionTitleStyle}>Profil Utilisateur</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle}>
              Email de connexion
            </label>
            <input
              type="email"
              value={formState.email}
              onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
              style={inputStyle}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '6px', opacity: 0.6 }}>
              ℹ️ Pour récupérer les e-mails de tout le monde, déployez et exécutez la fonction Cloud de backfill une seule fois.
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              Nom d'affichage (Display Name)
            </label>
            <input
              type="text"
              value={formState.displayName}
              onChange={(e) => setFormState(prev => ({ ...prev, displayName: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              URL de Photo de profil
            </label>
            <input
              type="text"
              value={formState.photoURL}
              onChange={(e) => setFormState(prev => ({ ...prev, photoURL: e.target.value }))}
              style={inputStyle}
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
            <label style={labelStyle}>
              Pseudo pour le Classement (Leaderboard)
            </label>
            <input
              type="text"
              value={formState.leaderboardPseudo}
              onChange={(e) => setFormState(prev => ({ ...prev, leaderboardPseudo: e.target.value.slice(0, 20) }))}
              placeholder="Pseudo du classement"
              maxLength={20}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Section Progrès */}
      <div className="glass-premium" style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)', background: 'var(--surface-section)' }}>
        <h3 style={sectionTitleStyle}>Progression</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>
              Date de commencement du défi (Format YYYY-MM-DD)
            </label>
            <input
              type="text"
              value={formState.startDate}
              onChange={(e) => setFormState(prev => ({ ...prev, startDate: e.target.value }))}
              placeholder="Ex: 2026-01-01"
              style={inputStyle}
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
          onClick={onSave}
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
          onClick={onBack}
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
  );
}
