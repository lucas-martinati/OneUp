import { useState, useMemo, useCallback } from 'react';

export function useModalManager(initialModals = {}) {
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

    const activeModals = useMemo(
        () => keys.filter(k => modals[k]).map(k => ({ key: k, active: true })),
        [modals, keys]
    );

    return { modals, openModal, closeModal, toggleModal, anyModalOpen, activeModals };
}
