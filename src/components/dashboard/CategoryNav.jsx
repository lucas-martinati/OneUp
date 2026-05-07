import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CATEGORIES, isUserCategory } from '../../config/categories';

/**
 * CategoryNav - A high-performance, isolated navigation scrubber.
 * Handles touch interactions smoothly without lagging the main application.
 */
export const CategoryNav = ({ 
    fullCategoryOrder, 
    activeSlide, 
    customCategories, 
    scrollContainerRef, 
    anyModalOpen 
}) => {
    const { t } = useTranslation();
    const [isNavExpanded, setIsNavExpanded] = useState(false);
    const [dragIndex, setDragIndex] = useState(null);
    const navInteractionRef = useRef({ timer: null, startY: 0, startX: 0, isLongPress: false });
    const navContainerRef = useRef(null);

    // Prevent native scrolling (rubber-banding) on mobile when dragging the scrubber
    useEffect(() => {
        const navEl = navContainerRef.current;
        if (!navEl) return;
        const handleTouchMove = (e) => {
            if (navInteractionRef.current.isLongPress && e.cancelable) {
                e.preventDefault();
            }
        };
        navEl.addEventListener('touchmove', handleTouchMove, { passive: false });
        return () => navEl.removeEventListener('touchmove', handleTouchMove);
    }, []);

    // Mathematically calculates the targeted index based on pointer Y coordinate.
    // Accounts for container padding (12px top/bottom) for flawless edge detection.
    const calculateIndexFromY = (clientY, containerRect) => {
        const PADDING = 12; // Matches padding in CSS
        const availableHeight = Math.max(1, containerRect.height - (PADDING * 2));
        const relativeY = Math.max(0, Math.min(availableHeight, clientY - containerRect.top - PADDING));
        const numItems = fullCategoryOrder.length;
        const index = Math.floor((relativeY / availableHeight) * numItems);
        return Math.min(numItems - 1, index); // Clamp to max index
    };

    return (
        <div 
            ref={navContainerRef}
            className={`category-nav-container ${isNavExpanded ? 'expanded' : ''}`}
            onPointerDown={(e) => {
                const y = e.clientY;
                const x = e.clientX;
                const target = e.currentTarget;
                const isMouse = e.pointerType === 'mouse';
                
                navInteractionRef.current.startY = y;
                navInteractionRef.current.startX = x;
                navInteractionRef.current.isLongPress = false;
                
                // UX Optimization: Instant on desktop (0ms), standard long-press delay on mobile (200ms)
                const delay = isMouse ? 0 : 200;
                
                navInteractionRef.current.timer = setTimeout(() => {
                    navInteractionRef.current.isLongPress = true;
                    setIsNavExpanded(true);
                    target.setPointerCapture(e.pointerId);
                    if (window.navigator.vibrate && navigator.userActivation?.hasBeenActive) {
                        window.navigator.vibrate(isMouse ? 2 : 10);
                    }
                    
                    const rect = target.getBoundingClientRect();
                    const closest = calculateIndexFromY(y, rect);
                    
                    setDragIndex(closest);
                    if (closest !== activeSlide) {
                        scrollContainerRef.current?.scrollTo({ top: scrollContainerRef.current.clientHeight * closest, behavior: 'smooth' });
                    }
                }, delay);
            }}
            onPointerUp={(e) => {
                clearTimeout(navInteractionRef.current.timer);
                if (navInteractionRef.current.isLongPress) {
                    setIsNavExpanded(false);
                    setDragIndex(null);
                    e.currentTarget.releasePointerCapture(e.pointerId);
                    navInteractionRef.current.isLongPress = false;
                } else {
                    // Pass-through click for short taps
                    const target = e.target;
                    if (target.closest('.category-nav-dot')) return; // Let dot's onClick fire
                    
                    const x = e.clientX;
                    const y = e.clientY;
                    const navContainer = e.currentTarget;
                    
                    navContainer.style.pointerEvents = 'none';
                    const elementBelow = document.elementFromPoint(x, y);
                    navContainer.style.pointerEvents = 'auto';
                    
                    if (elementBelow) {
                        if (typeof elementBelow.click === 'function') {
                            elementBelow.click();
                        } else {
                            elementBelow.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
                        }
                    }
                }
            }}
            onPointerMove={(e) => {
                if (!navInteractionRef.current.isLongPress) {
                    const dy = Math.abs(e.clientY - navInteractionRef.current.startY);
                    const dx = Math.abs(e.clientX - navInteractionRef.current.startX);
                    // Movement tolerance to prevent accidental cancellations
                    if (dy > 30 || dx > 30) {
                        clearTimeout(navInteractionRef.current.timer);
                    }
                    return;
                }
                
                const target = e.currentTarget;
                const rect = target.getBoundingClientRect();
                const index = calculateIndexFromY(e.clientY, rect);
                
                setDragIndex(prevIndex => {
                    if (prevIndex !== index) {
                        const el = scrollContainerRef.current;
                        if (el) {
                            el.scrollTo({ top: el.clientHeight * index, behavior: 'smooth' });
                        }
                        if (window.navigator.vibrate && e.pointerType !== 'mouse' && navigator.userActivation?.hasBeenActive) {
                            window.navigator.vibrate(5);
                        }
                        return index;
                    }
                    return prevIndex;
                });
            }}
            onPointerCancel={() => {
                clearTimeout(navInteractionRef.current.timer);
                if (navInteractionRef.current.isLongPress) {
                    setIsNavExpanded(false);
                    setDragIndex(null);
                    navInteractionRef.current.isLongPress = false;
                }
            }}
            onContextMenu={(e) => {
                if (navInteractionRef.current.isLongPress) e.preventDefault();
            }}
            style={{ pointerEvents: anyModalOpen ? 'none' : 'auto' }}
        >
            {fullCategoryOrder.map((catId, i) => {
                const isUserCat = isUserCategory(catId);
                
                // CRITICAL VISUAL LOGIC:
                // When dragging, ONLY the dragged dot is active. This prevents visual conflicts
                // (e.g. the active slide dot fighting with the dragged dot).
                const isDraggedDot = isNavExpanded && dragIndex === i;
                const isActualActiveSlide = !isNavExpanded && activeSlide === i;
                
                const isActive = isDraggedDot || isActualActiveSlide;
                const isDragOver = isDraggedDot;
                
                const getCategoryName = (id) => {
                    if (id === CATEGORIES.BODYWEIGHT) return t('common.bodyweight');
                    if (id === CATEGORIES.WEIGHTS) return t('common.weights');
                    if (id === CATEGORIES.CARDIO) return t('common.cardio');
                    if (id === CATEGORIES.CUSTOM) return t('common.custom');
                    return customCategories.find(c => c.id === id)?.name || id;
                };

                const dotColor = isActive 
                    ? (isUserCat ? '#94a3b8' : 'var(--text-primary)') 
                    : (isUserCat ? '#475569' : 'var(--text-secondary)');

                return (
                    <div 
                        key={i} 
                        className={`category-nav-dot ${isActive ? 'active' : ''} ${isDragOver ? 'drag-over' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            const el = scrollContainerRef.current;
                            if (el) {
                                el.scrollTo({ top: el.clientHeight * i, behavior: 'smooth' });
                            }
                        }}
                        style={{ background: dotColor }}
                    >
                        <span className="category-nav-label">
                            {getCategoryName(catId)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
