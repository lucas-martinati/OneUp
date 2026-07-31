import { useEffect, useRef } from 'react';
import { Z_INDEX } from '@utils/zIndex';

/**
 * Ultra-lightweight HTML5 Canvas Confetti.
 * 1 single <canvas> element instead of 80 DOM nodes.
 * 60 FPS smooth physics burst with realistic 3D ribbon twists and sparkling stars.
 */

const rand = (min, max) => Math.random() * (max - min) + min;

function drawStar(ctx, radius, points = 4) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const r = (i % 2 === 0) ? radius : radius / 2;
        const angle = (i * Math.PI) / points;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
}

export function CSSConfetti({
    active,
    colors = ['#fbbf24', '#8b5cf6', '#10b981', '#ec4899', '#3b82f6'],
    onDone,
    reducedParticles = false
}) {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!active) return undefined;

        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        const ctx = canvas.getContext('2d');
        if (!ctx) return undefined;

        const width = window.innerWidth;
        const height = window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const count = reducedParticles ? 22 : 45;
        const shapes = ['ribbon', 'ribbon', 'circle', 'star'];

        const particles = Array.from({ length: count }, () => {
            const angle = rand(0, Math.PI * 2);
            const speed = rand(6, 18);
            return {
                x: width / 2,
                y: height * 0.45,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - rand(3, 8),
                size: rand(6, 12),
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: rand(0, Math.PI * 2),
                rotSpeed: rand(-0.15, 0.15),
                shape: shapes[Math.floor(Math.random() * shapes.length)],
                opacity: 1.0,
                decay: rand(0.012, 0.024),
                gravity: rand(0.25, 0.45),
                drag: rand(0.95, 0.97),
            };
        });

        let animId = null;

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            let aliveCount = 0;

            for (const p of particles) {
                if (p.opacity <= 0) continue;

                aliveCount++;
                p.vx *= p.drag;
                p.vy = p.vy * p.drag + p.gravity;
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.rotSpeed;
                p.opacity -= p.decay;

                const currentAlpha = Math.max(0, p.opacity);

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.globalAlpha = currentAlpha;
                ctx.fillStyle = p.color;

                if (p.shape === 'ribbon') {
                    // Realistic 3D flip effect using cosine matrix scaling
                    const flipScale = Math.cos(p.rotation * 2);
                    ctx.scale(1, flipScale);
                    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                } else if (p.shape === 'circle') {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (p.shape === 'star') {
                    drawStar(ctx, p.size / 1.5, 4);
                }

                ctx.restore();
            }

            if (aliveCount > 0) {
                animId = requestAnimationFrame(render);
            } else {
                ctx.clearRect(0, 0, width, height);
                onDone?.();
            }
        };

        animId = requestAnimationFrame(render);

        return () => {
            if (animId) cancelAnimationFrame(animId);
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
    }, [active, colors, onDone, reducedParticles]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: Z_INDEX.DELETE_OVERLAY,
            }}
        />
    );
}