import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_TARGET_DATE,
  LOCAL_STORAGE_KEY,
  OMDB_STORAGE_KEY,
  createDefaultProgress,
  normalizeUserProgress,
  getExportableProgress,
  encodeSyncCode,
  decodeSyncCode,
  loadOmdbApiKey,
  saveOmdbApiKeyToStorage,
} from '../src/store.js';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

describe('normalizeUserProgress', () => {
  test('valida tipos y descarta valores corruptos', () => {
    const raw = {
      watchedItems: { mcu_iron_man: true, bad_item: 'yes', num_item: 1 },
      watchedEpisodes: {
        dplus_loki_s1: { S1E1: true, S1E2: false, S1E3: 'invalid' },
        corrupt_series: 'not-an-object',
      },
      userRatings: { mcu_iron_man: 5, bad_high: 9, bad_float: 3.5, bad_str: '4' },
      userNotes: { mcu_iron_man: '  Obra maestra  ', bad_note: { nested: true }, empty_note: '   ' },
      targetDate: '2027-05-01',
      omdbApiKey: 'SECRET_KEY_123',
    };

    const normalized = normalizeUserProgress(raw);
    expect(normalized.watchedItems).toEqual({ mcu_iron_man: true });
    expect(normalized.watchedEpisodes).toEqual({ dplus_loki_s1: { S1E1: true } });
    expect(normalized.userRatings).toEqual({ mcu_iron_man: 5 });
    expect(normalized.userNotes).toEqual({ mcu_iron_man: 'Obra maestra' });
    expect(normalized.targetDate).toBe('2027-05-01');
    expect('omdbApiKey' in normalized).toBe(false);
  });

  test('preserva targetDate actual si el objeto importado no lo incluye o es inválido', () => {
    const current = createDefaultProgress('2027-01-15');
    const imported = normalizeUserProgress({ watchedItems: { mcu_iron_man: true }, targetDate: 'invalid' }, current);
    expect(imported.targetDate).toBe('2027-01-15');
  });

  test('previene prototype pollution en claves importadas', () => {
    const maliciousJson = '{"watchedItems":{"__proto__":{"polluted":true},"constructor":true,"mcu_iron_man":true}}';
    const parsed = JSON.parse(maliciousJson);
    const normalized = normalizeUserProgress(parsed);

    expect(({}).polluted).toBeUndefined();
    expect(Object.keys(normalized.watchedItems)).toEqual(['mcu_iron_man']);
  });
});

describe('Aislamiento de omdbApiKey y sincronización', () => {
  test('encodeSyncCode y getExportableProgress nunca exportan omdbApiKey', () => {
    const dirtyProgress = {
      ...createDefaultProgress('2026-12-18'),
      watchedItems: { mcu_iron_man: true },
      omdbApiKey: 'SUPER_SECRET_OMDB_KEY',
    };

    const exportable = getExportableProgress(dirtyProgress);
    expect(JSON.stringify(exportable)).not.toContain('SUPER_SECRET_OMDB_KEY');

    const code = encodeSyncCode(dirtyProgress);
    const decodedStr = decodeURIComponent(atob(code));
    expect(decodedStr).not.toContain('SUPER_SECRET_OMDB_KEY');

    const restored = decodeSyncCode(code, createDefaultProgress('2027-03-01'));
    expect(restored.watchedItems).toEqual({ mcu_iron_man: true });
    expect(restored.targetDate).toBe('2026-12-18');
  });

  test('guarda y migra omdbApiKey en su propia clave de localStorage', () => {
    const storage = createMemoryStorage();
    // Simular almacenamiento antiguo
    storage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ omdbApiKey: 'legacy_key_99', watchedItems: {} }));

    expect(loadOmdbApiKey(storage)).toBe('legacy_key_99');
    expect(storage.getItem(OMDB_STORAGE_KEY)).toBe('legacy_key_99');

    saveOmdbApiKeyToStorage('new_key_42', storage);
    expect(loadOmdbApiKey(storage)).toBe('new_key_42');

    saveOmdbApiKeyToStorage('', storage);
    expect(storage.getItem(OMDB_STORAGE_KEY)).toBeNull();
  });

  test('createDefaultProgress usa fecha por defecto si la fecha proporcionada no es ISO', () => {
    expect(createDefaultProgress('not-a-date').targetDate).toBe(DEFAULT_TARGET_DATE);
  });
});
