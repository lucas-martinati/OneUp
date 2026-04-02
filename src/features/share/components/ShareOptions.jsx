import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Zap, Dumbbell, Flame, History, Image, Award, Target, Weight } from 'lucide-react';

function OptionRow({ icon: Icon, label, color, checked, onToggle, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px', borderRadius: '12px',
        background: checked ? `${color}12` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${checked ? color + '30' : 'rgba(255,255,255,0.06)'}`,
        cursor: disabled ? 'default' : 'pointer', width: '100%', textAlign: 'left',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Icon size={16} color={checked ? color : 'rgba(255,255,255,0.3)'} />
      <span style={{
        flex: 1, fontSize: '0.8rem', fontWeight: 600,
        color: checked ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}>
        {label}
      </span>
      <div style={{
        width: '36px', height: '20px', borderRadius: '10px',
        background: checked ? color : 'rgba(255,255,255,0.12)',
        position: 'relative', transition: 'all 0.2s ease', flexShrink: 0,
      }}>
        <div style={{
          width: '16px', height: '16px', borderRadius: '50%',
          background: 'white', position: 'absolute', top: '2px',
          left: checked ? '18px' : '2px', transition: 'all 0.2s ease',
        }} />
      </div>
    </button>
  );
}

export function ShareOptions({ options, toggleOption, setOption, mode = 'session', isPro = false }) {
  const { t } = useTranslation();
  const isGlobal = mode === 'global';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '8px',
      width: '100%',
    }}>
      <div style={{
        fontSize: '0.65rem', fontWeight: 700,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: '1px',
        padding: '0 4px',
      }}>
        {t('share.metrics', 'M\u00e9triques affich\u00e9es')}
      </div>

      <OptionRow
        icon={isGlobal ? Award : Clock}
        label={isGlobal ? t('share.bestStreak', 'Meilleure s\u00e9rie') : t('share.duration', 'Dur\u00e9e')}
        color="#818cf8"
        checked={options.showDuration}
        onToggle={() => toggleOption('showDuration')}
      />
      <OptionRow
        icon={Zap}
        label={isGlobal ? t('share.totalReps', 'Reps totales') : t('share.reps', 'Reps')}
        color="#fbbf24"
        checked={options.showVolume}
        onToggle={() => toggleOption('showVolume')}
      />
      <OptionRow
        icon={isGlobal ? Target : Dumbbell}
        label={isGlobal ? t('share.activeDays', 'Jours actifs') : t('share.exercisesCompleted', 'Exercices compl\u00e9t\u00e9s')}
        color="#34d399"
        checked={options.showExercises}
        onToggle={() => toggleOption('showExercises')}
      />
      <OptionRow
        icon={Flame}
        label={t('share.streakDisplay', 'S\u00e9rie (streak)')}
        color="#ef4444"
        checked={options.showStreak}
        onToggle={() => toggleOption('showStreak')}
      />
      <OptionRow
        icon={History}
        label={t('share.showHistory', 'Historique des s\u00e9ances')}
        color="#8b5cf6"
        checked={options.showSessionHistory}
        onToggle={() => toggleOption('showSessionHistory')}
      />

      {/* Weights toggle (pro only, session mode only) */}
      {!isGlobal && isPro && (
        <OptionRow
          icon={Weight}
          label={t('share.showWeights', 'S\u00e9parer musculation')}
          color="#f97316"
          checked={options.showWeights}
          onToggle={() => toggleOption('showWeights')}
        />
      )}

      <div style={{ height: '4px' }} />

      {/* Format selector */}
      <div style={{
        display: 'flex', gap: '6px', padding: '0 4px',
      }}>
        <div style={{
          fontSize: '0.65rem', fontWeight: 600,
          color: 'var(--text-secondary)', lineHeight: '28px',
        }}>
          <Image size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          Format:
        </div>
        {['png', 'jpeg'].map(fmt => (
          <button
            key={fmt}
            onClick={() => setOption('format', fmt)}
            style={{
              padding: '4px 12px', borderRadius: '8px', border: 'none',
              background: options.format === fmt
                ? 'rgba(129,140,248,0.2)'
                : 'rgba(255,255,255,0.06)',
              color: options.format === fmt ? '#818cf8' : 'var(--text-secondary)',
              fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {fmt}
          </button>
        ))}
      </div>
    </div>
  );
}
