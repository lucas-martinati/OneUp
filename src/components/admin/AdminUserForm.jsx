import React, { useState } from 'react';
import { Sparkles, Heart, Save, Calendar, Crown, Copy, Check, Activity, Award, Clock, Dumbbell, RotateCcw, Trash2, AlertTriangle, Trophy, Bell, Volume2, Palette } from '@utils/icons';
import { ToggleSwitch, SettingRow, ThemeSwatch, Input, Button, Card } from '@components/ui';
import { THEMES } from '@config/themes';

const sectionTitleStyle = {
  marginBottom: 'var(--space-4)', fontSize: '0.85rem', fontWeight: '700',
  textTransform: 'uppercase', letterSpacing: '1px',
  color: 'var(--text-secondary)'
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
      background: 'var(--surface-muted)', border: '1px solid var(--border-default)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color, marginBottom: '4px' }}>
        <Icon size={14} />
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
    <div className="flex-align-center gap-8" style={{ alignItems: 'center' }}>
      <code style={{
        flex: 1, minWidth: 0, fontSize: '0.7rem', color: 'var(--text-secondary)',
        fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
      }}>
        {label}: {value || '—'}
      </code>
      <Button
        variant="ghost"
        size="sm"
        disabled={!value}
        icon={isCopied ? Check : Copy}
        onClick={() => onCopy(k, value)}
      >
        {isCopied ? 'Copié' : 'Copier'}
      </Button>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

      {/* Read-only metadata overview */}
      {meta && (
        <Card variant="glass" padding="md">
          <h3 style={sectionTitleStyle}>Aperçu</h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <StatTile icon={Activity} label="Jours validés" value={meta.completionsCount} color="var(--success)" />
            <StatTile icon={Dumbbell} label="Reps (poids du corps)" value={(meta.totalReps || 0).toLocaleString()} color="var(--color-amber)" />
            <StatTile icon={Dumbbell} label="Reps (charges)" value={(meta.weightsTotalReps || 0).toLocaleString()} color="var(--accent-glow)" />
            <StatTile icon={Award} label="Succès" value={meta.achievements} color="var(--warning)" />
            <StatTile icon={Clock} label="Dernière connexion" value={fmtDate(meta.lastSeen)} color="var(--color-cyan)" />
            <StatTile icon={Calendar} label="Dernière activité" value={meta.lastActiveDay || '—'} color="var(--color-pink)" />
          </div>

          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <CopyLine label="UID" value={meta.uid} k="uid" copiedKey={copiedKey} onCopy={copy} />
            <div style={{ height: '1px', background: 'var(--border-default)', margin: '4px 0' }} />
            <CopyLine label="Email" value={formState.email} k="email" copiedKey={copiedKey} onCopy={copy} />
            <CopyLine label="Nom" value={formState.displayName} k="name" copiedKey={copiedKey} onCopy={copy} />
            <CopyLine label="Photo" value={formState.photoURL} k="photo" copiedKey={copiedKey} onCopy={copy} />
          </div>
          {meta.lastCompletionChange && (
            <div style={{ marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              Dernière modif. progression : {fmtDate(meta.lastCompletionChange, true)}
            </div>
          )}
        </Card>
      )}

      {/* Section Abonnements / Droits */}
      <Card variant="glass" padding="md">
        <h3 style={sectionTitleStyle}>Abonnements & Droits</h3>

        <SettingRow
          icon={Sparkles}
          title="Utilisateur PRO"
          description="Déverrouille les catégories personnalisées, les thèmes Pro, etc."
          color="var(--accent-glow)"
          isLast={false}
        >
          <ToggleSwitch
            enabled={formState.isPro}
            onClick={() => setFormState(prev => ({ ...prev, isPro: !prev.isPro }))}
            activeGradient="linear-gradient(135deg, var(--accent-glow), var(--accent))"
          />
        </SettingRow>

        <SettingRow
          icon={Crown}
          title="A déjà été PRO (hadPro)"
          description="Historique d'abonnement. Garde certains avantages même après expiration."
          color="var(--warning)"
          isLast={false}
        >
          <ToggleSwitch
            enabled={formState.hadPro}
            onClick={() => setFormState(prev => ({ ...prev, hadPro: !prev.hadPro }))}
            activeGradient="linear-gradient(135deg, var(--warning), #d97706)"
          />
        </SettingRow>

        <SettingRow
          icon={Heart}
          title="Utilisateur SUPPORT"
          description="Indique que l'utilisateur soutient l'application."
          color="var(--error)"
          isLast={true}
        >
          <ToggleSwitch
            enabled={formState.isSupporter}
            onClick={() => setFormState(prev => ({ ...prev, isSupporter: !prev.isSupporter }))}
            activeGradient="linear-gradient(135deg, var(--error), #dc2626)"
          />
        </SettingRow>
      </Card>

      {/* Section Configuration settings */}
      <Card variant="glass" padding="md">
        <h3 style={sectionTitleStyle}>Préférences App</h3>

        <div style={{ marginBottom: '12px' }}>
          <Input
            label="Pseudo pour le Classement (Leaderboard)"
            type="text"
            value={formState.leaderboardPseudo}
            onChange={(e) => setFormState(prev => ({ ...prev, leaderboardPseudo: e.target.value.slice(0, 20) }))}
            placeholder="Pseudo du classement"
            maxLength={20}
          />
        </div>

        <SettingRow
          icon={Trophy}
          title="Classement activé"
          description="L'utilisateur apparaît dans le leaderboard."
          color="var(--color-amber)"
          isLast={false}
        >
          <ToggleSwitch
            enabled={formState.leaderboardEnabled}
            onClick={() => setFormState(prev => ({ ...prev, leaderboardEnabled: !prev.leaderboardEnabled }))}
            activeGradient="linear-gradient(135deg, var(--color-amber), #d97706)"
          />
        </SettingRow>

        <SettingRow
          icon={Bell}
          title="Notifications"
          description="Rappels quotidiens activés."
          color="var(--color-cyan)"
          isLast={false}
        >
          <ToggleSwitch
            enabled={formState.notificationsEnabled}
            onClick={() => setFormState(prev => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }))}
            activeGradient="linear-gradient(135deg, var(--color-cyan), #0891b2)"
          />
        </SettingRow>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={18} color="var(--color-cyan)" />
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>Heure de rappel</span>
          </div>
          <div className="flex-align-center gap-4">
            <input
              type="number" min={0} max={23}
              value={formState.notificationTime?.hour ?? 9}
              onChange={(e) => setFormState(prev => ({ ...prev, notificationTime: { ...prev.notificationTime, hour: clampInt(e.target.value, 0, 23) } }))}
              style={{ width: '52px', padding: '8px', textAlign: 'center', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--surface-muted)', color: 'var(--text-primary)', fontWeight: '700' }}
            />
            <span style={{ fontWeight: '800', color: 'var(--text-secondary)' }}>:</span>
            <input
              type="number" min={0} max={59}
              value={formState.notificationTime?.minute ?? 0}
              onChange={(e) => setFormState(prev => ({ ...prev, notificationTime: { ...prev.notificationTime, minute: clampInt(e.target.value, 0, 59) } }))}
              style={{ width: '52px', padding: '8px', textAlign: 'center', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--surface-muted)', color: 'var(--text-primary)', fontWeight: '700' }}
            />
          </div>
        </div>

        <SettingRow
          icon={Volume2}
          title="Sons"
          description="Effets sonores de l'application."
          color="var(--accent-glow)"
          isLast={false}
        >
          <ToggleSwitch
            enabled={formState.soundsEnabled}
            onClick={() => setFormState(prev => ({ ...prev, soundsEnabled: !prev.soundsEnabled }))}
            activeGradient="linear-gradient(135deg, var(--accent-glow), var(--accent))"
          />
        </SettingRow>

        {/* App theme */}
        <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-default)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Palette size={18} color="var(--color-pink)" />
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
      </Card>

      {/* Section Progrès */}
      <Card variant="glass" padding="md">
        <h3 style={sectionTitleStyle}>Progression</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <Input
            label="Date de commencement du défi (Format YYYY-MM-DD)"
            type="text"
            value={formState.startDate}
            onChange={(e) => setFormState(prev => ({ ...prev, startDate: e.target.value }))}
            placeholder="Ex: 2026-01-01"
          />
        </div>

        <SettingRow
          icon={Calendar}
          title="Configuration Complétée"
          description="Indique si le profil a passé l'onboarding initial."
          color="var(--success)"
          isLast={true}
        >
          <ToggleSwitch
            enabled={formState.isSetup}
            onClick={() => setFormState(prev => ({ ...prev, isSetup: !prev.isSetup }))}
            activeGradient="linear-gradient(135deg, var(--success), #059669)"
          />
        </SettingRow>
      </Card>

      {/* Form Save Button */}
      <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
        <Button
          variant="danger"
          size="lg"
          fullWidth
          loading={saveLoading}
          icon={Save}
          onClick={onSave}
        >
          Enregistrer Profil & Droits
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={onBack}
        >
          Retour
        </Button>
      </div>

      {/* Danger zone */}
      <div style={{
        padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)',
        background: 'color-mix(in srgb, var(--error) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--error) 25%, transparent)'
      }}>
        <h3 style={{ ...sectionTitleStyle, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={14} /> Zone de danger
        </h3>

        {confirm === null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Button
              variant="danger-ghost"
              size="md"
              fullWidth
              icon={RotateCcw}
              onClick={() => setConfirm('reset')}
              disabled={saveLoading}
            >
              Réinitialiser la progression
            </Button>
            <Button
              variant="danger"
              size="md"
              fullWidth
              icon={Trash2}
              onClick={() => setConfirm('delete')}
              disabled={saveLoading}
            >
              Supprimer les données du compte
            </Button>
          </div>
        )}

        {confirm === 'reset' && (
          <ConfirmRow
            text="Effacer tous les jours validés et remettre les totaux du classement à zéro ?"
            confirmLabel="Réinitialiser"
            color="var(--warning)"
            loading={saveLoading}
            onConfirm={async () => { await onResetProgress(); setConfirm(null); }}
            onCancel={() => setConfirm(null)}
          />
        )}

        {confirm === 'delete' && (
          <ConfirmRow
            text="Supprimer définitivement les données et l'entrée de classement ? Le compte d'authentification Google n'est pas affecté."
            confirmLabel="Supprimer"
            color="var(--error)"
            loading={saveLoading}
            onConfirm={async () => { await onDeleteUser(); }}
            onCancel={() => setConfirm(null)}
          />
        )}
      </div>

    </div>
  );
}

/** Inline confirmation row used by the danger-zone actions. */
function ConfirmRow({ text, confirmLabel, loading, onConfirm, onCancel }) {
  return (
    <div className="scale-in flex-col gap-12">
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{text}</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Button variant="secondary" size="md" fullWidth disabled={loading} onClick={onCancel}>
          Annuler
        </Button>
        <Button variant="danger" size="md" fullWidth loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}

