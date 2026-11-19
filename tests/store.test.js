import { describe, expect, test } from 'bun:test';
import {
  DEFAULT_TARGET_DATE,
  LOCAL_STORAGE_KEY,
  OMDB_STORAGE_KEY,
  EXTERNAL_MEDIA_STORAGE_KEY,
  MAX_NOTE_LENGTH,
  MAX_MAP_ENTRIES,
  MAX_SYNC_CODE_LENGTH,
  isValidIsoDate,
  createDefaultProgress,
  normalizeUserProgress,
  getExportableProgress,
  encodeSyncCode,
  decodeSyncCode,
  loadOmdbApiKey,
  saveOmdbApiKeyToStorage,
  loadExternalMediaPref,
  saveExternalMediaPref,
  saveProgressToStorage,
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

  test('limita longitud de notas, cantidad de entradas y tamaño de código de sincronización', () => {
    const hugeWatched = {};
    for (let i = 0; i < MAX_MAP_ENTRIES + 200; i++) {
      hugeWatched[`item_${i}`] = true;
    }
    const normalized = normalizeUserProgress({
      watchedItems: hugeWatched,
      userNotes: { mcu_iron_man: 'a'.repeat(MAX_NOTE_LENGTH + 500) },
    });

    expect(Object.keys(normalized.watchedItems).length).toBe(MAX_MAP_ENTRIES);
    expect(normalized.userNotes.mcu_iron_man.length).toBe(MAX_NOTE_LENGTH);

    const oversizedCode = 'A'.repeat(MAX_SYNC_CODE_LENGTH + 1);
    expect(() => decodeSyncCode(oversizedCode)).toThrow('Código demasiado grande');
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

  test('createDefaultProgress e isValidIsoDate rechazan fechas calendario imposibles', () => {
    expect(isValidIsoDate('2026-12-18')).toBe(true);
    expect(isValidIsoDate('2026-99-99')).toBe(false);
    expect(isValidIsoDate('2026-02-31')).toBe(false);
    expect(createDefaultProgress('not-a-date').targetDate).toBe(DEFAULT_TARGET_DATE);
    expect(createDefaultProgress('2026-99-99').targetDate).toBe(DEFAULT_TARGET_DATE);
    expect(normalizeUserProgress({ targetDate: '2026-02-31' }).targetDate).toBe(DEFAULT_TARGET_DATE);
  });

  test('guarda y carga la preferencia opt-in de portadas externas (false por defecto)', () => {
    const storage = createMemoryStorage();
    expect(loadExternalMediaPref(storage)).toBe(false);

    saveExternalMediaPref(true, storage);
    expect(storage.getItem(EXTERNAL_MEDIA_STORAGE_KEY)).toBe('true');
    expect(loadExternalMediaPref(storage)).toBe(true);

    saveExternalMediaPref(false, storage);
    expect(storage.getItem(EXTERNAL_MEDIA_STORAGE_KEY)).toBeNull();
    expect(loadExternalMediaPref(storage)).toBe(false);
  });

  test('saveProgressToStorage devuelve true al guardar y false ante QuotaExceededError', () => {
    const storage = createMemoryStorage();
    expect(saveProgressToStorage(createDefaultProgress(), storage)).toBe(true);

    const failingStorage = {
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(saveProgressToStorage(createDefaultProgress(), failingStorage)).toBe(false);
  });
});
