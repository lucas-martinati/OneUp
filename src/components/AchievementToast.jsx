import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';

export function AchievementToast({ achievement, onClose, onView }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [translateX, setTranslateX] = useState(0);
    const [noTransition, setNoTransition] = useState(false);
    const startX = useRef(0);
    const isDragging = useRef(false);

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
        if (Math.abs(translateX) > 50) return;
        setIsExiting(true);
        setTimeout(() => {
            onClose();
            onView?.();
        }, 200);
    };

    const handleTouchStart = (e) => {
        startX.current = e.touches[0].clientX;
        isDragging.current = true;
        setNoTransition(true);
    };

    const handleTouchMove = (e) => {
        if (!isDragging.current) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX.current;
        setTranslateX(diff * 0.5);
    };

    const handleTouchEnd = useCallback(() => {
        isDragging.current = false;
        setNoTransition(false);
        if (Math.abs(translateX) > 25) {
            setIsExiting(true);
            setTimeout(onClose, 200);
        } else {
            setTranslateX(0);
        }
    }, [translateX, onClose]);

    return createPortal(
        <div style={{
            position: 'fixed', top: 'calc(var(--spacing-md) + env(safe-area-inset-top))', left: '50%',
            transform: `translateX(calc(-50% + ${translateX}px)) translateY(${isExiting ? -20 : (isVisible ? 0 : -100)}px)`,
            zIndex: 9999,
            opacity: isExiting ? 0 : (isVisible ? 1 : 0),
            transition: noTransition ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isVisible && !isExiting ? 'auto' : 'none',
            maxWidth: 'calc(100vw - 32px)'
        }}>
            <div
                onClick={handleClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
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
