import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DEFAULT_TARGET_DATE,
  PROGRESS_SCHEMA_VERSION,
  LOCAL_STORAGE_KEY,
  OMDB_STORAGE_KEY,
  EXTERNAL_MEDIA_STORAGE_KEY,
  MAX_NOTE_LENGTH,
  MAX_NICK_LENGTH,
  MAX_MAP_ENTRIES,
  MAX_SYNC_CODE_LENGTH,
  MAX_IMPORT_FILE_BYTES,
  COMPRESSED_CODE_PREFIX,
  isValidIsoDate,
  isValidIsoTimestamp,
  sanitizeNick,
  parseSemver,
  checkSchemaCompatibility,
  createDefaultProgress,
  normalizeUserProgress,
  getExportableProgress,
  importProgressPayload,
  encodeSyncCode,
  encodeCompressedSyncCode,
  decodeSyncCode,
  decodeSyncCodeWithMeta,
  decodeAnySyncCodeWithMeta,
  buildShareDeeplink,
  extractSyncCodeFromHash,
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
      userNotes: {
        mcu_iron_man: '  Obra maestra  ',
        bad_note: { nested: true },
        empty_note: '   ',
      },
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
    const imported = normalizeUserProgress(
      { watchedItems: { mcu_iron_man: true }, targetDate: 'invalid' },
      current,
    );
    expect(imported.targetDate).toBe('2027-01-15');
  });

  test('previene prototype pollution en claves importadas', () => {
    const maliciousJson =
      '{"watchedItems":{"__proto__":{"polluted":true},"constructor":true,"mcu_iron_man":true}}';
    const parsed = JSON.parse(maliciousJson);
    const normalized = normalizeUserProgress(parsed);

    expect({}.polluted).toBeUndefined();
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
    storage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ omdbApiKey: 'legacy_key_99', watchedItems: {} }),
    );

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
    expect(normalizeUserProgress({ targetDate: '2026-02-31' }).targetDate).toBe(
      DEFAULT_TARGET_DATE,
    );
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

describe('JSON Schema y compatibilidad SemVer', () => {
  test('schemas/progress.schema.json es válido y coincide con PROGRESS_SCHEMA_VERSION', () => {
    const schemaPath = resolve(import.meta.dir, '../schemas/progress.schema.json');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

    expect(schema.$schema).toContain('json-schema.org');
    expect(schema['x-schema-version']).toBe(PROGRESS_SCHEMA_VERSION);
    expect(schema.additionalProperties).toBe(false);
    expect(schema.required).toContain('schemaVersion');
    expect(parseSemver(PROGRESS_SCHEMA_VERSION)).not.toBeNull();
  });

  test('getExportableProgress y encodeSyncCode incluyen schemaVersion actual', () => {
    const exported = getExportableProgress(createDefaultProgress('2026-12-18'));
    expect(exported.schemaVersion).toBe(PROGRESS_SCHEMA_VERSION);

    const code = encodeSyncCode(createDefaultProgress('2026-12-18'));
    const { progress, compatibility } = decodeSyncCodeWithMeta(code);
    expect(compatibility.status).toBe('exact');
    expect(compatibility.compatible).toBe(true);
    expect(compatibility.importedVersion).toBe(PROGRESS_SCHEMA_VERSION);
    expect(progress.targetDate).toBe('2026-12-18');
  });

  test('checkSchemaCompatibility evalúa exact, compatible, newer_minor, legacy, incompatible e invalid', () => {
    expect(checkSchemaCompatibility('1.0.0', '1.0.0')).toMatchObject({
      status: 'exact',
      compatible: true,
    });
    expect(checkSchemaCompatibility('1.0.2', '1.0.0')).toMatchObject({
      status: 'compatible',
      compatible: true,
    });
    expect(checkSchemaCompatibility('1.0.0', '1.2.0')).toMatchObject({
      status: 'compatible',
      compatible: true,
    });
    expect(checkSchemaCompatibility('1.3.0', '1.0.0')).toMatchObject({
      status: 'newer_minor',
      compatible: true,
    });
    expect(checkSchemaCompatibility(undefined, '1.0.0')).toMatchObject({
      status: 'legacy',
      compatible: true,
    });
    expect(checkSchemaCompatibility('2.0.0', '1.0.0')).toMatchObject({
      status: 'incompatible',
      compatible: false,
    });
    expect(checkSchemaCompatibility('0.9.0', '1.0.0')).toMatchObject({
      status: 'incompatible',
      compatible: false,
    });
    expect(checkSchemaCompatibility('v1', '1.0.0')).toMatchObject({
      status: 'invalid',
      compatible: false,
    });
  });

  test('importProgressPayload acepta backups legacy y rechaza versiones MAJOR incompatibles o inválidas', () => {
    const legacy = importProgressPayload({ watchedItems: { mcu_iron_man: true } });
    expect(legacy.compatibility.status).toBe('legacy');
    expect(legacy.progress.watchedItems).toEqual({ mcu_iron_man: true });

    expect(() =>
      importProgressPayload({ schemaVersion: '2.0.0', watchedItems: { mcu_iron_man: true } }),
    ).toThrow('Versión de esquema incompatible');

    expect(() => importProgressPayload({ schemaVersion: 'not-semver', watchedItems: {} })).toThrow(
      'Versión de esquema no válida',
    );
  });
});

describe('Deeplinks, compresión deflate-raw, nick y timestamp UTC (v1.1.0)', () => {
  test('sanitizeNick y isValidIsoTimestamp validan y limpian entradas', () => {
    expect(sanitizeNick('  Tony\nStark  ')).toBe('Tony Stark');
    expect(sanitizeNick('A'.repeat(MAX_NICK_LENGTH + 20)).length).toBe(MAX_NICK_LENGTH);
    expect(isValidIsoTimestamp('2026-11-21T06:30:00.000Z')).toBe(true);
    expect(isValidIsoTimestamp('2026-11-21')).toBe(false);
    expect(isValidIsoTimestamp('not-a-timestamp')).toBe(false);
  });

  test('getExportableProgress incluye nick, exportedAt UTC y respeta includeNotes: false', () => {
    const progress = createDefaultProgress('2026-12-18', 'Wanda');
    progress.userNotes = { mcu_iron_man: 'Nota privada' };
    progress.userRatings = { mcu_iron_man: 5 };

    const withNotes = getExportableProgress(progress, { includeNotes: true });
    expect(withNotes.schemaVersion).toBe('1.1.0');
    expect(withNotes.nick).toBe('Wanda');
    expect(isValidIsoTimestamp(withNotes.exportedAt)).toBe(true);
    expect(withNotes.userNotes).toEqual({ mcu_iron_man: 'Nota privada' });

    const withoutNotes = getExportableProgress(progress, { includeNotes: false });
    expect(withoutNotes.userNotes).toEqual({});
    expect(withoutNotes.userRatings).toEqual({ mcu_iron_man: 5 });
  });

  test('encodeCompressedSyncCode + buildShareDeeplink + decodeAnySyncCodeWithMeta preservan nick y exportedAt', async () => {
    const progress = createDefaultProgress('2026-12-18', 'Peter');
    progress.watchedItems = { mcu_iron_man: true, mcu_avengers: true };
    progress.userRatings = { mcu_iron_man: 5 };

    const code = await encodeCompressedSyncCode(progress, {
      includeNotes: false,
      exportedAt: '2026-11-21T07:00:00.000Z',
    });
    expect(code.startsWith(COMPRESSED_CODE_PREFIX)).toBe(true);

    const link = buildShareDeeplink('https://ucm.example.com/?foo=bar#old', code);
    expect(link).toBe(`https://ucm.example.com/#sync=${encodeURIComponent(code)}`);

    const extracted = extractSyncCodeFromHash(new URL(link).hash);
    expect(extracted).toBe(code);

    const decodedFromCode = await decodeAnySyncCodeWithMeta(code);
    expect(decodedFromCode.meta).toEqual({
      nick: 'Peter',
      exportedAt: '2026-11-21T07:00:00.000Z',
    });
    expect(decodedFromCode.progress.watchedItems).toEqual({
      mcu_iron_man: true,
      mcu_avengers: true,
    });
    expect(decodedFromCode.progress.nick).toBe('Peter');

    // También acepta pegar el enlace completo directamente
    const decodedFromLink = await decodeAnySyncCodeWithMeta(link);
    expect(decodedFromLink.meta.nick).toBe('Peter');

    // Retrocompatibilidad con código plano Base64 clásico
    const legacyPlainCode = encodeSyncCode(progress);
    const decodedPlain = await decodeAnySyncCodeWithMeta(legacyPlainCode);
    expect(decodedPlain.progress.watchedItems).toEqual(progress.watchedItems);
  });

  test('sanitizeNick elimina caracteres de control y BiDi y checkSchemaCompatibility trunca versiones inválidas', () => {
    expect(sanitizeNick('Tony\u202E\u0007Stark\u2066')).toBe('TonyStark');
    const hugeInvalid = checkSchemaCompatibility('x'.repeat(200), '1.1.0');
    expect(hugeInvalid.status).toBe('invalid');
    expect(hugeInvalid.compatible).toBe(false);
    expect(hugeInvalid.importedVersion?.length).toBeLessThanOrEqual(32);
  });

  test('rechaza payloads z1. corruptos, Base64URL inválido, UTF-8 inválido y decompression bombs', async () => {
    await expect(decodeAnySyncCodeWithMeta('z1.')).rejects.toThrow();
    await expect(decodeAnySyncCodeWithMeta('z1.!!!not-base64url!!!')).rejects.toThrow();
    await expect(decodeAnySyncCodeWithMeta('z1.AAAA')).rejects.toThrow();

    // Comprimir un payload que al descomprimir supera MAX_IMPORT_FILE_BYTES (decompression bomb)
    const bombBytes = new TextEncoder().encode('A'.repeat(MAX_IMPORT_FILE_BYTES + 4096));
    const cs = new CompressionStream('deflate-raw');
    const writer = cs.writable.getWriter();
    const wp = writer.write(bombBytes).then(() => writer.close());
    const reader = cs.readable.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    await wp;
    const total = chunks.reduce((acc, c) => acc + c.byteLength, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }
    let bin = '';
    for (let i = 0; i < merged.length; i++) bin += String.fromCharCode(merged[i]);
    const b64url = btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');

    await expect(decodeAnySyncCodeWithMeta(`z1.${b64url}`)).rejects.toThrow(
      'Código demasiado grande',
    );
  });

  test('compatibilidad 1.0.0 -> 1.1.0 preserva current.nick y excluye omdbApiKey de deeplinks', async () => {
    const current = createDefaultProgress('2026-12-18', 'MiNick');
    const v100Payload = {
      schemaVersion: '1.0.0',
      watchedItems: { mcu_iron_man: true },
      watchedEpisodes: {},
      userRatings: {},
      userNotes: {},
      targetDate: '2026-12-18',
    };
    const legacyCode = btoa(encodeURIComponent(JSON.stringify(v100Payload)));
    const imported = await decodeAnySyncCodeWithMeta(legacyCode, current);
    expect(imported.compatibility.status).toBe('compatible');
    expect(imported.meta).toEqual({ nick: '', exportedAt: null });
    expect(imported.progress.nick).toBe('MiNick');

    // Exclusión de omdbApiKey en código comprimido y deeplink
    const leaky = {
      ...createDefaultProgress('2026-12-18', 'Tony'),
      omdbApiKey: 'SUPER_SECRET_KEY',
    };
    const code = await encodeCompressedSyncCode(leaky);
    const link = buildShareDeeplink('https://ucm.example.com/', code);
    expect(link).not.toContain('SUPER_SECRET_KEY');
    const decoded = await decodeAnySyncCodeWithMeta(link);
    expect('omdbApiKey' in decoded.progress).toBe(false);
  });

  test('extractSyncCodeFromHash maneja casos límite y saveProgressToStorage guarda nick sin exportedAt', () => {
    expect(extractSyncCodeFromHash('')).toBeNull();
    expect(extractSyncCodeFromHash('#')).toBeNull();
    expect(extractSyncCodeFromHash('#foo=1&sync=z1.abc')).toBe('z1.abc');
    expect(extractSyncCodeFromHash(`#sync=${'a'.repeat(MAX_SYNC_CODE_LENGTH + 100)}`)).toBeNull();

    const storage = createMemoryStorage();
    const progress = createDefaultProgress('2026-12-18', 'Natasha');
    expect(saveProgressToStorage(progress, storage)).toBe(true);
    const saved = JSON.parse(storage.getItem(LOCAL_STORAGE_KEY) || '{}');
    expect(saved.nick).toBe('Natasha');
    expect(saved.exportedAt).toBeUndefined();
  });

  test('encodeCompressedSyncCode rechaza perfiles cuya serialización UTF-8 supera MAX_IMPORT_FILE_BYTES pero permite includeNotes: false', async () => {
    const huge = createDefaultProgress('2026-12-18', 'Bruce');
    // 100 notas de 2000 caracteres CJK (~600 KB UTF-8, supera MAX_IMPORT_FILE_BYTES = 512 KB)
    const cjkNote = '漢'.repeat(2000);
    for (let i = 0; i < 100; i++) {
      huge.userNotes[`item_${i}`] = cjkNote;
    }

    await expect(encodeCompressedSyncCode(huge, { includeNotes: true })).rejects.toThrow(
      'Código demasiado grande',
    );

    const withoutNotesCode = await encodeCompressedSyncCode(huge, { includeNotes: false });
    expect(withoutNotesCode.startsWith(COMPRESSED_CODE_PREFIX)).toBe(true);
    const decoded = await decodeAnySyncCodeWithMeta(withoutNotesCode);
    expect(decoded.progress.userNotes).toEqual({});
    expect(decoded.meta.nick).toBe('Bruce');
  });
});
