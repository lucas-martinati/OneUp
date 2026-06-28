import { describe, it, expect, beforeEach } from 'vitest';
import { buildBackup, parseBackup, restoreBackup } from '@utils/dataBackup';

describe('dataBackup', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('snapshots every localStorage entry into a marked backup', () => {
    localStorage.setItem('pushup_challenge_data', '{"completions":{}}');
    localStorage.setItem('oneup_settings', '{"theme":"dark"}');

    const backup = buildBackup();

    expect(backup.app).toBe('oneup-backup');
    expect(backup.version).toBe(1);
    expect(typeof backup.exportedAt).toBe('string');
    expect(backup.data).toEqual({
      pushup_challenge_data: '{"completions":{}}',
      oneup_settings: '{"theme":"dark"}',
    });
  });

  it('round-trips through parse + restore, replacing existing data', () => {
    localStorage.setItem('keep_me', 'old');
    const backup = buildBackup();

    // Mutate the store, then restore — the backup must become authoritative.
    localStorage.clear();
    localStorage.setItem('stale', 'should-be-wiped');

    const parsed = parseBackup(JSON.stringify(backup));
    const count = restoreBackup(parsed);

    expect(count).toBe(1);
    expect(localStorage.getItem('keep_me')).toBe('old');
    expect(localStorage.getItem('stale')).toBeNull();
  });

  it('rejects malformed JSON', () => {
    expect(() => parseBackup('{not json')).toThrow('invalid-json');
  });

  it('rejects JSON that is not a OneUp backup', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'other', data: {} }))).toThrow('invalid-backup');
    expect(() => parseBackup(JSON.stringify({ app: 'oneup-backup' }))).toThrow('invalid-backup');
    expect(() => parseBackup(JSON.stringify({ app: 'oneup-backup', data: null }))).toThrow('invalid-backup');
  });

  it('ignores non-string values when restoring', () => {
    const count = restoreBackup({ data: { a: 'x', b: 42, c: null, d: 'y' } });
    expect(count).toBe(2);
    expect(localStorage.getItem('a')).toBe('x');
    expect(localStorage.getItem('b')).toBeNull();
  });
});
