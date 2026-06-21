import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

import { useDashboardSelection } from '../useDashboardSelection';
import { EXERCISES } from '@config/exercises';
import { WEIGHT_EXERCISES } from '@config/weights';

const customExercises = [{ id: 'cust1', color: '#000', name: 'Custom 1' }];
const customExercisesMap = { cust1: customExercises[0] };
const userCatId = 'cat_1';
const exercisesByUserCategory = { [userCatId]: [{ id: 'uc_ex', name: 'UC Ex' }] };

const setup = (cat) => renderHook(() =>
  useDashboardSelection(cat, customExercises, customExercisesMap, exercisesByUserCategory)
);

describe('useDashboardSelection', () => {
  it('defaults to the first classic exercise for bodyweight', () => {
    const { result } = setup('bodyweight');
    expect(result.current.globalSelectedId).toBe(EXERCISES[0].id);
    expect(result.current.selectedExercise.id).toBe(EXERCISES[0].id);
  });

  it('returns the cardio pseudo-exercise for the cardio category', () => {
    const { result } = setup('cardio');
    expect(result.current.globalSelectedId).toBe('cardio');
    expect(result.current.selectedExercise.id).toBe('cardio');
  });

  it('selects within the weights category', () => {
    const { result } = setup('weights');
    expect(result.current.globalSelectedId).toBe(WEIGHT_EXERCISES[0].id);
    act(() => result.current.handleSelectExercise(WEIGHT_EXERCISES[1].id));
    expect(result.current.weightsSelected).toBe(WEIGHT_EXERCISES[1].id);
    expect(result.current.globalSelectedId).toBe(WEIGHT_EXERCISES[1].id);
  });

  it('selects within the custom category', () => {
    const { result } = setup('custom');
    expect(result.current.globalSelectedId).toBe('cust1');
    act(() => result.current.handleSelectExercise('cust1'));
    expect(result.current.customSelected).toBe('cust1');
  });

  it('selects within a user category and falls back to its first exercise', () => {
    const { result } = setup(userCatId);
    expect(result.current.globalSelectedId).toBe('uc_ex');
    act(() => result.current.handleSelectExercise('uc_ex'));
    expect(result.current.userCatSelected[userCatId]).toBe('uc_ex');
  });

  it('updates classic selection via handleSelectExercise', () => {
    const { result } = setup('bodyweight');
    act(() => result.current.handleSelectExercise(EXERCISES[1].id));
    expect(result.current.classicSelected).toBe(EXERCISES[1].id);
  });
});
