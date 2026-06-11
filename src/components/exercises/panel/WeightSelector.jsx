import { Check } from '../../../utils/icons';

export function WeightSelector({ activeColor, currentWeight, handleValidateWeight, localWeightStr, setLocalWeightStr, t }) {
    const parsedWeight = parseFloat(localWeightStr.replace(',', '.'));
    const isUnchanged = parsedWeight === currentWeight;

    return (
        <div className="scale-in" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: 'var(--spacing-sm)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-lg)',
                background: `linear-gradient(135deg, ${activeColor}12, ${activeColor}08)`,
                border: `1px solid ${activeColor}30`
            }}>
                <input
                    type="number"
                    inputMode="decimal"
                    value={localWeightStr}
                    onChange={(e) => setLocalWeightStr(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleValidateWeight()}
                    onBlur={handleValidateWeight}
                    style={{
                        width: Math.max(40, localWeightStr.length * 14 + 10) + 'px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: '1.4rem',
                        fontWeight: '800',
                        color: activeColor,
                        textAlign: 'center'
                    }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    {t('weight.kg')}
                </span>
            </div>
            <button
                onClick={handleValidateWeight}
                className="hover-lift"
                disabled={isUnchanged}
                style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: isUnchanged ? 'rgba(255,255,255,0.06)' : `${activeColor}20`,
                    border: `1px solid ${activeColor}40`,
                    cursor: isUnchanged ? 'default' : 'pointer',
                    color: activeColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    opacity: isUnchanged ? 0.4 : 1
                }}
            >
                <Check size={20} />
            </button>
        </div>
    );
}
