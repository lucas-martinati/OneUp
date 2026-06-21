import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k, o) => (o ? `${k}` : k), i18n: { language: 'en' } }) }));
vi.mock('@hooks/useBackHandler', () => ({ useBackHandler: vi.fn() }));
vi.mock('@store/useExercisesStore', () => ({ MAX_EXERCISES_PER_CATEGORY: 3 }));

import { CustomExercisesModal } from '../CustomExercisesModal';

function makeHooks(exercises = [], max = 10) {
  return {
    customExercisesHook: {
      customExercises: exercises,
      saveCustomExercise: vi.fn(() => true),
      updateCustomExercise: vi.fn(),
      deleteCustomExercise: vi.fn(),
      maxCustomExercises: max,
    },
    customCategoriesHook: { customCategories: [{ id: 'custom', name: 'Custom', color: '#34d399' }] },
  };
}

function renderModal(over = {}) {
  const hooks = over.hooks || makeHooks();
  const onClose = vi.fn();
  const utils = render(
    <CustomExercisesModal
      onClose={onClose}
      customExercisesHook={hooks.customExercisesHook}
      customCategoriesHook={hooks.customCategoriesHook}
      computedStats={over.computedStats || { exerciseReps: {} }}
      categoryId={over.categoryId}
    />
  );
  return { ...utils, hooks, onClose };
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe('CustomExercisesModal — list', () => {
  it('shows the empty state when there are no exercises', () => {
    const { getByText } = renderModal();
    expect(getByText('customExercises.empty')).toBeTruthy();
  });

  it('lists existing exercises of the category', () => {
    const hooks = makeHooks([{ id: 'e1', label: 'Plank', icon: 'Star', color: '#fff', type: 'timer', multiplier: 2, categoryId: 'custom' }]);
    const { getByText } = renderModal({ hooks });
    expect(getByText('Plank')).toBeTruthy();
  });

  it('shows the limit message when at capacity', () => {
    const exs = Array.from({ length: 3 }, (_, i) => ({ id: `e${i}`, label: `Ex${i}`, icon: 'Star', color: '#fff', type: 'counter', multiplier: 1, categoryId: 'custom' }));
    const { getByText } = renderModal({ hooks: makeHooks(exs, 3) });
    expect(getByText('customExercises.limitReached')).toBeTruthy();
  });
});

describe('CustomExercisesModal — create', () => {
  it('requires a name before saving', () => {
    const { getByText } = renderModal();
    fireEvent.click(getByText('customExercises.create'));
    fireEvent.click(getByText('common.save'));
    expect(getByText('customExercises.errorNameRequired')).toBeTruthy();
  });

  it('saves a new exercise with the entered name', () => {
    const { getByText, getByPlaceholderText, hooks } = renderModal();
    fireEvent.click(getByText('customExercises.create'));
    fireEvent.change(getByPlaceholderText('customExercises.namePlaceholder'), { target: { value: 'Burpee' } });
    fireEvent.click(getByText('common.save'));
    expect(hooks.customExercisesHook.saveCustomExercise).toHaveBeenCalledWith(expect.objectContaining({ label: 'Burpee' }));
  });

  it('shows the limit error when the store rejects the save', () => {
    const hooks = makeHooks();
    hooks.customExercisesHook.saveCustomExercise.mockReturnValue(false);
    const { getByText, getByPlaceholderText } = renderModal({ hooks });
    fireEvent.click(getByText('customExercises.create'));
    fireEvent.change(getByPlaceholderText('customExercises.namePlaceholder'), { target: { value: 'X' } });
    fireEvent.click(getByText('common.save'));
    expect(getByText('customExercises.errorLimit')).toBeTruthy();
  });
});

describe('CustomExercisesModal — edit & delete', () => {
  const exHook = () => makeHooks([{ id: 'e1', label: 'Plank', icon: 'Star', color: '#8b5cf6', type: 'timer', multiplier: 2, categoryId: 'custom' }]);

  // Button order in the list view: [close, edit, delete, create]
  it('edits an existing exercise', () => {
    const hooks = exHook();
    const { container, getByText, getByDisplayValue, hooks: h } = renderModal({ hooks });
    const buttons = [...container.querySelectorAll('button')];
    fireEvent.click(buttons[1]); // edit
    expect(getByDisplayValue('Plank')).toBeTruthy();
    fireEvent.click(getByText('common.save'));
    expect(h.customExercisesHook.updateCustomExercise).toHaveBeenCalledWith('e1', expect.objectContaining({ label: 'Plank' }));
  });

  it('deletes an exercise after confirmation', () => {
    const hooks = exHook();
    const { container, getByText, hooks: h } = renderModal({ hooks, computedStats: { exerciseReps: { e1: 120 } } });
    const buttons = [...container.querySelectorAll('button')];
    fireEvent.click(buttons[2]); // delete
    expect(getByText('customExercises.deleteTitle')).toBeTruthy();
    fireEvent.click(getByText('common.delete'));
    expect(h.customExercisesHook.deleteCustomExercise).toHaveBeenCalledWith('e1');
  });
});
