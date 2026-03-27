import { Smartphone } from 'lucide-react';

export function WebPaymentModal({ onClose }) {
    return (
        <div className="fade-in" style={{
            position: 'fixed', inset: 0,
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)'
        }}>
            <div className="scale-in" style={{
                maxWidth: '360px', width: '85%',
                padding: '32px 24px', textAlign: 'center',
                background: 'linear-gradient(180deg, var(--surface-section) 0%, rgba(20,20,20,0.95) 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)'
            }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px auto', fontSize: '32px',
                    boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.05)'
                }}>
                    😕
                </div>
                
                <h2 style={{
                    fontSize: '1.4rem', fontWeight: '800', margin: '0 0 12px 0',
                    color: 'var(--text-primary)'
                }}>
                    Oups...
                </h2>
                
                <p style={{
                    fontSize: '0.9rem', color: 'var(--text-secondary)',
                    lineHeight: '1.6', margin: '0 0 28px 0',
                    padding: '0 10px'
                }}>
                    Les paiements In-App ne sont pas disponibles sur la version Web.<br/><br/>Veuillez utiliser l'application Android pour accéder à la boutique et débloquer ces fonctionnalités !
                </p>

                <button onClick={onClose} className="hover-lift" style={{
                    width: '100%', padding: '16px', borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    border: 'none', color: 'white', fontWeight: '700',
                    fontSize: '1rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}>
                    <Smartphone size={18} />
                    J'ai compris
                </button>
            </div>
        </div>
    );
}
