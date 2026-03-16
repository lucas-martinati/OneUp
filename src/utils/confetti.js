import confetti from 'canvas-confetti';

let confettiInstance = null;
let lastFireAt = 0;

const getConfetti = () => {
    if (!confettiInstance) {
        confettiInstance = confetti.create(undefined, { resize: true, useWorker: true });
    }
    return confettiInstance;
};

const prefersReducedMotion = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const getPerfFactor = () => {
    const mem = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    if (mem <= 2 || cores <= 4) return 0.35;
    if (mem <= 3 || cores <= 6) return 0.5;
    if (mem <= 4 || cores <= 8) return 0.7;
    return 1;
};

const shouldDisable = () => {
    const mem = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    return mem <= 2 || cores <= 4;
};

const normalizeOptions = (options) => {
    const factor = getPerfFactor();
    const baseCount = options.particleCount ?? 60;
    const baseTicks = options.ticks ?? 180;
    const baseScalar = options.scalar ?? 1;
    const maxParticles = factor < 0.5 ? 40 : 80;
    const maxTicks = factor < 0.5 ? 140 : 180;
    return {
        ...options,
        particleCount: Math.max(12, Math.min(maxParticles, Math.round(baseCount * factor))),
        ticks: Math.max(90, Math.min(maxTicks, Math.round(baseTicks * factor))),
        scalar: factor < 0.7 ? Math.min(baseScalar, 0.9) : baseScalar
    };
};

export const fireConfetti = (options) => {
    if (prefersReducedMotion() || shouldDisable()) return;
    const now = Date.now();
    if (now - lastFireAt < 160) return;
    lastFireAt = now;
    getConfetti()(normalizeOptions(options));
};

export const resetConfetti = () => {
    try { confettiInstance?.reset?.(); } catch (e) { console.warn('Confetti reset error:', e); }
    try { confetti.reset(); } catch (e) { console.warn('Confetti reset error:', e); }
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
        try {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (canvas.style.position === 'fixed' || canvas.style.position === 'absolute') {
                canvas.remove();
            }
        } catch (e) { console.error('Canvas cleanup error:', e); }
    });
};
