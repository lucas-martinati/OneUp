import { describe, it, expect } from 'vitest';
import { sanitizeForCloud, mergeData } from '../syncUtils';

describe('syncUtils', () => {
  describe('sanitizeForCloud', () => {
    it('returns falsy or object without completions as is', () => {
      expect(sanitizeForCloud(null)).toBeNull();
      expect(sanitizeForCloud({ foo: 'bar' })).toEqual({ foo: 'bar' });
    });

    it('strips non-cloud fields and formats completions', () => {
      const data = {
        achievements: { ghost: true },
        hasShared: true,
        cardio: { sessions: {} },
        startDate: '2026-01-01',
        completions: {
          '2026-01-01': {
            squats: {
              isCompleted: true,
              timestamp: 12345,
              localHour: 10,
              weight: 50,
              difficulty: 3,
              ignoredField: 'should disappear'
            },
            pushups: null // invalid object
          },
          '2026-01-02': null // invalid day
        }
      };

      const result = sanitizeForCloud(data);

      expect(result.achievements).toBeUndefined();
      expect(result.hasShared).toBeUndefined();
      expect(result.cardio).toBeUndefined();
      expect(result.startDate).toBe('2026-01-01');

      expect(result.completions['2026-01-01'].squats).toEqual({
        isCompleted: true,
        timestamp: 12345,
        localHour: 10,
        weight: 50,
        difficulty: 3
      });
      expect(result.completions['2026-01-01'].squats.ignoredField).toBeUndefined();
      expect(result.completions['2026-01-01'].pushups).toBeUndefined();
      expect(result.completions['2026-01-02']).toBeUndefined();
    });

    it('handles defaults for completions', () => {
      const result = sanitizeForCloud({ completions: { '2026-01-01': { foo: {} } } });
      expect(result.completions['2026-01-01'].foo).toEqual({
        isCompleted: false,
        timestamp: null
      });
    });
  });

  describe('mergeData', () => {
    it('returns local if cloud is missing, cloud if local is missing', () => {
      const local = { foo: 'bar' };
      const cloud = { baz: 'qux' };
      expect(mergeData(local, null)).toBe(local);
      expect(mergeData(null, cloud)).toBe(cloud);
    });

    it('prioritizes cloud if cloud timestamp is strictly newer and local is not placeholder', () => {
      const local = {
        lastCompletionChange: 1000,
        completions: {
          '2026-01-01': {
            squats: { isCompleted: true, count: 10 }
          }
        },
        cardio: null,
        streakFreezes: null,
        notes: null
      };
      const cloud = {
        lastCompletionChange: 2000,
        startDate: '2026-01-01',
        completions: {
          '2026-01-01': {
            squats: { isCompleted: true } // Missing count, should reattach
          }
        },
        cardio: { sessions: { a: 1 } }
      };

      const result = mergeData(local, cloud);
      expect(result.lastCompletionChange).toBe(2000);
      expect(result.startDate).toBe('2026-01-01');
      // Should reattach count
      expect(result.completions['2026-01-01'].squats.count).toBe(10);
      expect(result.cardio.sessions.a).toBe(1);
    });

    it('reattachLocalCounts handles missing objects gracefully', () => {
      // cloud newer
      const local = { lastCompletionChange: 1000, completions: null };
      const cloud = { lastCompletionChange: 2000, completions: null };
      const result = mergeData(local, cloud);
      expect(result.completions).toEqual({});
    });

    it('merges day by day if cloud is not strictly newer (or local has placeholder)', () => {
      const localPlaceholder = { '.sv': 'timestamp' };
      const local = {
        lastCompletionChange: localPlaceholder,
        completions: {
          '2026-01-01': {
            squats: { isCompleted: true, timestamp: 1000 },
            localOnly: { isCompleted: true, timestamp: 1000 } // Should be preserved
          },
          '2026-01-02': {
            bench: { isCompleted: true, timestamp: localPlaceholder, count: 5 }
          }
        }
      };
      const cloud = {
        lastCompletionChange: 1500, // strictly newer, but local is placeholder, so we fall through
        completions: {
          '2026-01-01': {
            squats: { isCompleted: true, timestamp: 2000, weight: 10 }, // cloud newer
            pushups: { isCompleted: true } // cloud new exercise
          },
          '2026-01-02': {
            bench: { isCompleted: true, timestamp: 2000, count: 5 } // replaces placeholder
          },
          '2026-01-03': {
            deadlift: { isCompleted: true } // completely new day
          }
        }
      };

      const result = mergeData(local, cloud);
      expect(result.lastCompletionChange).toBe(1500); // cloud real timestamp replaces placeholder
      
      expect(result.completions['2026-01-01'].squats.timestamp).toBe(2000); // cloud newer
      expect(result.completions['2026-01-01'].squats.weight).toBe(10); 
      expect(result.completions['2026-01-01'].pushups.isCompleted).toBe(true);
      expect(result.completions['2026-01-01'].localOnly.isCompleted).toBe(true); // preserved

      expect(result.completions['2026-01-02'].bench.timestamp).toBe(2000); // replaced placeholder

      expect(result.completions['2026-01-03'].deadlift.isCompleted).toBe(true);
    });

    it('retains local properties if cloud is older', () => {
      const local = {
        lastCompletionChange: 2000,
        completions: {
          '2026-01-01': { squats: { isCompleted: true, timestamp: 2000 } }
        }
      };
      const cloud = {
        lastCompletionChange: 1000,
        completions: {
          '2026-01-01': { squats: { isCompleted: false, timestamp: 1000 } }
        }
      };

      const result = mergeData(local, cloud);
      expect(result.completions['2026-01-01'].squats.isCompleted).toBe(true); // local wins
    });
    
    it('uses cloud if local has no timestamp and cloud does', () => {
      const local = {
        lastCompletionChange: 1000,
        completions: {
          '2026-01-01': { squats: { isCompleted: true } }
        }
      };
      const cloud = {
        lastCompletionChange: 1000,
        completions: {
          '2026-01-01': { squats: { isCompleted: false, timestamp: 1000 } }
        }
      };

      const result = mergeData(local, cloud);
      expect(result.completions['2026-01-01'].squats.timestamp).toBe(1000);
    });

    describe('mergeStreakFreeze', () => {
      it('picks cloud if local is null', () => {
        const local = { completions: {}, streakFreezes: null };
        const cloud = { completions: {}, streakFreezes: { count: 2, lastRefill: '2026-01' } };
        const result = mergeData(local, cloud);
        expect(result.streakFreezes).toEqual(cloud.streakFreezes);
      });

      it('picks local if cloud is null', () => {
        const local = { completions: {}, streakFreezes: { count: 1, lastRefill: '2026-01' } };
        const cloud = { completions: {}, streakFreezes: null };
        const result = mergeData(local, cloud);
        expect(result.streakFreezes).toEqual(local.streakFreezes);
      });

      it('picks newer refill date', () => {
        const local = { completions: {}, streakFreezes: { count: 1, lastRefill: '2026-01' } };
        const cloud = { completions: {}, streakFreezes: { count: 1, lastRefill: '2026-02' } };
        const result = mergeData(local, cloud);
        expect(result.streakFreezes.lastRefill).toBe('2026-02');
      });

      it('picks lower count if refill date is the same', () => {
        const local = { completions: {}, streakFreezes: { count: 2, lastRefill: '2026-01' } };
        const cloud = { completions: {}, streakFreezes: { count: 1, lastRefill: '2026-01' } };
        const result = mergeData(local, cloud);
        expect(result.streakFreezes.count).toBe(1);
      });
      
      it('handles undefined counts gracefully when tied on refill', () => {
        const local = { completions: {}, streakFreezes: { count: undefined, lastRefill: '2026-01' } };
        const cloud = { completions: {}, streakFreezes: { count: undefined, lastRefill: '2026-01' } };
        const result = mergeData(local, cloud);
        expect(result.streakFreezes.count).toBe(0);
      });
    });
  });
});
