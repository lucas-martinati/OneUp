import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';

export function AchievementToast({ achievement, onClose, onView }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onClose, 300);
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    if (!achievement) return null;

    const Icon = achievement.icon;

    const handleClick = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
            onView?.();
        }, 200);
    };

    return createPortal(
        <div style={{
            position: 'fixed', top: '60px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999,
            opacity: isExiting ? 0 : (isVisible ? 1 : 0),
            translateY: isExiting ? -20 : (isVisible ? 0 : -100),
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isVisible && !isExiting ? 'auto' : 'none'
        }}>
            <div 
                onClick={handleClick}
                className="glass hover-lift"
                style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px', borderRadius: '12px',
                    background: `linear-gradient(135deg, ${achievement.color}33, ${achievement.color}22)`,
                    border: `1px solid ${achievement.color}66`,
                    boxShadow: `0 4px 20px ${achievement.color}44`,
                    minWidth: '280px', cursor: 'pointer'
                }}
            >
                <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: `${achievement.color}44`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                }}>
                    <Icon size={22} color={achievement.color} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Succès Débloqué!
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: '700', color: achievement.color }}>
                        {achievement.title}
                    </div>
                </div>
                <ChevronRight size={20} color={achievement.color} />
            </div>
        </div>,
        document.body
    );
}
