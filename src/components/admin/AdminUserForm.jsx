import React, { useState } from 'react';
import { Sparkles, Heart, Save, Calendar, Loader2, Crown, Copy, Check, Activity, Award, Clock, Dumbbell, RotateCcw, Trash2, AlertTriangle, Trophy, Bell, Volume2, Palette } from '../../utils/icons';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { SettingRow } from '../ui/SettingRow';
import { ThemeSwatch } from '../ui';
import { THEMES } from '../../config/themes';

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

const cardStyle = {
  padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)', background: 'var(--surface-section)'
};

const timeInputStyle = {
  width: '52px', padding: '8px', textAlign: 'center', borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-subtle)', background: 'var(--surface-muted)',
  color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: '700', outline: 'none', boxSizing: 'border-box'
};



function clampInt(value, min, max) {
  const n = parseInt(value, 10);
  if (isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function fmtDate(value, withTime = false) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return withTime ? d.toLocaleString() : d.toLocaleDateString();
}

/** A small read-only stat tile (icon + label + value). */
function StatTile({ icon: Icon, label, value, color = 'var(--text-secondary)' }) {
  return (
    <div style={{
      flex: '1 1 120px', minWidth: 0, padding: '10px 12px', borderRadius: 'var(--radius-md)',
      background: 'var(--surface-muted)', border: '1px solid var(--border-subtle)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color, marginBottom: '4px' }}>
        <Icon size={13} />
        <span style={{ fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      </div>
      <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </div>
    </div>
  );
}

/** A compact read-only "label: value" line with a copy button (UID-style). */
function CopyLine({ label, value, k, copiedKey, onCopy }) {
  const isCopied = copiedKey === k;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <code style={{
        flex: 1, minWidth: 0, fontSize: '0.7rem', color: 'var(--text-secondary)',
        fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
      }}>
        {label}: {value || '—'}
      </code>
      <button
        onClick={() => onCopy(k, value)}
        disabled={!value}
        className="hover-lift"
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
          padding: '6px 12px', borderRadius: 'var(--radius-md)', cursor: value ? 'pointer' : 'not-allowed',
          background: 'var(--surface-muted)', border: '1px solid var(--border-subtle)',
          color: isCopied ? '#10b981' : 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '700'
        }}
      >
        {isCopied ? <Check size={14} /> : <Copy size={14} />}
        {isCopied ? 'Copié' : 'Copier'}
      </button>
    </div>
  );
}

/** Form mode of the admin user editor: meta, profile, entitlements, settings, progress, danger zone. */
export function AdminUserForm({ formState, setFormState, meta, saveLoading, onSave, onResetProgress, onDeleteUser, onBack }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [confirm, setConfirm] = useState(null); // null | 'reset' | 'delete'

  const copy = (key, value) => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Read-only metadata overview */}
      {meta && (
        <div className="glass-premium" style={cardStyle}>
          <h3 style={sectionTitleStyle}>Aperçu</h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <StatTile icon={Activity} label="Jours validés" value={meta.completionsCount} color="#10b981" />
            <StatTile icon={Dumbbell} label="Reps (poids du corps)" value={(meta.totalReps || 0).toLocaleString()} color="#fbbf24" />
            <StatTile icon={Dumbbell} label="Reps (charges)" value={(meta.weightsTotalReps || 0).toLocaleString()} color="#8b5cf6" />
            <StatTile icon={Award} label="Succès" value={meta.achievements} color="#f59e0b" />
            <StatTile icon={Clock} label="Dernière connexion" value={fmtDate(meta.lastSeen)} color="#06b6d4" />
            <StatTile icon={Calendar} label="Dernière activité" value={meta.lastActiveDay || '—'} color="#ec4899" />
          </div>

          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <CopyLine label="UID" value={meta.uid} k="uid" copiedKey={copiedKey} onCopy={copy} />
            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
            <CopyLine label="Email" value={formState.email} k="email" copiedKey={copiedKey} onCopy={copy} />
            <CopyLine label="Nom" value={formState.displayName} k="name" copiedKey={copiedKey} onCopy={copy} />
            <CopyLine label="Photo" value={formState.photoURL} k="photo" copiedKey={copiedKey} onCopy={copy} />
          </div>
          {meta.lastCompletionChange && (
            <div style={{ marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.6 }}>
              Dernière modif. progression : {fmtDate(meta.lastCompletionChange, true)}
            </div>
          )}
        </div>
      )}

      {/* Section Abonnements / Droits */}
      <div className="glass-premium" style={cardStyle}>
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
          icon={Crown}
          title="A déjà été PRO (hadPro)"
          description="Historique d'abonnement. Garde certains avantages même après expiration."
          color="#f59e0b"
          isLast={false}
        >
          <ToggleSwitch
            enabled={formState.hadPro}
            onClick={() => setFormState(prev => ({ ...prev, hadPro: !prev.hadPro }))}
            activeGradient="linear-gradient(135deg, #f59e0b, #d97706)"
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
      <div className="glass-premium" style={cardStyle}>
        <h3 style={sectionTitleStyle}>Préférences App</h3>

        <div style={{ marginBottom: '12px' }}>
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

        <SettingRow
          icon={Trophy}
          title="Classement activé"
          description="L'utilisateur apparaît dans le leaderboard."
          color="#fbbf24"
          isLast={false}
        >
          <ToggleSwitch
            enabled={formState.leaderboardEnabled}
            onClick={() => setFormState(prev => ({ ...prev, leaderboardEnabled: !prev.leaderboardEnabled }))}
            activeGradient="linear-gradient(135deg, #fbbf24, #d97706)"
          />
        </SettingRow>

        <SettingRow
          icon={Bell}
          title="Notifications"
          description="Rappels quotidiens activés."
          color="#06b6d4"
          isLast={false}
        >
          <ToggleSwitch
            enabled={formState.notificationsEnabled}
            onClick={() => setFormState(prev => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }))}
            activeGradient="linear-gradient(135deg, #06b6d4, #0891b2)"
          />
        </SettingRow>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={18} color="#06b6d4" />
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>Heure de rappel</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="number" min={0} max={23}
              value={formState.notificationTime?.hour ?? 9}
              onChange={(e) => setFormState(prev => ({ ...prev, notificationTime: { ...prev.notificationTime, hour: clampInt(e.target.value, 0, 23) } }))}
              style={timeInputStyle}
            />
            <span style={{ fontWeight: '800', color: 'var(--text-secondary)' }}>:</span>
            <input
              type="number" min={0} max={59}
              value={formState.notificationTime?.minute ?? 0}
              onChange={(e) => setFormState(prev => ({ ...prev, notificationTime: { ...prev.notificationTime, minute: clampInt(e.target.value, 0, 59) } }))}
              style={timeInputStyle}
            />
          </div>
        </div>

        <SettingRow
          icon={Volume2}
          title="Sons"
          description="Effets sonores de l'application."
          color="#8b5cf6"
          isLast={false}
        >
          <ToggleSwitch
            enabled={formState.soundsEnabled}
            onClick={() => setFormState(prev => ({ ...prev, soundsEnabled: !prev.soundsEnabled }))}
            activeGradient="linear-gradient(135deg, #8b5cf6, #6d28d9)"
          />
        </SettingRow>

        {/* App theme */}
        <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Palette size={18} color="#ec4899" />
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>Thème de l'application</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {THEMES.map(theme => (
              <ThemeSwatch
                key={theme.key}
                theme={theme}
                isSelected={(formState.appTheme || 'dark') === theme.key}
                onClick={() => setFormState(prev => ({ ...prev, appTheme: theme.key }))}
                title={theme.key}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Section Progrès */}
      <div className="glass-premium" style={cardStyle}>
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
            <Loader2 size={18} className="spin" />
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

      {/* Danger zone */}
      <div style={{
        padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
        background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.25)'
      }}>
        <h3 style={{ ...sectionTitleStyle, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={14} /> Zone de danger
        </h3>

        {confirm === null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => setConfirm('reset')}
              disabled={saveLoading}
              style={dangerBtnStyle('#f59e0b')}
            >
              <RotateCcw size={16} /> Réinitialiser la progression
            </button>
            <button
              onClick={() => setConfirm('delete')}
              disabled={saveLoading}
              style={dangerBtnStyle('#ef4444', true)}
            >
              <Trash2 size={16} /> Supprimer les données du compte
            </button>
          </div>
        )}

        {confirm === 'reset' && (
          <ConfirmRow
            text="Effacer tous les jours validés et remettre les totaux du classement à zéro ?"
            confirmLabel="Réinitialiser"
            color="#f59e0b"
            loading={saveLoading}
            onConfirm={async () => { await onResetProgress(); setConfirm(null); }}
            onCancel={() => setConfirm(null)}
          />
        )}

        {confirm === 'delete' && (
          <ConfirmRow
            text="Supprimer définitivement les données et l'entrée de classement ? Le compte d'authentification Google n'est pas affecté."
            confirmLabel="Supprimer"
            color="#ef4444"
            loading={saveLoading}
            onConfirm={async () => { await onDeleteUser(); }}
            onCancel={() => setConfirm(null)}
          />
        )}
      </div>

    </div>
  );
}

function dangerBtnStyle(color, filled = false) {
  return {
    width: '100%', padding: '12px', borderRadius: 'var(--radius-lg)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
    background: filled ? `${color}1a` : 'transparent',
    border: `1px solid ${color}55`, color,
  };
}

/** Inline confirmation row used by the danger-zone actions. */
function ConfirmRow({ text, confirmLabel, color, loading, onConfirm, onCancel }) {
  return (
    <div className="scale-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{text}</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onCancel}
          disabled={loading}
          style={{
            flex: 1, padding: '12px', borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-muted)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)', fontWeight: '700', cursor: 'pointer'
          }}
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{
            flex: 1, padding: '12px', borderRadius: 'var(--radius-lg)',
            background: color, border: 'none', color: '#fff', fontWeight: '800',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading && <Loader2 size={16} className="spin" />}
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
