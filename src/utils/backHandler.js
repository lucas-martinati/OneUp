const stack = [];

export const registerBackHandler = (handler) => {
    if (typeof handler !== 'function') return () => {};
    const entry = { id: Symbol('backHandler'), handler };
    stack.push(entry);
    return () => {
        const idx = stack.findIndex(item => item.id === entry.id);
        if (idx >= 0) stack.splice(idx, 1);
    };
};

export const runBackHandler = () => {
    for (let i = stack.length - 1; i >= 0; i--) {
        const entry = stack[i];
        try {
            if (entry?.handler?.()) return true;
        } catch (e) {
            console.warn('Back handler error:', e);
            return true;
        }
    }
    return false;
};
