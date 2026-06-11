import React, { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { CATEGORIES, CATEGORY_COLORS, isUserCategory } from '../../config/categories';
import { EXERCISES, EXERCISES_MAP } from '../../config/exercises';
import { WEIGHT_EXERCISES, WEIGHT_EXERCISES_MAP } from '../../config/weights';
import { canAccessFeature, FEATURES } from '../../utils/entitlements';

import { DashboardSlide } from './DashboardSlide';
import { ProPaywall } from './ProPaywall';

import { useProgressStore } from '../../store/useProgressStore';
import { useCloudSyncStore } from '../../store/useCloudSyncStore';
import { useComputedStatsStore } from '../../store/useComputedStatsStore';
import { useUIStore } from '../../store/useUIStore';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useExercises } from '../../contexts/ExercisesContext';
import { useExerciseConfig } from '../../hooks/useExerciseConfig';

const CardioModule = lazy(() => import('../../features/cardio/CardioModule').then(m => ({ default: m.CardioModule })));

export function DashboardSlideRenderer({
    fullCategoryOrder,
    renderedSlides,
    isFuture, effectiveStart, dayNumber, today,
    isCounterTransitioning, prevDayNumber,
    classicSelected, weightsSelected, customSelected, userCatSelected, handleSelectExercise,
    hackActive,
    customCategories
}) {
    const { t } = useTranslation();
    const getExerciseCount = useProgressStore(s => s.getExerciseCount);
    const completions = useProgressStore(s => s.completions);
    const pauseCloudSync = useCloudSyncStore(s => s.pauseCloudSync);
    const computedStats = useComputedStatsStore(s => s.stats);
    const openModal = useUIStore(s => s.openModal);
    const openStore = useUIStore(s => s.openStore);
    const openCustomExercises = useUIStore(s => s.openCustomExercises);
    const setShowCounter = (v) => v && openModal('counter');
    const { getConfig } = useExerciseConfig();
    const { isPro } = useSubscription();
    const {
        defaultCustomExercises, customExercisesMap,
        exercisesByUserCategory, exercisesMapByUserCategory
    } = useExercises();

    return fullCategoryOrder.map((catKey, i) => {
        const isRendered = renderedSlides.has(i);
        if (!isRendered) {
            return <div key={catKey} className="dashboard-slide-container" data-slide-index={i} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}></div>;
        }

        if (catKey === CATEGORIES.CARDIO) {
            return (
                <div key={catKey} className="dashboard-slide-container" data-slide-index={i} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                    <Suspense fallback={null}>
                        <CardioModule />
                    </Suspense>
                </div>
            );
        }

        if (catKey === CATEGORIES.BODYWEIGHT) {
            return (
                <div key={catKey} className="dashboard-slide-container" data-slide-index={i} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                    <DashboardSlide
                        isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today}
                        getExerciseCount={getExerciseCount} completions={completions} computedStats={computedStats}
                        isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber}
                        pauseCloudSync={pauseCloudSync} setShowCounter={setShowCounter}
                        activeExerciseId={classicSelected} onSelectExercise={handleSelectExercise}
                        exercisesList={EXERCISES} exercisesMap={EXERCISES_MAP}
                        isDay100={hackActive}
                        getConfig={getConfig}
                    />
                </div>
            );
        }

        if (catKey === CATEGORIES.WEIGHTS) {
            return (
                <div key={catKey} className="dashboard-slide-container" data-slide-index={i} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                    {canAccessFeature(FEATURES.WEIGHTS, { isPro }) ? (
                        <DashboardSlide
                            title={t('common.weights')}
                            categoryColor={CATEGORY_COLORS[CATEGORIES.WEIGHTS]}
                            isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today}
                            getExerciseCount={getExerciseCount} completions={completions} computedStats={computedStats}
                            isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber}
                            pauseCloudSync={pauseCloudSync} setShowCounter={setShowCounter}
                            activeExerciseId={weightsSelected} onSelectExercise={handleSelectExercise}
                            exercisesList={WEIGHT_EXERCISES} exercisesMap={WEIGHT_EXERCISES_MAP}
                            isDay100={hackActive}
                            getConfig={getConfig}
                        />
                    ) : (
                        <ProPaywall
                            title={t('common.weights')}
                            onOpenStore={openStore}
                        />
                    )}
                </div>
            );
        }

        if (catKey === CATEGORIES.CUSTOM) {
            const catDef = customCategories.find(c => c.id === catKey);
            const title = catDef?.name || t('common.custom');
            const color = catDef?.color || CATEGORY_COLORS[CATEGORIES.CUSTOM];

            return (
                <div key={catKey} className="dashboard-slide-container" data-slide-index={i} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                    {canAccessFeature(FEATURES.CUSTOM_EXERCISES, { isPro }) ? (
                        <DashboardSlide
                            title={title}
                            categoryColor={color}
                            isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today}
                            getExerciseCount={getExerciseCount} completions={completions} computedStats={computedStats}
                            isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber}
                            pauseCloudSync={pauseCloudSync} setShowCounter={setShowCounter}
                            activeExerciseId={customExercisesMap[customSelected] ? customSelected : (defaultCustomExercises[0]?.id || null)} onSelectExercise={handleSelectExercise}
                            exercisesList={defaultCustomExercises} exercisesMap={customExercisesMap}
                            onManageCustom={() => { openCustomExercises(null); pauseCloudSync?.(); }}
                            onManageCategories={() => { openModal('categoryManager'); }}
                            isDay100={hackActive}
                            getConfig={getConfig}
                        />
                    ) : (
                        <ProPaywall
                            title={title}
                            onOpenStore={openStore}
                        />
                    )}
                </div>
            );
        }

        // User-created custom categories
        if (isUserCategory(catKey)) {
            const catDef = customCategories.find(c => c.id === catKey);
            if (!catDef) return null;
            const catExercises = exercisesByUserCategory[catKey] || [];
            const catExMap = exercisesMapByUserCategory[catKey] || {};
            const selId = userCatSelected[catKey] || catExercises[0]?.id || null;
            return (
                <div key={catKey} className="dashboard-slide-container" data-slide-index={i} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                    {canAccessFeature(FEATURES.CUSTOM_CATEGORIES, { isPro }) ? (
                        <DashboardSlide
                            title={catDef.name}
                            categoryColor={catDef.color}
                            isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today}
                            getExerciseCount={getExerciseCount} completions={completions} computedStats={computedStats}
                            isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber}
                            pauseCloudSync={pauseCloudSync} setShowCounter={setShowCounter}
                            activeExerciseId={selId} onSelectExercise={handleSelectExercise}
                            exercisesList={catExercises} exercisesMap={catExMap}
                            onManageCustom={() => { openCustomExercises(catKey); pauseCloudSync?.(); }}
                            isDay100={hackActive}
                            getConfig={getConfig}
                        />
                    ) : (
                        <ProPaywall
                            title={catDef.name}
                            onOpenStore={openStore}
                        />
                    )}
                </div>
            );
        }

        return null;
    });
}
