import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildBackup, downloadBackup, parseBackup, restoreBackup, readFileText } from '../dataBackup';

describe('dataBackup', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.stubGlobal('URL', {
            createObjectURL: vi.fn(() => 'blob:test'),
            revokeObjectURL: vi.fn(),
        });
    });

    it('builds a backup from localStorage', () => {
        localStorage.setItem('key1', 'val1');
        localStorage.setItem('key2', 'val2');
        const backup = buildBackup();
        expect(backup.app).toBe('oneup-backup');
        expect(backup.data).toEqual({ key1: 'val1', key2: 'val2' });
    });

    it('skips null keys', () => {
        const fakeStorage = {
            length: 2,
            key: vi.fn(i => i === 0 ? 'k' : null),
            getItem: vi.fn(k => k === 'k' ? 'v' : null),
        };
        vi.stubGlobal('localStorage', fakeStorage);
        
        const backup = buildBackup();
        expect(backup.data).toEqual({ k: 'v' });
        
        vi.unstubAllGlobals();
    });

    it('downloadBackup creates a file download', () => {
        localStorage.setItem('k', 'v');
        const mockClick = vi.fn();
        const mockRemove = vi.fn();
        const mockAppend = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
        vi.spyOn(document, 'createElement').mockReturnValue({
            click: mockClick,
            remove: mockRemove,
        });

        const numKeys = downloadBackup();
        expect(numKeys).toBe(1);
        expect(mockClick).toHaveBeenCalled();
        expect(mockRemove).toHaveBeenCalled();
        expect(mockAppend).toHaveBeenCalled();
    });

    it('parseBackup handles valid backups', () => {
        const json = JSON.stringify({
            app: 'oneup-backup',
            data: { k: 'v' }
        });
        const parsed = parseBackup(json);
        expect(parsed.data).toEqual({ k: 'v' });
    });

    it('parseBackup throws invalid-json', () => {
        expect(() => parseBackup('{bad json}')).toThrowError('invalid-json');
    });

    it('parseBackup throws invalid-backup', () => {
        const json1 = JSON.stringify({ app: 'wrong', data: {} });
        expect(() => parseBackup(json1)).toThrowError('invalid-backup');

        const json2 = JSON.stringify({ app: 'oneup-backup', data: null });
        expect(() => parseBackup(json2)).toThrowError('invalid-backup');
    });

    it('restoreBackup writes string values to localStorage', () => {
        localStorage.setItem('old', 'gone');
        const parsed = {
            data: {
                strKey: 'val',
                numKey: 123, // should be skipped as it's not a string
            }
        };
        const numKeys = restoreBackup(parsed);
        expect(numKeys).toBe(1);
        expect(localStorage.getItem('strKey')).toBe('val');
        expect(localStorage.getItem('old')).toBeNull();
    });

    it('readFileText resolves text', async () => {
        const mockFile = {};
        const originalFileReader = globalThis.FileReader;
        
        let onloadCb;
        globalThis.FileReader = class {
            readAsText() {
                this.result = 'hello';
                onloadCb();
            }
            set onload(cb) { onloadCb = cb; }
        };

        const result = await readFileText(mockFile);
        expect(result).toBe('hello');
        
        globalThis.FileReader = originalFileReader;
    });

    it('readFileText rejects on error', async () => {
        const mockFile = {};
        const originalFileReader = globalThis.FileReader;
        
        let onerrorCb;
        globalThis.FileReader = class {
            readAsText() {
                this.error = new Error('test-error');
                onerrorCb();
            }
            set onerror(cb) { onerrorCb = cb; }
        };

        await expect(readFileText(mockFile)).rejects.toThrow('test-error');
        
        globalThis.FileReader = originalFileReader;
    });
    
    it('readFileText rejects with default error if none provided', async () => {
        const mockFile = {};
        const originalFileReader = globalThis.FileReader;
        
        let onerrorCb;
        globalThis.FileReader = class {
            readAsText() {
                this.error = null;
                onerrorCb();
            }
            set onerror(cb) { onerrorCb = cb; }
        };

        await expect(readFileText(mockFile)).rejects.toThrow('read-failed');
        
        globalThis.FileReader = originalFileReader;
    });
});
