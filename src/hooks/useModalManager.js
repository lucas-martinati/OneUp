import { useState, useMemo, useCallback } from 'react';

export function useModalManager(initialModals = {}, syncModals = []) {
    const keys = useMemo(() => Object.keys(initialModals), []);

    const [modals, setModals] = useState(() => ({ ...initialModals }));

    const openModal = useCallback((id) => {
        setModals(prev => ({ ...prev, [id]: true }));
    }, []);

    const closeModal = useCallback((id) => {
        setModals(prev => ({ ...prev, [id]: false }));
    }, []);

    const toggleModal = useCallback((id) => {
        setModals(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const anyModalOpen = useMemo(
        () => keys.some(k => modals[k]),
        [modals, keys]
    );

    // activeModals for useHardwareBack: { isOpen, close, shouldResumeSync? }
    const activeModals = useMemo(
        () => keys.filter(k => modals[k]).map(k => ({
            isOpen: true,
            close: () => closeModal(k),
            shouldResumeSync: syncModals.includes(k),
        })),
        [modals, keys, syncModals, closeModal]
    );

    return { modals, openModal, closeModal, toggleModal, anyModalOpen, activeModals };
}
