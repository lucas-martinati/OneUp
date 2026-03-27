import { useState, useEffect, useCallback } from 'react';
import { getLocalDateStr } from '../utils/dateUtils';

const STORAGE_KEY = 'oneup_custom_programs';
const MAX_PROGRAMS = 5;

/**
 * Hook for managing custom workout programs (Pro feature).
 *
 * Each program: {
 *   id, name, description, exerciseIds[],
 *   dailyGoals: { [exerciseId]: repsPerDay },
 *   duration, startDate, status,
 *   createdAt
 * }
 *
 * Status: 'draft' | 'active' | 'paused' | 'completed'
 *
 * Completions stored separately: { [dateStr]: { [exerciseId]: boolean } }
 */
export function useCustomPrograms() {
  const [programs, setPrograms] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [completions, setCompletions] = useState(() => {
    try {
      const saved = localStorage.getItem('oneup_custom_program_completions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Persist programs to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
  }, [programs]);

  // Persist completions to localStorage
  useEffect(() => {
    localStorage.setItem('oneup_custom_program_completions', JSON.stringify(completions));
  }, [completions]);

  const saveProgram = useCallback((programData) => {
    if (!programData?.name?.trim()) return null;
    if (!programData?.exerciseIds?.length) return null;

    setPrograms((prev) => {
      if (prev.length >= MAX_PROGRAMS) return prev;
      const newProgram = {
        id: crypto.randomUUID(),
        name: programData.name.trim(),
        description: programData.description?.trim() || '',
        exerciseIds: [...programData.exerciseIds],
        dailyGoals: { ...programData.dailyGoals } || {},
        duration: programData.duration || 30,
        startDate: programData.startDate || null,
        status: 'draft',
        createdAt: Date.now(),
      };
      return [...prev, newProgram];
    });
    return true;
  }, []);

  const updateProgram = useCallback((id, updates) => {
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      )
    );
  }, []);

  const deleteProgram = useCallback((id) => {
    setPrograms((prev) => prev.filter((p) => p.id !== id));
    setCompletions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const startProgram = useCallback((id) => {
    const today = getLocalDateStr(new Date());
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: 'active', startDate: p.startDate || today }
          : p
      )
    );
  }, []);

  const pauseProgram = useCallback((id) => {
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'paused' } : p
      )
    );
  }, []);

  const resumeProgram = useCallback((id) => {
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: 'active' } : p
      )
    );
  }, []);

  const toggleProgramExerciseCompletion = useCallback((programId, dateStr, exerciseId) => {
    setCompletions((prev) => {
      const programCompletions = prev[programId] || {};
      const dayCompletions = programCompletions[dateStr] || {};
      return {
        ...prev,
        [programId]: {
          ...programCompletions,
          [dateStr]: {
            ...dayCompletions,
            [exerciseId]: !dayCompletions[exerciseId],
          },
        },
      };
    });
  }, []);

  const getProgramDayNumber = useCallback((program, dateStr) => {
    if (!program?.startDate) return 0;
    const start = new Date(program.startDate);
    const current = new Date(dateStr);
    const diff = Math.floor((current - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff) + 1;
  }, []);

  const isProgramExerciseDone = useCallback((programId, dateStr, exerciseId) => {
    return completions[programId]?.[dateStr]?.[exerciseId] || false;
  }, [completions]);

  const getProgramStreak = useCallback((programId) => {
    const programCompletions = completions[programId];
    if (!programCompletions) return 0;

    const sortedDates = Object.keys(programCompletions).sort().reverse();
    let streak = 0;
    const today = getLocalDateStr(new Date());

    for (let i = 0; i < sortedDates.length; i++) {
      const dateStr = sortedDates[i];
      const dayData = programCompletions[dateStr];
      if (dayData && Object.values(dayData).some(Boolean)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [completions]);

  const getProgramStats = useCallback((programId) => {
    const programCompletions = completions[programId];
    if (!programCompletions) {
      return { totalDays: 0, perfectDays: 0, totalReps: 0, completionRate: 0 };
    }

    const dates = Object.keys(programCompletions);
    let perfectDays = 0;
    let totalCompleted = 0;
    let totalPossible = 0;

    dates.forEach((dateStr) => {
      const dayData = programCompletions[dateStr];
      const dayEntries = Object.values(dayData || {});
      const completed = dayEntries.filter(Boolean).length;
      const total = dayEntries.length;
      totalCompleted += completed;
      totalPossible += total;
      if (total > 0 && completed === total) perfectDays++;
    });

    return {
      totalDays: dates.length,
      perfectDays,
      totalCompleted,
      completionRate: totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
    };
  }, [completions]);

  const setProgramsFromCloud = useCallback((cloudPrograms) => {
    if (Array.isArray(cloudPrograms)) {
      setPrograms(cloudPrograms);
    }
  }, []);

  const setCompletionsFromCloud = useCallback((programId, cloudCompletions) => {
    if (cloudCompletions && typeof cloudCompletions === 'object') {
      setCompletions((prev) => ({
        ...prev,
        [programId]: cloudCompletions,
      }));
    }
  }, []);

  return {
    programs,
    completions,
    saveProgram,
    updateProgram,
    deleteProgram,
    startProgram,
    pauseProgram,
    resumeProgram,
    toggleProgramExerciseCompletion,
    getProgramDayNumber,
    isProgramExerciseDone,
    getProgramStreak,
    getProgramStats,
    setProgramsFromCloud,
    setCompletionsFromCloud,
    maxPrograms: MAX_PROGRAMS,
  };
}
