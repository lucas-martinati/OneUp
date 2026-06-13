import { Check } from '../../../utils/icons';

export function WeightSelector({ activeColor, currentWeight, handleValidateWeight, localWeightStr, setLocalWeightStr, t }) {
    const parsedWeight = parseFloat(localWeightStr.replace(',', '.'));
    const isUnchanged = parsedWeight === currentWeight;

    return (
        <div className="scale-in" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            marginBottom: 'var(--spacing-xs)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 8px 8px 18px',
                borderRadius: 'var(--radius-full)',
                background: `linear-gradient(135deg, ${activeColor}16, ${activeColor}08)`,
                border: `1px solid ${activeColor}33`
            }}>
                <span style={{
                    fontSize: '0.62rem', fontWeight: '700', letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: 'var(--text-secondary)', opacity: 0.8
                }}>
                    {t('weight.kg')}
                </span>
                <input
                    type="number"
                    inputMode="decimal"
                    value={localWeightStr}
                    onChange={(e) => setLocalWeightStr(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleValidateWeight()}
                    onBlur={handleValidateWeight}
                    style={{
                        width: Math.max(38, localWeightStr.length * 15 + 8) + 'px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: '1.5rem',
                        fontWeight: '800',
                        color: activeColor,
                        textAlign: 'center'
                    }}
                />
                <button
                    onClick={handleValidateWeight}
                    className="hover-lift"
                    disabled={isUnchanged}
                    aria-label={t('weight.kg')}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: isUnchanged ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${activeColor}, ${activeColor}cc)`,
                        border: isUnchanged ? '1px solid rgba(255,255,255,0.08)' : 'none',
                        cursor: isUnchanged ? 'default' : 'pointer',
                        color: isUnchanged ? 'var(--text-secondary)' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: isUnchanged ? 'none' : `0 4px 14px ${activeColor}55`,
                        transition: 'all 0.2s',
                        opacity: isUnchanged ? 0.5 : 1
                    }}
                >
                    <Check size={19} />
                </button>
            </div>
        </div>
    );
}
