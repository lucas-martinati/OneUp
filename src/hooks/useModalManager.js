import { useState, useMemo, useCallback } from 'react';

/**
 * useModalManager Hook
 * 
 * Manages multiple modals and maintains an opening stack to handle 
 * hardware back button logic in the correct order (LIFO).
 */
export function useModalManager(initialModals = {}, syncModals = []) {
    const [modals, setModals] = useState(() => ({ ...initialModals }));
    
    // Maintain a stack of active modal IDs to know which one was opened last
    const [stack, setStack] = useState([]);

    const openModal = useCallback((id) => {
        setModals(prev => ({ ...prev, [id]: true }));
        setStack(prev => [...prev.filter(item => item !== id), id]);
    }, []);

    const closeModal = useCallback((id) => {
        setModals(prev => ({ ...prev, [id]: false }));
        setStack(prev => prev.filter(item => item !== id));
    }, []);

    const toggleModal = useCallback((id) => {
        setModals(prev => {
            const isOpen = !prev[id];
            if (isOpen) {
                setStack(s => [...s.filter(item => item !== id), id]);
            } else {
                setStack(s => s.filter(item => item !== id));
            }
            return { ...prev, [id]: isOpen };
        });
    }, []);

    const anyModalOpen = stack.length > 0;

    /**
     * Back handler function to be registered globally.
     * Closes the most recently opened modal.
     */
    const handleBack = useCallback(() => {
        if (stack.length === 0) return false;
        
        const lastId = stack[stack.length - 1];
        closeModal(lastId);
        return true;
    }, [stack, closeModal]);

    // This is for backward compatibility with the old useHardwareBack signature if needed
    const activeModals = useMemo(
        () => stack.slice().reverse().map(id => ({
            isOpen: true,
            close: () => closeModal(id),
            shouldResumeSync: syncModals.includes(id),
        })),
        [stack, syncModals, closeModal]
    );

    return { modals, openModal, closeModal, toggleModal, anyModalOpen, activeModals, handleBack };
}
