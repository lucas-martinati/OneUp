import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Unlock } from '@utils/icons';
import { useExerciseConfig } from '@hooks/useExerciseConfig';
import { useSubscription } from '@contexts/SubscriptionContext';
import { EXERCISES, CARDIO_EXERCISES } from '@config/exercises';
import { WEIGHT_EXERCISES } from '@config/weights';
import { getExerciseLabel } from '@utils/exerciseLabel';
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ORDER } from '@config/categories';
import { sectionTitleStyle } from './settingsStyles';

function CategorySeparator({ label, color }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '0 8px'
        }}>
            <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${color}25)` }} />
            <span style={{
                fontSize: '0.7rem', fontWeight: '800',
                color: `${color}`, textTransform: 'uppercase',
                letterSpacing: '1.5px', whiteSpace: 'nowrap'
            }}>{label}</span>
            <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${color}25, transparent)` }} />
        </div>
    );
}

/** Sensitive difficulty multiplier sliders, behind an explicit unlock step. */
export function DifficultySettings() {
    const { t } = useTranslation();
    const { getConfig, updateConfig } = useExerciseConfig();
    const { isPro } = useSubscription();
    const [isMultiplierUnlocked, setIsMultiplierUnlocked] = useState(false);

    return (
        <div className="glass-premium" style={{
            padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)',
            marginBottom: 'var(--spacing-md)',
            background: 'var(--surface-section)',
            border: isMultiplierUnlocked ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0
        }}>
            <h3 style={{ ...sectionTitleStyle, color: isMultiplierUnlocked ? '#ef4444' : 'var(--text-secondary)' }}>{t('common.difficulty')}</h3>

            <div style={{ marginBottom: '16px' }}>
                <div style={{
                    background: isMultiplierUnlocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.05)',
                    border: `1px solid ${isMultiplierUnlocked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.1)'}`,
                    padding: '14px', borderRadius: 'var(--radius-md)', color: '#fca5a5',
                    fontSize: '0.85rem', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px',
                    transition: 'all 0.3s ease'
                }}>
                    <p style={{ margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}>
                        <Lock size={14} /> {t('settings.sensitiveParam')}
                    </p>
                    <p style={{ margin: 0, opacity: 0.9 }}>{t('settings.sensitiveWarning')}</p>
                </div>
            </div>

            {!isMultiplierUnlocked ? (
                <button
                    onClick={() => setIsMultiplierUnlocked(true)}
                    className="hover-lift"
                    style={{
                        width: '100%', padding: '16px', borderRadius: 'var(--radius-lg)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '2px solid rgba(239, 68, 68, 0.4)',
                        color: '#ef4444', fontWeight: '800', fontSize: '0.9rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '12px', cursor: 'pointer', letterSpacing: '1px',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
                    }}
                >
                    {t('settings.unlockSettings')} <Lock size={18} />
                </button>
            ) : (
                <div className="scale-in">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div className="row gap-8">
                            <span style={{ fontWeight: '700', color: 'white', fontSize: '0.9rem' }}>{t('settings.multiplier')}</span>
                            <button
                                onClick={() => setIsMultiplierUnlocked(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px',
                                    padding: '4px 10px', color: 'white', fontSize: '0.7rem', fontWeight: '700',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                                }}
                            >
                                {t('settings.lock')} <Unlock size={12} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {CATEGORY_ORDER.map(catKey => {
                            let title, exList;
                            if (catKey === CATEGORIES.CARDIO) { title = t('common.cardio'); exList = CARDIO_EXERCISES; }
                            else if (catKey === CATEGORIES.BODYWEIGHT) { title = t('common.bodyweight'); exList = EXERCISES; }
                            else if (catKey === CATEGORIES.WEIGHTS) {
                                if (!isPro) return null;
                                title = t('common.weights'); exList = WEIGHT_EXERCISES;
                            }
                            else return null;

                            if (!exList || exList.length === 0) return null;

                            return (
                                <div key={catKey} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <CategorySeparator label={title} color={CATEGORY_COLORS[catKey]} />
                                    {exList.map(ex => {
                                        const val = getConfig(ex.id).difficulty;
                                        const exColor = ex.color || CATEGORY_COLORS[catKey];
                                        const percentage = ((val - 0.1) / 0.9) * 100;
                                        return (
                                            <div key={ex.id} className="flex-col gap-8">
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                                                        {getExerciseLabel(ex, t)}
                                                    </span>
                                                    <span style={{ fontSize: '0.8rem', color: exColor, fontWeight: '700', background: `${exColor}25`, padding: '2px 8px', borderRadius: '10px' }}>
                                                        x{val.toFixed(1)}
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    className="premium-slider"
                                                    min="0.1" max="1.0" step="0.1"
                                                    value={val}
                                                    onChange={(e) => {
                                                        const newVal = Math.min(1.0, Math.max(0.1, parseFloat(e.target.value)));
                                                        updateConfig(ex.id, { difficulty: newVal });
                                                    }}
                                                    style={{
                                                        '--slider-color': exColor,
                                                        background: `linear-gradient(to right, ${exColor} ${percentage}%, var(--surface-muted) ${percentage}%)`
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
