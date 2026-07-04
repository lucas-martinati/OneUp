import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Zap, Dumbbell, Flame, History, Award, Target, Weight, Filter, Palette, Image, X, Lock, Check } from '@utils/icons';
import { haptics } from '@utils/hapticsManager';
import styles from './ShareOptions.module.css';

// Multi-select tile: icon pastille + label + checkbox badge. The accent
// color flows into the module via --c; --i staggers the entrance.
function MetricTile({ icon: Icon, label, color, checked, onToggle, index }) {
  return (
    <button
      aria-pressed={checked}
      onClick={() => {
        haptics.light();
        onToggle();
      }}
      className={checked ? `${styles.metric} ${styles.metricOn}` : styles.metric}
      style={{ '--c': color, '--i': index }}
    >
      <span className={styles.metricIcon}><Icon size={14} /></span>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricCheck}>
        {checked && <Check size={11} strokeWidth={3} />}
      </span>
    </button>
  );
}

// Bouton d'upload (caméra / galerie) : même habillage, seuls l'action, l'icône et le label changent.
function UploadButton({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
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
        {children}
      </div>
      {label}
    </button>
  );
}

// En-tête de section (label majuscule, icône optionnelle).
function SectionLabel({ icon: Icon, children }) {
  return (
    <div className={styles.sectionLabel}>
      {Icon && <Icon size={11} />}
      {children}
    </div>
  );
}

import { buildFullCategoryOrder, buildFullCategoryColors, isUserCategory } from '@config/categories';
import { useExercises } from '@contexts/ExercisesContext';
import { THEMES as GLOBAL_THEMES } from '@config/themes';
import { WEIGHT_EXERCISES } from '@config/weights';
import { ThemeSwatch } from'@components/ui/ThemeSwatch';

export function ShareOptions({ options, toggleOption, setOption, toggleCategory, clearBackgroundImage, originalImage, openCropModal, mode = 'session', isPro = false, sessionData, onOpenStore }) {
  const { t } = useTranslation();
  const isGlobal = mode === 'global';
  const { customCategories } = useExercises();
  const fullCategoryOrder = buildFullCategoryOrder(customCategories);
  const fullCategoryColors = buildFullCategoryColors(customCategories);
  const selectedCategories = options.statsCategories || fullCategoryOrder;
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

  const hasWeightExercises = !isGlobal && sessionData?.exercises?.some(
    ex => WEIGHT_EXERCISES.some(w => w.id === ex.id)
  );

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '8px',
      width: '100%',
    }}>
      {/* Theme selector — first: it changes the whole look of the card */}
      <SectionLabel icon={Palette}>
        {t('share.theme')} {!isPro && <Lock size={11} color="var(--accent)" style={{ opacity: 0.8 }} />}
      </SectionLabel>
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
        <div style={{
          display: 'flex', gap: '6px', flexWrap: 'wrap',
          opacity: isPro ? 1 : 0.6,
          pointerEvents: isPro ? 'auto' : 'none'
        }}>
          {GLOBAL_THEMES.map(theme => (
            <ThemeSwatch
              key={theme.key}
              theme={theme}
              isSelected={options.theme === theme.key}
              onClick={() => setOption('theme', theme.key)}
              title={t(`share.theme.${theme.key}`, theme.key)}
            />
          ))}
        </div>
        {!isPro && (
          <div
            onClick={onOpenStore}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.1)', backdropFilter: 'blur(1.5px)',
              cursor: 'pointer', zIndex: 2
            }}
          >
            <div style={{
              background: 'var(--surface-elevated)', color: 'var(--text-primary)',
              padding: '6px 12px', borderRadius: '20px',
              fontSize: '0.75rem', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', gap: '6px',
              border: '1px solid var(--border-default)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}>
              <Lock size={12} color="var(--accent)" /> PRO
            </div>
          </div>
        )}
      </div>

      <SectionLabel>{t('share.metrics')}</SectionLabel>

      <div className={styles.metricGrid}>
        {[
          {
            key: 'showDuration',
            icon: isGlobal ? Award : Clock,
            label: isGlobal ? t('common.bestStreak') : t('share.duration'),
            color: '#818cf8',
          },
          {
            key: 'showVolume',
            icon: Zap,
            label: isGlobal ? t('stats.totalReps') : t('customExercises.typeReps'),
            color: '#fbbf24',
          },
          {
            key: 'showExercises',
            icon: isGlobal ? Target : Dumbbell,
            label: isGlobal ? t('leaderboard.activeDays') : t('share.exercisesCompleted'),
            color: '#34d399',
          },
          {
            key: 'showStreak',
            icon: Flame,
            label: t('achievements.categories.streak'),
            color: '#ef4444',
          },
          ...(isGlobal ? [{
            key: 'showDailyExercises',
            icon: Dumbbell,
            label: t('share.showDailyExercises'),
            color: '#ec4899',
          }] : []),
          {
            key: 'showSessionHistory',
            icon: History,
            label: t('share.showHistory'),
            color: '#8b5cf6',
          },
          // Weights (pro only, session mode, only if weight exercises exist)
          ...(!isGlobal && isPro && hasWeightExercises ? [{
            key: 'showWeights',
            icon: Weight,
            label: t('share.showWeights'),
            color: '#f97316',
          }] : []),
        ].map((metric, index) => (
          <MetricTile
            key={metric.key}
            icon={metric.icon}
            label={metric.label}
            color={metric.color}
            index={index}
            checked={!!options[metric.key]}
            onToggle={() => toggleOption(metric.key)}
          />
        ))}
      </div>

      {isGlobal && options.showDailyExercises && (
        <input
          type="date"
          className={styles.dateField}
          value={options.globalDate || new Date().toISOString().split('T')[0]}
          onChange={(e) => setOption('globalDate', e.target.value)}
        />
      )}

      {/* Category filter for global stats (multi-select) */}
      {isGlobal && (
        <>
          <SectionLabel icon={Filter}>{t('share.categoryFilter')}</SectionLabel>
          <div className={styles.chips}>
            {fullCategoryOrder.map((catKey, index) => {
              const isSelected = selectedCategories.includes(catKey);
              const catColor = fullCategoryColors[catKey];
              const catDef = customCategories.find(c => c.id === catKey);
              const label = catDef?.name || (isUserCategory(catKey) ? catKey : t(`common.${catKey}`));
              return (
                <button
                  key={catKey}
                  aria-pressed={isSelected}
                  onClick={() => {
                    haptics.light();
                    toggleCategory(catKey);
                  }}
                  className={isSelected ? `${styles.chip} ${styles.chipOn}` : styles.chip}
                  style={{ '--c': catColor, '--i': index }}
                >
                  <span className={styles.chipDot}>
                    {isSelected && <Check size={9} strokeWidth={3.5} />}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Background image (pro only) */}
      {isPro && (
        <>
          <SectionLabel icon={Image}>{t('share.backgroundImage')}</SectionLabel>
          
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
                  {t('share.imageSelected')}
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
                    {t('share.recropImage')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <UploadButton onClick={() => cameraInputRef.current?.click()} label={t('share.takePhoto')}>
                <span style={{ fontSize: '14px' }}>📸</span>
              </UploadButton>
              <UploadButton onClick={() => fileInputRef.current?.click()} label={t('share.uploadGallery')}>
                <Image size={14} style={{ opacity: 0.8 }} />
              </UploadButton>
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
