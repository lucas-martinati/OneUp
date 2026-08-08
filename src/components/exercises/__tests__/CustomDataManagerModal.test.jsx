import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';

vi.mock('react-i18next', () => ({ 
  useTranslation: () => ({ 
    t: (k, o) => (o ? `${k}` : k), 
    i18n: { language: 'en' } 
  }) 
}));
vi.mock('@hooks/useBackHandler', () => ({ useBackHandler: vi.fn() }));
vi.mock('@store/useExercisesStore', () => ({ MAX_EXERCISES_PER_CATEGORY: 3 }));
vi.mock('@components/ui/SegmentedControl', () => ({
  SegmentedControl: ({ options, value, onChange }) => (
    <div data-testid="segmented-control">
      {options.map(opt => (
        <button 
          key={opt.id} 
          onClick={() => onChange(opt.id)}
          data-active={value === opt.id}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}));

import { CustomDataManagerModal } from '../CustomDataManagerModal';

function makeHooks(exercises = [], categories = [], max = 10) {
  return {
    customExercisesHook: {
      customExercises: exercises,
      saveCustomExercise: vi.fn(() => true),
      updateCustomExercise: vi.fn(),
      deleteCustomExercise: vi.fn(),
      maxCustomExercises: max,
    },
    customCategoriesHook: { 
      customCategories: [{ id: 'custom', name: 'Custom', color: '#34d399' }, ...categories],
      addCategory: vi.fn(() => true),
      updateCategory: vi.fn(),
      deleteCategory: vi.fn(),
      reorderCategories: vi.fn(),
      maxCustomCategories: 10
    },
    exercisesByUserCategory: categories.reduce((acc, cat) => {
      acc[cat.id] = exercises.filter(e => e.categoryId === cat.id);
      return acc;
    }, { 'custom': exercises.filter(e => e.categoryId === 'custom') })
  };
}

function renderModal(over = {}) {
  const hooks = over.hooks || makeHooks();
  const onClose = vi.fn();
  const utils = render(
    <CustomDataManagerModal
      onClose={onClose}
      initialTab={over.initialTab || 'categories'}
      customExercisesHook={hooks.customExercisesHook}
      customCategoriesHook={hooks.customCategoriesHook}
      exercisesByUserCategory={hooks.exercisesByUserCategory}
      computedStats={over.computedStats || { exerciseReps: {} }}
      categoryId={over.categoryId}
    />
  );
  return { ...utils, hooks, onClose };
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe('CustomDataManagerModal — Layout & Tabs', () => {
  it('renders the modal header and both tabs', () => {
    const { getByText, getByTestId } = renderModal();
    expect(getByText('common.customContent')).toBeTruthy();
    expect(getByTestId('segmented-control')).toBeTruthy();
    expect(getByText('common.categories')).toBeTruthy();
    expect(getByText('common.exercises')).toBeTruthy();
  });

  it('switches between categories and exercises tabs', () => {
    const { getByText } = renderModal({ initialTab: 'categories' });
    
    // Tab "categories" should be active, meaning we see the Category create button
    expect(getByText('customCategories.create')).toBeTruthy();
    
    // Switch to exercises
    fireEvent.click(getByText('common.exercises'));
    
    // Tab "exercises" active, we see the Exercise create button
    expect(getByText('customExercises.create')).toBeTruthy();
  });
});

describe('CustomDataManagerModal — Categories', () => {
  it('lists existing categories including built-in "Custom"', () => {
    const { getByText } = renderModal();
    expect(getByText('Custom')).toBeTruthy();
  });

  it('allows creating a new category', () => {
    const { getByText, getByPlaceholderText, hooks } = renderModal();
    fireEvent.click(getByText('customCategories.create'));
    fireEvent.change(getByPlaceholderText('customCategories.namePlaceholder'), { target: { value: 'Pilates' } });
    fireEvent.click(getByText('common.save'));
    expect(hooks.customCategoriesHook.addCategory).toHaveBeenCalledWith(
      'Pilates',
      expect.any(String) // color
    );
  });

  it('allows editing a category', () => {
    const hooks = makeHooks([], [{ id: 'c1', name: 'Yoga', color: '#ff0000', icon: 'Star' }]);
    const { getByDisplayValue, getByText, getByLabelText, hooks: h } = renderModal({ hooks });
    
    // Click the edit button for Yoga
    fireEvent.click(getByLabelText('common.edit')); 
    
    expect(getByDisplayValue('Yoga')).toBeTruthy();
    fireEvent.change(getByDisplayValue('Yoga'), { target: { value: 'Advanced Yoga' } });
    fireEvent.click(getByText('common.save'));
    
    expect(h.customCategoriesHook.updateCategory).toHaveBeenCalledWith('c1', expect.objectContaining({ name: 'Advanced Yoga' }));
  });
});

describe('CustomDataManagerModal — Exercises', () => {
  const exercises = [{ id: 'e1', label: 'Plank', icon: 'Star', color: '#fff', type: 'timer', multiplier: 2, categoryId: 'custom' }];
  
  it('shows empty state when no exercises in selected category', () => {
    const { getByText } = renderModal({ initialTab: 'exercises' });
    expect(getByText('customExercises.empty')).toBeTruthy();
  });

  it('lists existing exercises of the category', () => {
    const hooks = makeHooks(exercises);
    const { getByText } = renderModal({ hooks, initialTab: 'exercises' });
    expect(getByText('Plank')).toBeTruthy();
  });

  it('saves a new exercise', () => {
    const { getByText, getByPlaceholderText, hooks } = renderModal({ initialTab: 'exercises' });
    fireEvent.click(getByText('customExercises.create'));
    fireEvent.change(getByPlaceholderText('customExercises.namePlaceholder'), { target: { value: 'Burpee' } });
    fireEvent.click(getByText('common.save'));
    expect(hooks.customExercisesHook.saveCustomExercise).toHaveBeenCalledWith(expect.objectContaining({ label: 'Burpee' }));
  });

  it('edits an exercise', () => {
    const hooks = makeHooks(exercises);
    const { getByDisplayValue, getByText, getByLabelText, hooks: h } = renderModal({ hooks, initialTab: 'exercises' });
    
    // Find the edit button for Plank
    fireEvent.click(getByLabelText('common.edit')); 

    expect(getByDisplayValue('Plank')).toBeTruthy();
    fireEvent.click(getByText('common.save'));
    expect(h.customExercisesHook.updateCustomExercise).toHaveBeenCalledWith('e1', expect.objectContaining({ label: 'Plank' }));
  });

  it('deletes an exercise after confirmation', () => {
    const hooks = makeHooks(exercises);
    const { getByText, getByLabelText, hooks: h } = renderModal({ 
      hooks, 
      initialTab: 'exercises',
      computedStats: { exerciseReps: { e1: 120 } } 
    });
    
    // Find delete button
    fireEvent.click(getByLabelText('common.delete'));

    expect(getByText('customExercises.deleteTitle')).toBeTruthy();
    fireEvent.click(getByText('common.delete'));
    expect(h.customExercisesHook.deleteCustomExercise).toHaveBeenCalledWith('e1');
  });
});
