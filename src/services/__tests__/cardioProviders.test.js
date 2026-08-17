import { describe, it, expect, vi } from 'vitest';
import { getAllActivities } from '../cardioProviders';
import { healthConnectService } from '../healthConnectService';

describe('cardioProviders', () => {
  it('fetches and deduplicates activities from all providers', async () => {
    vi.spyOn(healthConnectService, 'getActivities').mockResolvedValueOnce([
      { id: 'hc_1', type: 'running', distanceMeters: 5000 },
      { id: 'hc_1', type: 'running', distanceMeters: 5000 },
      { id: 'hc_2', type: 'cycling', distanceMeters: 12000 },
    ]);

    const activities = await getAllActivities(123456789);
    expect(activities).toHaveLength(2);
    expect(activities.map(a => a.id)).toEqual(['hc_1', 'hc_2']);
  });

  it('handles provider errors gracefully without throwing', async () => {
    vi.spyOn(healthConnectService, 'getActivities').mockRejectedValueOnce(new Error('Provider failure'));

    const activities = await getAllActivities();
    expect(activities).toEqual([]);
  });

  it('filters out invalid or empty activities', async () => {
    vi.spyOn(healthConnectService, 'getActivities').mockResolvedValueOnce([
      null,
      undefined,
      { type: 'running' }, // missing id
      { id: 'hc_valid', type: 'running', distanceMeters: 3000 }
    ]);

    const activities = await getAllActivities();
    expect(activities).toHaveLength(1);
    expect(activities[0].id).toBe('hc_valid');
  });
});
