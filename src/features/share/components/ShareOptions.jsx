import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Zap, Dumbbell, Flame, History, Award, Target, Weight, Filter, Palette, Image, X } from 'lucide-react';

// eslint-disable-next-line no-unused-vars
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

const CATEGORIES = [
  { key: 'bodyweight', color: '#34d399' },
  { key: 'weights', color: '#f97316' },
  { key: 'custom', color: '#8b5cf6' },
];

export function ShareOptions({ options, toggleOption, setOption, toggleCategory, setBackgroundImage, clearBackgroundImage, mode = 'session', isPro = false, sessionData }) {
  const { t } = useTranslation();
  const isGlobal = mode === 'global';
  const selectedCategories = options.statsCategories || ['bodyweight', 'weights', 'custom'];
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setBackgroundImage(event.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const hasWeightExercises = !isGlobal && sessionData?.exercises?.some(ex => {
    const weightIds = ['biceps_curl','hammer_curl','bench_press','overhead_press','squat_weights','deadlift','barbell_row'];
    return weightIds.includes(ex.id);
  });

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

      {/* Weights toggle (pro only, session mode, only if weight exercises exist) */}
      {!isGlobal && isPro && hasWeightExercises && (
        <OptionRow
          icon={Weight}
          label={t('share.showWeights', 'S\u00e9parer musculation')}
          color="#f97316"
          checked={options.showWeights}
          onToggle={() => toggleOption('showWeights')}
        />
      )}

      {/* Category filter for global stats (pro only, multi-select) */}
      {isGlobal && isPro && (
        <>
          <div style={{ height: '4px' }} />
          <div style={{
            fontSize: '0.65rem', fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '1px',
            padding: '0 4px',
          }}>
            <Filter size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            {t('share.categoryFilter', 'Cat\u00e9gorie')}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => {
              const isSelected = selectedCategories.includes(cat.key);
              return (
                <button
                  key={cat.key}
                  onClick={() => toggleCategory(cat.key)}
                  style={{
                    padding: '6px 12px', borderRadius: '8px',
                    border: isSelected ? `1px solid ${cat.color}40` : '1px solid rgba(255,255,255,0.06)',
                    background: isSelected
                      ? `${cat.color}18`
                      : 'rgba(255,255,255,0.03)',
                    color: isSelected ? cat.color : 'var(--text-secondary)',
                    fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t(`share.cat.${cat.key}`, cat.key === 'bodyweight' ? 'Poids du corps' : cat.key === 'weights' ? 'Musculation' : 'Perso')}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Theme selector (pro only) */}
      {isPro && (
        <>
          <div style={{ height: '4px' }} />
          <div style={{
            fontSize: '0.65rem', fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '1px',
            padding: '0 4px',
          }}>
            <Palette size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            {t('share.theme', 'Th\u00e8me')}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { key: 'dark', color: '#0f0f1a', accent: '#818cf8' },
              { key: 'ocean', color: '#0a1628', accent: '#06b6d4' },
              { key: 'sunset', color: '#1a0a0a', accent: '#f97316' },
              { key: 'forest', color: '#0a1a0f', accent: '#22c55e' },
              { key: 'purple', color: '#120a1a', accent: '#a855f7' },
            ].map(theme => {
              const isSelected = options.theme === theme.key;
              return (
                <button
                  key={theme.key}
                  onClick={() => setOption('theme', theme.key)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    border: isSelected ? `2px solid ${theme.accent}` : '2px solid rgba(255,255,255,0.1)',
                    background: theme.color,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  title={t(`share.theme.${theme.key}`, theme.key)}
                >
                  <div style={{
                    width: '14px', height: '14px', borderRadius: '50%',
                    background: theme.accent,
                  }} />
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Background image (pro only) */}
      {isPro && (
        <>
          <div style={{ height: '4px' }} />
          <div style={{
            fontSize: '0.65rem', fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '1px',
            padding: '0 4px',
          }}>
            <Image size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            {t('share.backgroundImage', 'Image de fond')}
          </div>
          
          {options.backgroundImage ? (
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
              <img 
                src={options.backgroundImage} 
                alt="Background" 
                style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '12px' }}
              />
              <button
                onClick={clearBackgroundImage}
                style={{
                  position: 'absolute', top: '4px', right: '4px',
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)', border: 'none',
                  color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '100%', padding: '16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px dashed rgba(255,255,255,0.15)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem', fontWeight: 600,
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <Image size={20} style={{ opacity: 0.5 }} />
              {t('share.uploadImage', 'Ajouter une image')}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </>
      )}
    </div>
  );
}
