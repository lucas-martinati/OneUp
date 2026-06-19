import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CATEGORIES, isUserCategory } from '@config/categories';
import { EXERCISES, EXERCISES_MAP } from '@config/exercises';
import { WEIGHT_EXERCISES, WEIGHT_EXERCISES_MAP } from '@config/weights';

export function useDashboardSelection(currentCatKey, customExercises, customExercisesMap, exercisesByUserCategory) {
    const { t } = useTranslation();

    const [classicSelected, setClassicSelected] = useState(EXERCISES[0]?.id);
    const [weightsSelected, setWeightsSelected] = useState(WEIGHT_EXERCISES[0]?.id);
    const [customSelected, setCustomSelected] = useState(customExercises[0]?.id || 'custom_placeholder');
    const [userCatSelected, setUserCatSelected] = useState({});

    const handleSelectExercise = (id) => {
        if (currentCatKey === CATEGORIES.BODYWEIGHT) setClassicSelected(id);
        else if (currentCatKey === CATEGORIES.WEIGHTS) setWeightsSelected(id);
        else if (currentCatKey === CATEGORIES.CUSTOM) setCustomSelected(id);
        else if (isUserCategory(currentCatKey)) setUserCatSelected(prev => ({ ...prev, [currentCatKey]: id }));
    };

    let globalSelectedId = customSelected;
    if (currentCatKey === CATEGORIES.CARDIO) {
        globalSelectedId = 'cardio';
    } else if (currentCatKey === CATEGORIES.BODYWEIGHT) {
        globalSelectedId = classicSelected;
    } else if (currentCatKey === CATEGORIES.WEIGHTS) {
        globalSelectedId = weightsSelected;
    } else if (isUserCategory(currentCatKey)) {
        globalSelectedId = userCatSelected[currentCatKey] || (exercisesByUserCategory[currentCatKey]?.[0]?.id || null);
    }
        
    const selectedExercise = useMemo(() => {
        if (currentCatKey === CATEGORIES.CARDIO) return { id: 'cardio', color: '#ef4444', gradient: ['#ef4444', '#dc2626'], icon: 'Heart', name: t('common.cardio') };
        if (currentCatKey === CATEGORIES.BODYWEIGHT) return EXERCISES_MAP[globalSelectedId] || EXERCISES[0];
        if (currentCatKey === CATEGORIES.WEIGHTS) return WEIGHT_EXERCISES_MAP[globalSelectedId] || WEIGHT_EXERCISES[0];
        return customExercisesMap[globalSelectedId] || customExercises[0] || { id: 'custom_placeholder', color: '#8b5cf6', gradient: ['#8b5cf6', '#7c3aed'], icon: 'Star', name: t('common.custom') };
    }, [currentCatKey, globalSelectedId, customExercises, customExercisesMap, t]);

    return {
        classicSelected,
        weightsSelected,
        customSelected,
        userCatSelected,
        globalSelectedId,
        selectedExercise,
        handleSelectExercise
    };
}
