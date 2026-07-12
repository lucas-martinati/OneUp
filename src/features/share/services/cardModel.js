import { CATEGORIES, buildFullCategoryOrder, buildFullCategoryColors, isUserCategory } from '@config/categories';
import { EXERCISES, CARDIO_EXERCISES, getDailyGoal, isCardioExercise, isWeightExercise } from '@config/exercises';
import { WEIGHT_EXERCISES } from '@config/weights';
import { isCustomExercise } from '@utils/exerciseLabel';
import { sumExerciseReps } from '@utils/stats';
import { getLocalDateStr, getCurrentWeekNumber, parseLocalDate } from '@shared/dateUtils';

/**
 * Card geometry — the card renders at a fixed logical width and snaps its
 * height to the smallest flattering ratio that fits the content. Exported
 * at pixelRatio 2, so 540 logical px → 1080 px, the social-network standard.
 */
export const CARD_WIDTH = 540;

export const CARD_FORMATS = [
  { key: '1:1', height: 540 },
  { key: '4:5', height: 675 },
  { key: '9:16', height: 960 },
];

/**
 * Smallest standard format whose height fits the measured content height.
 * Beyond 9:16 the card grows freely: nothing is ever truncated.
 */
export function resolveCardFormat(naturalHeight) {
  const fmt = CARD_FORMATS.find(f => f.height >= naturalHeight);
  return fmt || { key: '>9:16', height: naturalHeight };
}

/**
 * Presentation density for the exercise blocks. Content is always complete;
 * only the layout compresses as the number of items grows.
 */
export function getExerciseDensity(count) {
  if (count <= 4) return 'detailed';
  if (count <= 12) return 'grid';
  return 'compact';
}

const isWeightEx = (ex) => isWeightExercise(ex.id);
const isCardioEx = (ex) => isCardioExercise(ex.id);

/**
 * buildCardModel — pure data preparation for the ShareCard.
 * Takes raw session/stats data + display options and returns everything the
 * card renders: theme, categorized exercise sections, daily sections
 * (global mode), aggregated metrics and presentation density.
 *
 * `t` is only used to resolve category labels; pass an identity fn in tests.
 */
export function buildCardModel({
  mode = 'session',
  options = {},
  isPro = false,
  sessionData,
  stats = {},
  completions,
  getDayNumber,
  settings,
  customCategories = [],
  exercisesByUserCategory = {},
  customExercises = [],
  getConfig,
  t = (k) => k,
}) {
  const isGlobal = mode === 'global';
  const fullCategoryOrder = buildFullCategoryOrder(customCategories);
  const fullCategoryColors = buildFullCategoryColors(customCategories);

  const allExercises = (sessionData?.exercises || []).map(ex => ({
    ...ex,
    difficulty: ex.difficulty || (getConfig ? getConfig(ex.id, sessionData?.date).difficulty : 1.0)
  }));
  const sessionType = sessionData?.type || CATEGORIES.BODYWEIGHT;

  let activeThemeKey = (isPro && options.theme) || 'dark';
  let dailyExercises = [];
  let dailyStandardDone = false;
  let dailyWeightsDone = false;

  if (isGlobal && options.showDailyExercises && completions) {
    const targetDate = options.globalDate || new Date().toISOString().split('T')[0];
    const dayNum = getDayNumber ? getDayNumber(targetDate) : 1;
    const dayData = completions[targetDate];
    if (dayData) {
      const allKnownExercisesMap = {};
      [...EXERCISES, ...WEIGHT_EXERCISES, ...CARDIO_EXERCISES, ...(customExercises || [])].forEach(e => {
        allKnownExercisesMap[e.id] = e;
      });
      for (const [exId, exStats] of Object.entries(dayData)) {
        if (exStats?.isCompleted) {
          const knownEx = allKnownExercisesMap[exId];
          if (knownEx && !isCardioExercise(exId)) {
            const conf = getConfig(exId, targetDate);
            dailyExercises.push({
              ...knownEx,
              reps: exStats.count || getDailyGoal(knownEx, dayNum, conf.difficulty) || knownEx.reps || 0,
              weight: exStats.weight,
              difficulty: conf.difficulty
            });
          }
        }
      }

      // Special handling for Cardio: if done anytime in the week, show it as done
      for (const cardio of CARDIO_EXERCISES) {
        let isDoneInWeek = false;
        let weekDate = null;

        // Look back until previous Monday to find if done in CURRENT week
        const targetD = parseLocalDate(targetDate);
        const dayOfWeek = targetD.getDay(); // 0 is Sunday
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        for (let i = 0; i <= daysSinceMonday; i++) {
          const checkDate = parseLocalDate(targetDate);
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = getLocalDateStr(checkDate);
          if (completions[dateStr]?.[cardio.id]?.isCompleted) {
            isDoneInWeek = true;
            weekDate = dateStr;
            break;
          }
        }

        if (isDoneInWeek) {
          const conf = getConfig(cardio.id, weekDate);
          const weekNum = getCurrentWeekNumber(settings?.startDate || stats?.firstActiveDate, parseLocalDate(targetDate));
          dailyExercises.push({
            ...cardio,
            reps: getDailyGoal(cardio, weekNum, conf.difficulty, true),
            difficulty: conf.difficulty
          });
        }
      }

      dailyStandardDone = EXERCISES.every(ex => dayData[ex.id]?.isCompleted);
      dailyWeightsDone = WEIGHT_EXERCISES.length > 0 && WEIGHT_EXERCISES.every(ex => dayData[ex.id]?.isCompleted);

      if (dailyStandardDone || dailyWeightsDone) {
        activeThemeKey = 'gold';
      }
    }
  }

  // Determine the actual category of an exercise, including user-created categories
  const getExCategory = (ex) => {
    if (isWeightEx(ex)) return CATEGORIES.WEIGHTS;
    if (isCardioEx(ex)) return CATEGORIES.CARDIO;
    if (exercisesByUserCategory) {
      for (const catId of Object.keys(exercisesByUserCategory)) {
        if (exercisesByUserCategory[catId].some(e => e.id === ex.id)) return catId;
      }
    }
    if (isCustomExercise(ex.id)) return CATEGORIES.CUSTOM;
    // Fallback: if it's not a known bodyweight exercise and sessionType is custom
    if (!isWeightEx(ex) && sessionType === CATEGORIES.CUSTOM) return CATEGORIES.CUSTOM;
    return CATEGORIES.BODYWEIGHT;
  };

  const isCustomEx = (ex) => {
    const cat = getExCategory(ex);
    return cat === CATEGORIES.CUSTOM || isUserCategory(cat);
  };

  const hasSeparableEx = allExercises.some(ex =>
    isWeightEx(ex) || isCustomEx(ex) || isCardioEx(ex) || isUserCategory(getExCategory(ex)));
  const showCategoriesSeparately = options.showWeights && hasSeparableEx;

  const bodyweightExercises = showCategoriesSeparately
    ? allExercises.filter(ex => getExCategory(ex) === CATEGORIES.BODYWEIGHT)
    : allExercises;

  const customCategoriesMapForModel = {};
  if (customCategories) {
    customCategories.forEach(c => {
      customCategoriesMapForModel[c.id] = c;
    });
  }

  // Category label: custom name if defined, otherwise raw key (user category)
  // or translation (standard category).
  const getCategoryLabel = (key) => {
    const catDef = customCategoriesMapForModel[key];
    if (catDef?.name) return catDef.name;
    return isUserCategory(key) ? key : t(`common.${key}`);
  };

  const categories = fullCategoryOrder.map(key => {
    let exList = [];
    if (key === CATEGORIES.BODYWEIGHT) exList = bodyweightExercises;
    else if (key === CATEGORIES.WEIGHTS) exList = allExercises.filter(isWeightEx);
    else if (key === CATEGORIES.CUSTOM) exList = allExercises.filter(ex => getExCategory(ex) === CATEGORIES.CUSTOM);
    else if (key === CATEGORIES.CARDIO) exList = allExercises.filter(isCardioEx);
    else if (isUserCategory(key)) exList = allExercises.filter(ex => getExCategory(ex) === key);
    if (exList.length === 0) return null;
    return { key, exercises: exList, label: getCategoryLabel(key), color: fullCategoryColors[key] };
  }).filter(Boolean);
  const showSections = showCategoriesSeparately && categories.length > 1;

  const selectedCats = isGlobal
    ? (options.statsCategories || Object.values(CATEGORIES))
    : Object.values(CATEGORIES);

  const filteredDailyExercises = isGlobal
    ? dailyExercises.filter(ex => selectedCats.includes(getExCategory(ex)))
    : dailyExercises;

  // Categorize daily exercises (global mode)
  const shouldSeparateDaily = filteredDailyExercises.some(ex =>
    isWeightEx(ex) || isCustomEx(ex) || isCardioEx(ex) || isUserCategory(getExCategory(ex)));

  const dailyCategories = fullCategoryOrder.map(key => {
    let exList = [];
    let isPerfect = false;
    if (key === CATEGORIES.BODYWEIGHT) {
      exList = shouldSeparateDaily ? filteredDailyExercises.filter(ex => getExCategory(ex) === CATEGORIES.BODYWEIGHT) : filteredDailyExercises;
      isPerfect = dailyStandardDone;
    } else if (key === CATEGORIES.WEIGHTS) {
      exList = shouldSeparateDaily ? filteredDailyExercises.filter(isWeightEx) : [];
      isPerfect = dailyWeightsDone;
    } else if (key === CATEGORIES.CUSTOM) {
      exList = shouldSeparateDaily ? filteredDailyExercises.filter(ex => getExCategory(ex) === CATEGORIES.CUSTOM) : [];
    } else if (key === CATEGORIES.CARDIO) {
      exList = shouldSeparateDaily ? filteredDailyExercises.filter(isCardioEx) : [];
    } else if (isUserCategory(key)) {
      exList = shouldSeparateDaily ? filteredDailyExercises.filter(ex => getExCategory(ex) === key) : [];
    }
    if (exList.length === 0) return null;
    return { key, exercises: exList, label: getCategoryLabel(key), color: fullCategoryColors[key], isPerfect };
  }).filter(Boolean);
  const showDailySections = shouldSeparateDaily && dailyCategories.length > 1;

  // For global mode, recompute top metrics restricted to the selected categories
  const filteredStats = isGlobal ? (() => {
    let totalReps = 0;
    let exerciseCount = 0;

    if (stats && stats.exerciseStats && stats.exerciseStats.length > 0) {
      const countedIds = new Set();
      for (const ex of stats.exerciseStats) {
        if (ex.totalReps > 0 && ex.id) {
          const cat = getExCategory(ex);
          if (selectedCats.includes(cat)) {
            totalReps += ex.totalReps;
            if (!countedIds.has(ex.id)) {
              countedIds.add(ex.id);
              exerciseCount++;
            }
          }
        }
      }
      if (selectedCats.includes(CATEGORIES.CARDIO)) {
        totalReps += ((stats?.exerciseReps?.['running'] || 0) + (stats?.exerciseReps?.['cycling'] || 0));
      }
    } else if (stats?.globalTotalReps) {
      totalReps = stats.globalTotalReps;
      const countedIds = new Set();
      if (stats.exerciseStats) {
        for (const ex of stats.exerciseStats) {
          if (ex.totalReps > 0 && ex.id) {
            const cat = getExCategory(ex);
            if (selectedCats.includes(cat) && !countedIds.has(ex.id)) {
              countedIds.add(ex.id);
              exerciseCount++;
            }
          }
        }
      }
      if (exerciseCount === 0) {
        exerciseCount = stats.exerciseStats?.filter(ex => ex.totalReps > 0).length || 0;
      }
    }
    return { totalReps, exerciseCount };
  })() : null;

  // Filtered categories shown as chips under the "global stats" label
  const chipCats = isGlobal
    ? fullCategoryOrder.filter(c => selectedCats.includes(c))
    : [];
  const allCatsSelected = chipCats.length === fullCategoryOrder.length;

  const exerciseItemCount = isGlobal
    ? filteredDailyExercises.length
    : allExercises.length;

  return {
    isGlobal,
    activeThemeKey,
    allExercises,
    categories,
    showSections,
    dailyCategories,
    showDailySections,
    filteredDailyExercises,
    categoryChips: allCatsSelected ? [] : chipCats.map(key => ({
      key,
      label: getCategoryLabel(key),
      color: fullCategoryColors[key] || '#818cf8',
    })),
    density: getExerciseDensity(exerciseItemCount),
    totalReps: isGlobal ? (filteredStats?.totalReps || 0) : sumExerciseReps(allExercises),
    duration: sessionData?.duration || 0,
    streak: stats?.displayStreak || 0,
    streakActive: stats?.streakActive || false,
    exerciseCount: isGlobal ? (filteredStats?.exerciseCount || 0) : allExercises.length,
    totalDays: isGlobal ? (stats?.totalDays || 0) : 0,
    maxStreak: stats?.maxStreak || 0,
  };
}
