import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalHeader, SegmentedControl, Stack, ModalContainer } from '@components/ui';
import { CategoryManagerView } from './custom/CategoryManagerView';
import { ExercisesManagerView } from './custom/ExercisesManagerView';

export function CustomDataManagerModal({ 
  onClose, 
  initialTab = 'categories', 
  initialView = 'list', 
  customCategoriesHook, 
  customExercisesHook,
  exercisesByUserCategory,
  defaultCustomExercises,
  computedStats,
  categoryId
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <ModalContainer open={true} onClose={onClose}>
      <ModalHeader title={t('common.customContent')} onClose={onClose} />
        
      <Stack style={{ flex: 1, overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ padding: '0 var(--space-4)', width: '100%', maxWidth: '440px', margin: '0 auto' }}>
          <SegmentedControl
            fullWidth
            variant="tabs"
            options={[
              { id: 'categories', label: t('common.categories') },
              { id: 'exercises', label: t('common.exercises') }
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'categories' ? (
          <CategoryManagerView 
            onClose={onClose}
            customCategoriesHook={customCategoriesHook}
            exercisesByUserCategory={exercisesByUserCategory}
            defaultCustomExercises={defaultCustomExercises}
            computedStats={computedStats}
          />
        ) : (
          <ExercisesManagerView 
            onClose={onClose}
            customExercisesHook={customExercisesHook}
            customCategoriesHook={customCategoriesHook}
            computedStats={computedStats}
            categoryId={categoryId}
            initialView={initialView}
          />
        )}
      </Stack>
    </ModalContainer>
  );
}
