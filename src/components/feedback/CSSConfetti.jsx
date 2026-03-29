import { useState, useEffect } from 'react';
import { Z_INDEX } from '../../utils/zIndex';

/**
 * Pure CSS confetti — 3D tumbling & realistic parabolic burst.
 * Uses GPU-composited CSS animations.
 */

const PARTICLE_COUNT_HIGH = 80;
const PARTICLE_COUNT_LOW = 20;
const BASE_DURATION_MS = 2500; // Durée de base un peu plus longue pour la chute

const rand = (min, max) => Math.random() * (max - min) + min;

const SHAPES = ['circle', 'square', 'rectangle'];

const generateParticles = (colors, count) =>
    Array.from({ length: count }, (_, i) => {
        // Angle aléatoire sur 360°
        const angle = rand(0, 360);
        const rad = (angle * Math.PI) / 180;

        // Distance d'éjection (vitesse initiale)
        const distance = rand(20, 80);
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];

        return {
            id: i,
            color: colors[Math.floor(Math.random() * colors.length)],
            // dx = gauche/droite (vw), dy = haut/bas (vh). Négatif = vers le haut
            dx: Math.cos(rad) * distance,
            dy: -Math.sin(rad) * distance,

            // Axes de rotation 3D aléatoires pour l'effet de virevolte
            rx: rand(-1, 1),
            ry: rand(-1, 1),
            rz: rand(-1, 1),
            rotation: rand(360, 1440), // Nombre de degrés de rotation totale

            size: rand(6, 12),
            delay: rand(0, 150), // Décalage pour ne pas que tout parte exactement au même millième de seconde
            duration: rand(BASE_DURATION_MS - 500, BASE_DURATION_MS + 800), // Chaque particule a son propre temps de chute
            shape,
            gravity: rand(40, 90), // Force de la chute (vh)
        };
    });

// Injection des styles une seule fois
let stylesInjected = false;
const injectStyles = () => {
    if (stylesInjected) return;
    stylesInjected = true;
    const style = document.createElement('style');
    style.textContent = `
        @keyframes confettiBurst3D {
            0% {
                transform: translate3d(0, 0, 0) scale(0);
                opacity: 0;
                /* Expulsion rapide (décélération) */
                animation-timing-function: cubic-bezier(0.1, 0.9, 0.2, 1);
            }
            5% {
                opacity: 1;
                transform: translate3d(0, 0, 0) scale(1);
            }
            40% {
                /* Apogée de l'explosion : le confetti atteint sa distance max, la gravité va prendre le relais */
                transform: 
                    translate3d(
                        calc(var(--dx) * 1vw), 
                        calc(var(--dy) * 1vh), 
                        0
                    ) 
                    rotate3d(var(--rx), var(--ry), var(--rz), calc(var(--rot) * 0.4deg)) 
                    scale(1);
                /* Chute sous l'effet de la gravité (accélération) */
                animation-timing-function: ease-in;
            }
            100% {
                /* Fin de la chute */
                transform: 
                    translate3d(
                        calc(var(--dx) * 1vw), 
                        calc(var(--dy) * 1vh + var(--grav) * 1vh), 
                        0
                    ) 
                    rotate3d(var(--rx), var(--ry), var(--rz), calc(var(--rot) * 1deg)) 
                    scale(0.8);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
};

export function CSSConfetti({
    active,
    colors = ['#fbbf24', '#8b5cf6', '#10b981', '#ec4899', '#3b82f6'],
    onDone,
    reducedParticles = false
}) {
    const [particles, setParticles] = useState(null);
    const particleCount = reducedParticles ? PARTICLE_COUNT_LOW : PARTICLE_COUNT_HIGH;

    useEffect(() => {
        if (!active) {
            setParticles(null);
            return;
        }

        injectStyles();
        setParticles(generateParticles(colors, particleCount));

        // Nettoyage après la durée maximale d'une particule
        const maxTimer = BASE_DURATION_MS + 800 + 150;
        const timer = setTimeout(() => {
            setParticles(null);
            onDone?.();
        }, maxTimer);

        return () => clearTimeout(timer);
    }, [active, colors, onDone]);

    if (!particles) return null;

    return (
        <div
            aria-hidden="true"
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: Z_INDEX.DELETE_OVERLAY,
                overflow: 'hidden',
                perspective: '1000px', // Ajoute une profondeur pour la rotation 3D
            }}
        >
            {particles.map(p => {
                // Variations de proportions selon la forme
                const w = p.shape === 'rectangle' ? `${p.size * 0.4}px` : `${p.size}px`;
                const h = p.shape === 'rectangle' ? `${p.size * 1.5}px` : `${p.size}px`;
                const br = p.shape === 'circle' ? '50%' : '2px';

                return (
                    <div
                        key={p.id}
                        style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%', // Centré pour l'explosion
                            width: w,
                            height: h,
                            borderRadius: br,
                            background: p.color,
                            // Variables CSS passées au keyframe
                            '--dx': p.dx,
                            '--dy': p.dy,
                            '--rx': p.rx,
                            '--ry': p.ry,
                            '--rz': p.rz,
                            '--rot': p.rotation,
                            '--grav': p.gravity,
                            animation: `confettiBurst3D ${p.duration}ms forwards ${p.delay}ms`,
                            willChange: 'transform, opacity',
                        }}
                    />
                );
            })}
        </div>
    );
}