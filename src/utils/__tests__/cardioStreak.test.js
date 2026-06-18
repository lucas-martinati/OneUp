import { describe, it, expect } from 'vitest';
import { evaluateCardioWeek } from '../cardioStreak';
import { getWeekBounds, getLocalDateStr } from '../dateUtils';

// Bornes de la semaine courante (weekOffset = 0) — calculées dynamiquement
// pour que les tests restent valides quelle que soit la date d'exécution.
const { start, end } = getWeekBounds(new Date());
const DAY_MS = 24 * 3600 * 1000;
const inWeek = start + DAY_MS; // mardi 00:00, toujours dans [start, end]

// challengeStartDate = aujourd'hui ⇒ getCurrentWeekNumber renvoie 1.
const today = getLocalDateStr(new Date());

// Objectif running semaine 1 = 450 m (WEEKLY_INCREMENT.running) × difficulté 1
// ⇒ 0.45 km. Marge d'arrondi : 0.01 km (10 m).

const runSession = (distanceM, atMs = inWeek) => ({
  type: 'running',
  distance: distanceM,
  startTime: atMs,
});

describe('evaluateCardioWeek', () => {
  it('renvoie le bon numéro de semaine (weekOffset = 0)', () => {
    const { weekNum } = evaluateCardioWeek([], 'running', 0, today, 1);
    expect(weekNum).toBe(1);
  });

  it('décrémente le numéro de semaine selon weekOffset', () => {
    const start14 = getLocalDateStr(new Date(Date.now() - 14 * DAY_MS));
    const base = evaluateCardioWeek([], 'running', 0, start14, 1).weekNum;
    const shifted = evaluateCardioWeek([], 'running', 1, start14, 1).weekNum;
    expect(shifted).toBe(base - 1);
  });

  it('atteint l’objectif quand la distance le dépasse', () => {
    const { achieved } = evaluateCardioWeek([runSession(500)], 'running', 0, today, 1);
    expect(achieved).toBe(true); // 0.5 km ≥ 0.45 km
  });

  it('n’atteint pas l’objectif quand la distance est insuffisante', () => {
    const { achieved } = evaluateCardioWeek([runSession(400)], 'running', 0, today, 1);
    expect(achieved).toBe(false); // 0.4 km < 0.45 km
  });

  it('applique la marge d’arrondi de 0.01 km', () => {
    // Objectif 0.45 km, seuil effectif 0.44 km.
    expect(evaluateCardioWeek([runSession(440)], 'running', 0, today, 1).achieved).toBe(true);
    expect(evaluateCardioWeek([runSession(435)], 'running', 0, today, 1).achieved).toBe(false);
  });

  it('additionne plusieurs sessions de la semaine', () => {
    const sessions = [runSession(200), runSession(300)];
    const { achieved } = evaluateCardioWeek(sessions, 'running', 0, today, 1);
    expect(achieved).toBe(true); // 0.2 + 0.3 = 0.5 km ≥ 0.45 km
  });

  it('traite une session sans distance comme 0 (pas de NaN)', () => {
    const sessions = [
      { type: 'running', startTime: inWeek }, // distance absente
      runSession(500),
    ];
    const { achieved } = evaluateCardioWeek(sessions, 'running', 0, today, 1);
    expect(achieved).toBe(true); // 0 + 0.5 km ≥ 0.45 km, sans NaN
  });

  it('ignore les sessions d’un autre mode', () => {
    const sessions = [
      { type: 'cycling', distance: 5000, startTime: inWeek },
      runSession(100),
    ];
    const { achieved } = evaluateCardioWeek(sessions, 'running', 0, today, 1);
    expect(achieved).toBe(false); // seuls les 0.1 km de running comptent
  });

  it('ignore les sessions hors de la fenêtre de la semaine', () => {
    const before = runSession(1000, start - 1000); // 1 s avant le lundi 00:00
    const after = runSession(1000, end + 1000); // après le dimanche 23:59
    const { achieved } = evaluateCardioWeek([before, after], 'running', 0, today, 1);
    expect(achieved).toBe(false); // aucune distance comptabilisée
  });

  it('multiplie l’objectif par la difficulté courante', () => {
    // difficulté 2 ⇒ objectif 0.9 km : 0.5 km ne suffit plus.
    const { achieved } = evaluateCardioWeek([runSession(500)], 'running', 0, today, 2);
    expect(achieved).toBe(false);
  });

  it('utilise la difficulté enregistrée dans les complétions plutôt que la difficulté courante', () => {
    const mondayStr = getLocalDateStr(new Date(start));
    const completions = {
      [mondayStr]: { running: { isCompleted: true, difficulty: 3 } },
    };
    // Objectif = 0.45 × 3 = 1.35 km, malgré currentDifficulty = 1.
    const { achieved } = evaluateCardioWeek([runSession(500)], 'running', 0, today, 1, completions);
    expect(achieved).toBe(false);
  });

  it('considère l’objectif atteint pour un mode sans objectif défini', () => {
    // 'swimming' absent de WEEKLY_INCREMENT ⇒ objectif 0 ⇒ atteint sans distance.
    const { achieved } = evaluateCardioWeek([], 'swimming', 0, today, 1);
    expect(achieved).toBe(true);
  });
});
