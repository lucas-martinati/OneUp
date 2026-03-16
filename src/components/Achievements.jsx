import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Award, Flame, Zap, Target, Crown, Activity, Star, Rocket, Trophy, Medal, Gem, Heart, Moon, Sun, Calendar, Clock, TrendingUp, Users, Zap as Lightning, Star as StarIcon, Ghost, Lock } from 'lucide-react';
import { isDayDoneFromCompletions, getLocalDateStr } from '../utils/dateUtils';
import { getDailyGoal } from '../config/exercises';

export function Achievements({ completions, exercises, onClose, highlightedBadgeId, settings, getDayNumber }) {
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const sheetRef = useRef(null);
    const startY = useRef(0);
    const currentDragY = useRef(0);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => onClose(), 150);
    }, [onClose]);

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true));
    }, []);

    useEffect(() => {
        history.pushState({ sheetOpen: true }, '');
        const handlePopState = (e) => {
            handleClose();
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [handleClose]);

    const handleTouchStart = (e) => {
        const contentEl = sheetRef.current?.querySelector('[data-scroll-content]');
        const canScrollUp = contentEl ? contentEl.scrollTop > 0 : false;

        // Only enable drag to close if content is scrolled to top or touching near top
        const touchY = e.touches[0].clientY;
        const isNearTop = touchY < 100;

        if (!canScrollUp || isNearTop) {
            startY.current = e.touches[0].clientY;
            setIsDragging(true);
        }
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;
        if (diff > 0) {
            const newDragY = diff * 0.13;
            currentDragY.current = newDragY;
            setDragY(newDragY);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (currentDragY.current > 15) {
            handleClose();
        } else {
            currentDragY.current = 0;
            setDragY(0);
        }
    };

    const handleMouseDown = (e) => {
        startY.current = e.clientY;
        setIsDragging(true);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const currentY = e.clientY;
        const diff = currentY - startY.current;
        if (diff > 0) {
            const newDragY = diff * 0.13;
            currentDragY.current = newDragY;
            setDragY(newDragY);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        if (currentDragY.current > 15) {
            handleClose();
        } else {
            currentDragY.current = 0;
            setDragY(0);
        }
    };

    const translateY = dragY;

    // === CALCULS POUR LES ACHIEVEMENTS ===

    // Jours totaux
    const totalDays = useMemo(() => {
        let count = 0;
        for (const date in completions) {
            if (isDayDoneFromCompletions(completions, date)) count++;
        }
        return count;
    }, [completions]);

    // Série max
    const maxStreak = useMemo(() => {
        let max = 0, temp = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            if (isDayDoneFromCompletions(completions, getLocalDateStr(d))) {
                temp++;
                if (temp > max) max = temp;
            } else {
                temp = 0;
            }
        }
        return max;
    }, [completions]);

    // Total répétitions par exercice
    const totalExerciseReps = useMemo(() => {
        let reps = {};
        for (const date in completions) {
            for (const exId in completions[date]) {
                if (completions[date][exId]?.isCompleted) {
                    const ex = exercises?.find(e => e.id === exId);
                    if (ex) {
                        const dayNum = getDayNumber(date);
                        reps[exId] = (reps[exId] || 0) + getDailyGoal(ex, dayNum, settings?.difficultyMultiplier);
                    }
                }
            }
        }
        return reps;
    }, [completions, exercises, settings]);

    // Tous les exercices faits au moins une fois
    const hasCompletedAllExercisesOnce = useMemo(() => {
        let completedIds = new Set();
        for (const date in completions) {
            for (const exId in completions[date]) {
                if (completions[date][exId]?.isCompleted) {
                    completedIds.add(exId);
                }
            }
        }
        return exercises?.every(ex => completedIds.has(ex.id)) ?? false;
    }, [completions, exercises]);

    // Total reps tous exercices
    const totalRepsAll = useMemo(() => {
        let total = 0;
        for (const exId in totalExerciseReps) {
            total += totalExerciseReps[exId];
        }
        return total;
    }, [totalExerciseReps]);

    // Jours avec tous les exercices complétés
    const perfectDays = useMemo(() => {
        let count = 0;
        for (const date in completions) {
            const dayCompletions = completions[date];
            const allDone = exercises?.every(ex => dayCompletions[ex.id]?.isCompleted) ?? false;
            if (allDone) count++;
        }
        return count;
    }, [completions, exercises]);

    // Jours de la semaine (lundi-vendredi)
    const weekdayWorkouts = useMemo(() => {
        let count = 0;
        for (const date in completions) {
            const d = new Date(date);
            const dayOfWeek = d.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                if (isDayDoneFromCompletions(completions, date)) count++;
            }
        }
        return count;
    }, [completions]);

    // Jours du week-end
    const weekendWorkouts = useMemo(() => {
        let count = 0;
        for (const date in completions) {
            const d = new Date(date);
            const dayOfWeek = d.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                if (isDayDoneFromCompletions(completions, date)) count++;
            }
        }
        return count;
    }, [completions]);

    // Entraînements le matin
    const morningWorkouts = useMemo(() => {
        let count = 0;
        for (const date in completions) {
            for (const exId in completions[date]) {
                if (completions[date][exId]?.timeOfDay === 'morning') {
                    count++;
                    break;
                }
            }
        }
        return count;
    }, [completions]);

    // Entraînements l'après-midi
    const afternoonWorkouts = useMemo(() => {
        let count = 0;
        for (const date in completions) {
            for (const exId in completions[date]) {
                if (completions[date][exId]?.timeOfDay === 'afternoon') {
                    count++;
                    break;
                }
            }
        }
        return count;
    }, [completions]);

    // Entraînements le soir
    const eveningWorkouts = useMemo(() => {
        let count = 0;
        for (const date in completions) {
            for (const exId in completions[date]) {
                if (completions[date][exId]?.timeOfDay === 'evening') {
                    count++;
                    break;
                }
            }
        }
        return count;
    }, [completions]);

    // Ghost - workout between 3h and 4h
    const ghostWorkout = useMemo(() => {
        for (const date in completions) {
            for (const exId in completions[date]) {
                const timestamp = completions[date][exId]?.timestamp;
                if (timestamp) {
                    const hour = new Date(timestamp).getHours();
                    if (hour >= 3 && hour < 4) return true;
                }
            }
        }
        return false;
    }, [completions]);

    // Perfectionist - 30 consecutive perfect days
    const perfectStreak = useMemo(() => {
        let streak = 0, maxStreak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayCompletions = completions[dateStr];
            const isPerfect = exercises?.every(ex => dayCompletions?.[ex.id]?.isCompleted) ?? false;
            if (isPerfect) {
                streak++;
                if (streak > maxStreak) maxStreak = streak;
            } else {
                streak = 0;
            }
        }
        return maxStreak;
    }, [completions, exercises]);

    // Achievements
    const BADGES = [
        // === DEBUTANT ===
        {
            id: 'first_blood',
            title: 'Premier Pas',
            description: 'Valide ton premier entraînement',
            icon: Target,
            color: '#3b82f6',
            unlocked: totalDays >= 1,
            category: 'streak'
        },
        {
            id: 'consistent',
            title: 'Régularité',
            description: 'Entraînement 3 jours de suite',
            icon: Flame,
            color: '#f97316',
            unlocked: maxStreak >= 3,
            category: 'streak'
        },
        {
            id: 'week_warrior',
            title: 'Guerrier de la Semaine',
            description: '7 jours d\'affilée',
            icon: Calendar,
            color: '#8b5cf6',
            unlocked: maxStreak >= 7,
            category: 'streak'
        },

        // === INTERMÉDIAIRE ===
        {
            id: 'two_weeks',
            title: 'Ténacité',
            description: '14 jours d\'affilée',
            icon: TrendingUp,
            color: '#06b6d4',
            unlocked: maxStreak >= 14,
            category: 'streak'
        },
        {
            id: 'month_warrior',
            title: 'Soldat du Mois',
            description: '30 jours d\'affilée',
            icon: Zap,
            color: '#eab308',
            unlocked: maxStreak >= 30,
            category: 'streak'
        },

        // === AVANCÉ ===
        {
            id: 'two_months',
            title: 'Discipline de Fer',
            description: '60 jours d\'affilée',
            icon: Trophy,
            color: '#dc2626',
            unlocked: maxStreak >= 60,
            category: 'streak'
        },
        {
            id: 'quarter_year',
            title: 'Quarterback',
            description: '90 jours d\'affilée',
            icon: Medal,
            color: '#7c3aed',
            unlocked: maxStreak >= 90,
            category: 'streak'
        },
        {
            id: 'half_year',
            title: 'Demi-Année',
            description: '180 jours d\'affilée',
            icon: Gem,
            color: '#059669',
            unlocked: maxStreak >= 180,
            category: 'streak'
        },
        {
            id: 'year_beast',
            title: 'Bête de Compétition',
            description: '365 jours d\'affilée',
            icon: Rocket,
            color: '#db2777',
            unlocked: maxStreak >= 365,
            category: 'streak'
        },

        // === QUANTITÉ ===
        {
            id: 'ten_sessions',
            title: 'Dix de der',
            description: '10 entraînement total',
            icon: StarIcon,
            color: '#22c55e',
            unlocked: totalDays >= 10,
            category: 'quantite'
        },
        {
            id: 'fifty_sessions',
            title: 'Cinquante',
            description: '50 entraînement total',
            icon: Award,
            color: '#14b8a6',
            unlocked: totalDays >= 50,
            category: 'quantite'
        },
        {
            id: 'hundred_sessions',
            title: 'Centurion',
            description: '100 entraînement total',
            icon: Crown,
            color: '#f472b6',
            unlocked: totalDays >= 100,
            category: 'quantite'
        },
        {
            id: 'two_hundred_sessions',
            title: 'Légende',
            description: '200 entraînement total',
            icon: Star,
            color: '#fb923c',
            unlocked: totalDays >= 200,
            category: 'quantite'
        },
        {
            id: 'five_hundred_sessions',
            title: 'Mythique',
            description: '500 entraînement total',
            icon: Gem,
            color: '#a855f7',
            unlocked: totalDays >= 500,
            category: 'quantite'
        },

        // === VOLUME TOTAL ===
        {
            id: 'rep_500',
            title: '500 Répétitions',
            description: '500 reps au total',
            icon: Activity,
            color: '#ef4444',
            unlocked: totalRepsAll >= 500,
            category: 'volume'
        },
        {
            id: 'rep_1000',
            title: 'Millier',
            description: '1 000 reps au total',
            icon: Zap,
            color: '#facc15',
            unlocked: totalRepsAll >= 1000,
            category: 'volume'
        },
        {
            id: 'rep_5000',
            title: 'Cinq Milliers',
            description: '5 000 reps au total',
            icon: Flame,
            color: '#f97316',
            unlocked: totalRepsAll >= 5000,
            category: 'volume'
        },
        {
            id: 'rep_10000',
            title: 'Compteur',
            description: '10 000 reps au total',
            icon: Trophy,
            color: '#eab308',
            unlocked: totalRepsAll >= 10000,
            category: 'volume'
        },
        {
            id: 'rep_50000',
            title: 'Massacreur',
            description: '50 000 reps au total',
            icon: Rocket,
            color: '#ec4899',
            unlocked: totalRepsAll >= 50000,
            category: 'volume'
        },

        // === PERFECTION ===
        {
            id: 'perfect_one',
            title: 'Premier Jour Parfait',
            description: 'Un jour parfait (tous exos)',
            icon: StarIcon,
            color: '#22d3d1',
            unlocked: perfectDays >= 1,
            category: 'perfection'
        },
        {
            id: 'perfect_five',
            title: 'Excellence',
            description: '5 jours parfaits',
            icon: Medal,
            color: '#a78bfa',
            unlocked: perfectDays >= 5,
            category: 'perfection'
        },
        {
            id: 'perfect_fifty',
            title: 'Maîtrise',
            description: '50 jours parfaits',
            icon: Crown,
            color: '#fbbf24',
            unlocked: perfectDays >= 50,
            category: 'perfection'
        },
        {
            id: 'perfect_hundred',
            title: 'Perfectionniste',
            description: '100 jours parfaits',
            icon: Gem,
            color: '#c084fc',
            unlocked: perfectDays >= 100,
            category: 'perfection'
        },
        {
            id: 'perfect_two_hundred',
            title: 'Pas Humain!',
            description: '200 jours parfaits',
            icon: Gem,
            color: '#c084fc',
            unlocked: perfectDays >= 200,
            category: 'perfection'
        },

        // === POLYVALENCE ===
        {
            id: 'all_exercises',
            title: 'Polyvalent',
            description: 'Faire tous les exercices au moins une fois',
            icon: Target,
            color: '#8b5cf6',
            unlocked: hasCompletedAllExercisesOnce,
            category: 'quantite'
        },

        // === JOURS SPÉCIFIQUES ===
        {
            id: 'weekday_warrior',
            title: 'Lundi au Vendredi',
            description: '25 entraînements en semaine',
            icon: Sun,
            color: '#f59e0b',
            unlocked: weekdayWorkouts >= 25,
            category: 'quantite'
        },
        {
            id: 'weekend_warrior',
            title: 'Week-end',
            description: '25 entraînement le week-end',
            icon: Moon,
            color: '#6366f1',
            unlocked: weekendWorkouts >= 25,
            category: 'quantite'
        },
        {
            id: 'balanced',
            title: 'Équilibré',
            description: 'Autant weekday que week-end (10 entraînements minimum)',
            icon: Users,
            color: '#14b8a6',
            unlocked: weekdayWorkouts >= 10 && weekendWorkouts >= 10,
            category: 'quantite'
        },

        // === HORRAIRES ===
        {
            id: 'morning_5',
            title: 'Lève-Tôt',
            description: '5 entraînements le matin',
            icon: Sun,
            color: '#fb923c',
            unlocked: morningWorkouts >= 5,
            category: 'horaires'
        },
        {
            id: 'morning_10',
            title: 'Matinal',
            description: '10 entraînements le matin',
            icon: Sun,
            color: '#f59e0b',
            unlocked: morningWorkouts >= 10,
            category: 'horaires'
        },
        {
            id: 'morning_25',
            title: 'Aurore',
            description: '25 entraînements le matin',
            icon: Sun,
            color: '#d97706',
            unlocked: morningWorkouts >= 25,
            category: 'horaires'
        },
        {
            id: 'afternoon_5',
            title: 'Coup de Pied',
            description: '5 entraînements l\'après-midi',
            icon: Zap,
            color: '#22c55e',
            unlocked: afternoonWorkouts >= 5,
            category: 'horaires'
        },
        {
            id: 'afternoon_10',
            title: 'Après-Midi',
            description: '10 entraînements l\'après-midi',
            icon: Zap,
            color: '#16a34a',
            unlocked: afternoonWorkouts >= 10,
            category: 'horaires'
        },
        {
            id: 'afternoon_25',
            title: 'Rythme',
            description: '25 entraînements l\'après-midi',
            icon: Zap,
            color: '#15803d',
            unlocked: afternoonWorkouts >= 25,
            category: 'horaires'
        },
        {
            id: 'evening_5',
            title: 'Couche-Tard',
            description: '5 entraînements le soir',
            icon: Moon,
            color: '#6366f1',
            unlocked: eveningWorkouts >= 5,
            category: 'horaires'
        },
        {
            id: 'evening_10',
            title: 'Noctambule',
            description: '10 entraînements le soir',
            icon: Moon,
            color: '#4f46e5',
            unlocked: eveningWorkouts >= 10,
            category: 'horaires'
        },
        {
            id: 'evening_25',
            title: 'Lune',
            description: '25 entraînements le soir',
            icon: Moon,
            color: '#4338ca',
            unlocked: eveningWorkouts >= 25,
            category: 'horaires'
        },

        // === SECRETS ===
        {
            id: 'ghost',
            title: ghostWorkout ? 'Fantôme' : '???',
            description: ghostWorkout ? 'Entraînement entre 3h et 4h' : 'Secret',
            icon: Ghost,
            color: '#6b7280',
            unlocked: ghostWorkout,
            secret: true,
            category: 'secrets'
        },
        {
            id: 'perfectionist',
            title: perfectStreak >= 30 ? 'Perfectionniste' : '???',
            description: perfectStreak >= 30 ? '30 jours parfaits consécutifs' : 'Secret',
            icon: Star,
            color: '#6b7280',
            unlocked: perfectStreak >= 30,
            secret: true,
            category: 'secrets'
        },
        {
            id: 'beast',
            title: totalRepsAll >= 100000 ? 'Bête' : '???',
            description: totalRepsAll >= 100000 ? '100 000 répétitions au total' : 'Secret',
            icon: Rocket,
            color: '#6b7280',
            unlocked: totalRepsAll >= 100000,
            secret: true,
            category: 'secrets'
        }
    ];

    const unlockedCount = BADGES.filter(b => b.unlocked).length;

    const categories = [
        { id: 'streak', title: 'Série', color: '#f97316' },
        { id: 'quantite', title: 'Quantité', color: '#22c55e' },
        { id: 'volume', title: 'Volume', color: '#ef4444' },
        { id: 'perfection', title: 'Perfection', color: '#22d3d1' },
        { id: 'horaires', title: 'Horaires', color: '#fb923c' },
        { id: 'secrets', title: 'Secrets', color: '#6b7280' }
    ];

    return (
        <>
            <div onClick={handleClose} style={{
                position: 'fixed', inset: 0, zIndex: 199,
                background: 'rgba(0,0,0,0.5)', opacity: isClosing ? 0 : (isVisible ? (dragY > 0 ? Math.max(0, 1 - dragY / 300) : 1) : 0), transition: 'opacity 0.15s'
            }} />
            <div ref={sheetRef}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
                    background: 'var(--sheet-bg)', backdropFilter: 'blur(20px)',
                    borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                    padding: '20px',
                    paddingBottom: 'calc(var(--spacing-lg) + env(safe-area-inset-bottom))',
                    boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
                    transform: `translateY(${isClosing ? 100 : (isVisible ? translateY : 100)}%)`,
                    transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    maxHeight: '85vh', display: 'flex', flexDirection: 'column'
                }}>
                <div style={{
                    width: '40px', height: '4px', borderRadius: '2px',
                    background: 'var(--sheet-handle)', margin: '0 auto 16px',
                    cursor: 'grab'
                }} />

                <div data-scroll-content style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none', position: 'relative', zIndex: 1 }} className="no-scrollbar">
                    {/* Progress Overview */}
                    <div className="glass-premium scale-in" style={{
                        padding: 'var(--spacing-lg) var(--spacing-md)',
                        borderRadius: 'var(--radius-xl)', textAlign: 'center',
                        marginBottom: 'var(--spacing-md)',
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.12))'
                    }}>
                        <Award size={36} color="#fbbf24" style={{ marginBottom: '8px' }} />
                        <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#fbbf24', lineHeight: 1 }}>
                            {unlockedCount} / {BADGES.length}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Badges Débloqués
                        </div>
                    </div>

                    {categories.map(cat => {
                        const catBadges = BADGES.filter(b => b.category === cat.id);
                        if (catBadges.length === 0) return null;
                        return (
                            <div key={cat.id} style={{ marginBottom: '20px' }}>
                                <div style={{
                                    fontSize: '0.75rem', fontWeight: '700',
                                    color: cat.color, textTransform: 'uppercase',
                                    letterSpacing: '1px', marginBottom: '10px'
                                }}>
                                    {cat.title}
                                </div>
                                <div style={{
                                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px'
                                }}>
                                    {catBadges.map((badge, index) => {
                                        const Icon = badge.icon;
                                        const isHighlighted = badge.id === highlightedBadgeId;
                                        return (
                                            <div
                                                key={badge.id}
                                                className={isHighlighted ? 'pulse-glow' : 'glass-premium scale-in'}
                                                style={{
                                                    padding: '14px 10px',
                                                    borderRadius: 'var(--radius-lg)',
                                                    textAlign: 'center',
                                                    background: badge.unlocked ? `linear-gradient(135deg, ${badge.color}22, ${badge.color}10)` : 'var(--surface-muted)',
                                                    border: isHighlighted ? `2px solid ${badge.color}` : (badge.unlocked ? `1px solid ${badge.color}44` : '1px solid var(--border-subtle)'),
                                                    opacity: badge.unlocked ? 1 : 0.6,
                                                    animationDelay: isHighlighted ? '0s' : `${0.05 * index}s`,
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    boxShadow: isHighlighted ? `0 0 25px ${badge.color}88` : 'none',
                                                    transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
                                                    ['--badge-color']: badge.color
                                                }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '50%',
                                                    background: badge.unlocked ? `${badge.color}33` : 'var(--surface-hover)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    marginBottom: '8px'
                                                }}>
                                                    <Icon size={20} color={badge.unlocked ? badge.color : 'var(--text-secondary)'} />
                                                </div>
                                                <div style={{
                                                    fontSize: '0.8rem', fontWeight: '800',
                                                    color: badge.unlocked ? badge.color : 'var(--text-secondary)',
                                                    marginBottom: '2px', lineHeight: 1.2
                                                }}>
                                                    {badge.title}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.2
                                                }}>
                                                    {badge.description}
                                                </div>
                                                {badge.unlocked && (
                                                    <div style={{
                                                        marginTop: '6px', fontSize: '0.6rem',
                                                        background: `${badge.color}22`, color: badge.color,
                                                        padding: '2px 6px', borderRadius: '8px', fontWeight: '700'
                                                    }}>
                                                        Validé
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
