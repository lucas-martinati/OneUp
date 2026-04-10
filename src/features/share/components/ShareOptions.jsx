import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Zap, Dumbbell, Flame, History, Award, Target, Weight, Filter, Palette, Image, X } from '../../../utils/icons';

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

import { CATEGORIES } from '../../../config/categories';

const CATEGORIES_CONFIG = [
  { key: CATEGORIES.BODYWEIGHT, color: '#34d399' },
  { key: CATEGORIES.WEIGHTS, color: '#f97316' },
  { key: CATEGORIES.CUSTOM, color: '#8b5cf6' },
];

export function ShareOptions({ options, toggleOption, setOption, toggleCategory, clearBackgroundImage, originalImage, openCropModal, mode = 'session', isPro = false, sessionData }) {
  const { t } = useTranslation();
  const isGlobal = mode === 'global';
  const selectedCategories = options.statsCategories || [CATEGORIES.BODYWEIGHT, CATEGORIES.WEIGHTS, CATEGORIES.CUSTOM];
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Resize to reduce memory usage during export and avoid crashes
        const MAX_DIMENSION = 1080;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
           const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
           width = width * ratio;
           height = height * ratio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert back to base64 with moderate quality to optimize storage
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        openCropModal(dataUrl);
      };
      img.src = event.target.result;
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
        label={isGlobal ? t('common.bestStreak', 'Best streak') : t('share.duration', 'Dur\u00e9e')}
        color="#818cf8"
        checked={options.showDuration}
        onToggle={() => toggleOption('showDuration')}
      />
      <OptionRow
        icon={Zap}
        label={isGlobal ? t('stats.totalReps', 'Total reps') : t('customExercises.typeReps', 'Reps')}
        color="#fbbf24"
        checked={options.showVolume}
        onToggle={() => toggleOption('showVolume')}
      />
      <OptionRow
        icon={isGlobal ? Target : Dumbbell}
        label={isGlobal ? t('leaderboard.activeDays', 'Active days') : t('share.exercisesCompleted', 'Exercices compl\u00e9t\u00e9s')}
        color="#34d399"
        checked={options.showExercises}
        onToggle={() => toggleOption('showExercises')}
      />
      <OptionRow
        icon={Flame}
        label={t('achievements.categories.streak', 'Streak')}
        color="#ef4444"
        checked={options.showStreak}
        onToggle={() => toggleOption('showStreak')}
      />

      {isGlobal && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <OptionRow
            icon={Dumbbell}
            label={t('share.showDailyExercises', 'Routine par jour')}
            color="#ec4899"
            checked={options.showDailyExercises}
            onToggle={() => toggleOption('showDailyExercises')}
          />
          {options.showDailyExercises && (
            <input
              type="date"
              value={options.globalDate || new Date().toISOString().split('T')[0]}
              onChange={(e) => setOption('globalDate', e.target.value)}
              style={{
                marginLeft: '36px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.8rem',
                colorScheme: 'dark'
              }}
            />
          )}
        </div>
      )}
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
            {CATEGORIES_CONFIG.map(cat => {
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
                  {t(`common.${cat.key}`)}
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
            <div style={{
              display: 'flex', alignItems: 'stretch', gap: '8px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '8px',
              transition: 'all 0.2s ease',
            }}>
              {/* Thumbnail with remove overlay */}
              <div style={{
                position: 'relative',
                width: '72px', minHeight: '72px',
                borderRadius: '10px', overflow: 'hidden',
                flexShrink: 0,
              }}>
                <img
                  src={options.backgroundImage}
                  alt="Background"
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', display: 'block',
                  }}
                />
                <button
                  onClick={() => {
                    clearBackgroundImage();
                    setOption('bgSize', undefined);
                    setOption('bgPosX', undefined);
                    setOption('bgPosY', undefined);
                  }}
                  style={{
                    position: 'absolute', top: '4px', right: '4px',
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <X size={12} />
                </button>
              </div>

              {/* Actions column */}
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                justifyContent: 'center', gap: '6px',
                padding: '2px 4px',
              }}>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 600,
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.3,
                }}>
                  {t('share.imageSelected', 'Image sélectionnée')}
                </span>

                {originalImage && (
                  <button
                    onClick={() => openCropModal()}
                    style={{
                      padding: '8px 14px', borderRadius: '10px',
                      background: 'rgba(129,140,248,0.1)',
                      border: '1px solid rgba(129,140,248,0.2)',
                      color: '#818cf8',
                      fontSize: '0.7rem', fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '6px',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                  >
                    <Image size={13} />
                    {t('share.recropImage', 'Recadrer')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => cameraInputRef.current?.click()}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px dashed rgba(255,255,255,0.15)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.7rem', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '14px' }}>📸</span>
                </div>
                {t('share.takePhoto', 'Prendre une photo')}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px dashed rgba(255,255,255,0.15)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.7rem', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}>
                  <Image size={14} style={{ opacity: 0.8 }} />
                </div>
                {t('share.uploadGallery', 'Galerie')}
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
        </>
      )}
    </div>
  );
}
