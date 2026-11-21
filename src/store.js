export const LOCAL_STORAGE_KEY = 'mcu_multiverse_master_progress_v2';
export const OMDB_STORAGE_KEY = 'mcu_multiverse_omdb_key_v1';
export const EXTERNAL_MEDIA_STORAGE_KEY = 'mcu_multiverse_external_media_v1';
export const DEFAULT_TARGET_DATE = '2026-12-18';
export const PROGRESS_SCHEMA_VERSION = '1.1.0';
export const MAX_NOTE_LENGTH = 2000;
export const MAX_NICK_LENGTH = 40;
export const MAX_MAP_ENTRIES = 1000;
export const MAX_SYNC_CODE_LENGTH = 512 * 1024;
export const MAX_IMPORT_FILE_BYTES = 512 * 1024;
export const COMPRESSED_CODE_PREFIX = 'z1.';
export const DEEPLINK_HASH_PARAM = 'sync';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function safeKeys(obj) {
  return Object.keys(obj)
    .filter((k) => Object.prototype.hasOwnProperty.call(obj, k) && !FORBIDDEN_KEYS.has(k))
    .slice(0, MAX_MAP_ENTRIES);
}

export function isValidIsoDate(str) {
  if (typeof str !== 'string' || !ISO_DATE_RE.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;

/** @param {string} str */
function stripControlAndBidiChars(str) {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    const isControl = code <= 0x1f || (code >= 0x7f && code <= 0x9f);
    const isBidi = (code >= 0x202a && code <= 0x202e) || (code >= 0x2066 && code <= 0x2069);
    if (!isControl && !isBidi) out += str[i];
  }
  return out;
}

export function sanitizeNick(nick) {
  if (typeof nick !== 'string') return '';
  return stripControlAndBidiChars(nick.replace(/[\r\n\t]+/g, ' '))
    .trim()
    .slice(0, MAX_NICK_LENGTH);
}

export function isValidIsoTimestamp(str) {
  if (typeof str !== 'string' || !ISO_TIMESTAMP_RE.test(str)) return false;
  const ms = Date.parse(str);
  return !Number.isNaN(ms);
}

export function createDefaultProgress(targetDate = DEFAULT_TARGET_DATE, nick = '') {
  return {
    nick: sanitizeNick(nick),
    watchedItems: {},
    watchedEpisodes: {},
    userRatings: {},
    userNotes: {},
    targetDate: isValidIsoDate(targetDate) ? targetDate : DEFAULT_TARGET_DATE,
  };
}

/**
 * Normaliza y valida un objeto de progreso importado o restaurado.
 * - Previene prototype pollution (__proto__, constructor, prototype).
 * - Valida tipos por campo.
 * - Preserva targetDate actual si el origen no proporciona una fecha válida.
 * - Excluye deliberadamente cualquier omdbApiKey para evitar fugas.
 */
export function normalizeUserProgress(raw, current = null) {
  const fallbackDate =
    current && isValidIsoDate(current.targetDate) ? current.targetDate : DEFAULT_TARGET_DATE;
  const fallbackNick =
    current && typeof current.nick === 'string' ? sanitizeNick(current.nick) : '';

  const base = createDefaultProgress(fallbackDate, fallbackNick);
  if (!isPlainObject(raw)) {
    return base;
  }

  if (isPlainObject(raw.watchedItems)) {
    for (const id of safeKeys(raw.watchedItems)) {
      if (raw.watchedItems[id] === true) {
        base.watchedItems[id] = true;
      }
    }
  }

  if (isPlainObject(raw.watchedEpisodes)) {
    for (const id of safeKeys(raw.watchedEpisodes)) {
      const epMap = raw.watchedEpisodes[id];
      if (!isPlainObject(epMap)) continue;
      const cleanEpMap = {};
      for (const code of safeKeys(epMap)) {
        if (epMap[code] === true) {
          cleanEpMap[code] = true;
        }
      }
      if (Object.keys(cleanEpMap).length > 0) {
        base.watchedEpisodes[id] = cleanEpMap;
      }
    }
  }

  if (isPlainObject(raw.userRatings)) {
    for (const id of safeKeys(raw.userRatings)) {
      const val = raw.userRatings[id];
      if (typeof val === 'number' && Number.isInteger(val) && val >= 1 && val <= 5) {
        base.userRatings[id] = val;
      }
    }
  }

  if (isPlainObject(raw.userNotes)) {
    for (const id of safeKeys(raw.userNotes)) {
      const note = raw.userNotes[id];
      if (typeof note === 'string') {
        const trimmed = note.trim().slice(0, MAX_NOTE_LENGTH);
        if (trimmed) {
          base.userNotes[id] = trimmed;
        }
      }
    }
  }

  if (isValidIsoDate(raw.targetDate)) {
    base.targetDate = raw.targetDate;
  }

  if (typeof raw.nick === 'string') {
    base.nick = sanitizeNick(raw.nick);
  }

  return base;
}

/**
 * Parsea una cadena SemVer estricta (MAJOR.MINOR.PATCH).
 */
export function parseSemver(version) {
  if (typeof version !== 'string') return null;
  const match = SEMVER_RE.exec(version.trim());
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    raw: match[0],
  };
}

/**
 * Evalúa la compatibilidad SemVer entre la versión importada y la versión actual del esquema.
 * - Sin schemaVersion: 'legacy' (compatible, copia anterior al versionado).
 * - Formato no SemVer: 'invalid' (incompatible).
 * - Mismo MAJOR: 'exact', 'compatible' o 'newer_minor' (compatible).
 * - Distinto MAJOR: 'incompatible'.
 */
export function checkSchemaCompatibility(
  importedVersion,
  currentVersion = PROGRESS_SCHEMA_VERSION,
) {
  const current = parseSemver(currentVersion);
  if (!current) {
    throw new Error('Versión interna de esquema inválida');
  }

  if (importedVersion === undefined || importedVersion === null || importedVersion === '') {
    return {
      status: 'legacy',
      compatible: true,
      importedVersion: null,
      currentVersion: current.raw,
    };
  }

  const imported = parseSemver(importedVersion);
  if (!imported) {
    const safeVersion = stripControlAndBidiChars(String(importedVersion).replace(/[\r\n\t]+/g, ' '))
      .trim()
      .slice(0, 32);
    return {
      status: 'invalid',
      compatible: false,
      importedVersion: safeVersion,
      currentVersion: current.raw,
    };
  }

  if (imported.major !== current.major) {
    return {
      status: 'incompatible',
      compatible: false,
      importedVersion: imported.raw,
      currentVersion: current.raw,
    };
  }

  if (imported.raw === current.raw) {
    return {
      status: 'exact',
      compatible: true,
      importedVersion: imported.raw,
      currentVersion: current.raw,
    };
  }

  if (imported.minor > current.minor) {
    return {
      status: 'newer_minor',
      compatible: true,
      importedVersion: imported.raw,
      currentVersion: current.raw,
    };
  }

  return {
    status: 'compatible',
    compatible: true,
    importedVersion: imported.raw,
    currentVersion: current.raw,
  };
}

/**
 * Devuelve un payload seguro y versionado para exportar (JSON o código de sincronización).
 * Nunca incluye omdbApiKey.
 * @param {any} progress
 * @param {{ includeNotes?: boolean, exportedAt?: string | null, nick?: string }} [options]
 */
export function getExportableProgress(progress, options = {}) {
  const normalized = normalizeUserProgress(progress);
  const includeNotes = options.includeNotes !== false;
  const nick = options.nick !== undefined ? sanitizeNick(options.nick) : normalized.nick;
  const exportedAt =
    options.exportedAt === null
      ? null
      : isValidIsoTimestamp(options.exportedAt)
        ? options.exportedAt
        : new Date().toISOString();

  /** @type {Record<string, any>} */
  const payload = {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    watchedItems: normalized.watchedItems,
    watchedEpisodes: normalized.watchedEpisodes,
    userRatings: normalized.userRatings,
    userNotes: includeNotes ? normalized.userNotes : {},
    targetDate: normalized.targetDate,
  };
  if (nick) payload.nick = nick;
  if (exportedAt) payload.exportedAt = exportedAt;
  return payload;
}

/**
 * Valida la compatibilidad SemVer del payload importado y devuelve el progreso normalizado
 * junto con metadatos de exportación (nick y exportedAt UTC).
 */
export function importProgressPayload(raw, current = null) {
  if (!isPlainObject(raw)) {
    throw new Error('Formato de progreso inválido');
  }

  const compatibility = checkSchemaCompatibility(raw.schemaVersion, PROGRESS_SCHEMA_VERSION);
  if (!compatibility.compatible) {
    if (compatibility.status === 'incompatible') {
      throw new Error(
        `Versión de esquema incompatible (v${compatibility.importedVersion}; esta app soporta v${parseSemver(PROGRESS_SCHEMA_VERSION).major}.x.x)`,
      );
    }
    throw new Error(`Versión de esquema no válida (${compatibility.importedVersion})`);
  }

  const nick = sanitizeNick(raw.nick);
  const exportedAt = isValidIsoTimestamp(raw.exportedAt) ? raw.exportedAt : null;

  return {
    progress: normalizeUserProgress(raw, current),
    compatibility,
    meta: { nick, exportedAt },
  };
}

/** @param {Uint8Array} bytes */
function bytesToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

/** @param {string} str */
function base64UrlToBytes(str) {
  if (typeof str !== 'string' || !BASE64URL_RE.test(str)) {
    throw new Error('Código Base64URL inválido');
  }
  const normalized = str.replaceAll('-', '+').replaceAll('_', '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** @param {ReadableStream<Uint8Array>} stream @param {number} maxBytes */
async function readStreamBytes(stream, maxBytes) {
  const reader = stream.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel('size-limit-exceeded').catch(() => {});
        throw new Error('Código demasiado grande');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/** @param {CompressionStream | DecompressionStream} transform @param {BufferSource} inputBytes @param {number} maxOutputBytes */
async function runTransformStream(transform, inputBytes, maxOutputBytes) {
  const writer = transform.writable.getWriter();
  const writePromise = writer.write(inputBytes).then(() => writer.close());
  writePromise.catch(() => {});
  try {
    const output = await readStreamBytes(transform.readable, maxOutputBytes);
    await writePromise;
    return output;
  } catch (err) {
    await writer.abort().catch(() => {});
    throw err;
  } finally {
    writer.releaseLock();
  }
}

export function encodeSyncCode(progress, options = {}) {
  const jsonStr = JSON.stringify(getExportableProgress(progress, options));
  return btoa(encodeURIComponent(jsonStr));
}

/**
 * Codifica el progreso comprimido con deflate-raw (nativo del navegador) + Base64URL
 * con prefijo `z1.` para URLs/deeplinks compactos. Hace fallback al código plano si
 * CompressionStream no está disponible.
 * @param {any} progress
 * @param {{ includeNotes?: boolean, exportedAt?: string | null, nick?: string }} [options]
 */
export async function encodeCompressedSyncCode(progress, options = {}) {
  const jsonStr = JSON.stringify(getExportableProgress(progress, options));
  const inputBytes = new TextEncoder().encode(jsonStr);
  if (inputBytes.byteLength > MAX_IMPORT_FILE_BYTES) {
    throw new Error('Código demasiado grande');
  }
  if (typeof CompressionStream === 'undefined') {
    return btoa(encodeURIComponent(jsonStr));
  }
  const compressed = await runTransformStream(
    new CompressionStream('deflate-raw'),
    inputBytes,
    MAX_SYNC_CODE_LENGTH,
  );
  return `${COMPRESSED_CODE_PREFIX}${bytesToBase64Url(compressed)}`;
}

export function extractSyncCodeFromHash(hash) {
  if (typeof hash !== 'string' || !hash || hash.length > MAX_SYNC_CODE_LENGTH + 64) return null;
  const cleaned = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!cleaned) return null;
  const params = new URLSearchParams(cleaned);
  const value = params.get(DEEPLINK_HASH_PARAM);
  return value ? value.trim() : null;
}

export function buildShareDeeplink(baseHref, code) {
  const url = new URL(baseHref);
  url.search = '';
  url.hash = `${DEEPLINK_HASH_PARAM}=${encodeURIComponent(code)}`;
  return url.toString();
}

export function decodeSyncCodeWithMeta(code, current = null) {
  const trimmed = String(code ?? '').trim();
  if (!trimmed) {
    throw new Error('Código vacío');
  }
  if (trimmed.length > MAX_SYNC_CODE_LENGTH) {
    throw new Error('Código demasiado grande');
  }
  const decoded = decodeURIComponent(atob(trimmed));
  const parsed = JSON.parse(decoded);
  return importProgressPayload(parsed, current);
}

/**
 * Decodifica cualquier código de sincronización: comprimido (`z1.<base64url>`),
 * plano (Base64 clásico) o incluso una URL deeplink completa pegada directamente.
 */
export async function decodeAnySyncCodeWithMeta(input, current = null) {
  let trimmed = String(input ?? '').trim();
  if (!trimmed) {
    throw new Error('Código vacío');
  }
  if (trimmed.length > MAX_SYNC_CODE_LENGTH + 256) {
    throw new Error('Código demasiado grande');
  }
  // Si el usuario pega el enlace completo en el cuadro de código rápido, extraer #sync=...
  const hashIdx = trimmed.indexOf('#');
  if (hashIdx !== -1) {
    const extracted = extractSyncCodeFromHash(trimmed.slice(hashIdx));
    if (extracted) trimmed = extracted;
  }
  if (trimmed.length > MAX_SYNC_CODE_LENGTH) {
    throw new Error('Código demasiado grande');
  }
  if (trimmed.startsWith(COMPRESSED_CODE_PREFIX)) {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('Descompresión no soportada en este navegador');
    }
    const payloadStr = trimmed.slice(COMPRESSED_CODE_PREFIX.length);
    const compressedBytes = base64UrlToBytes(payloadStr);
    const decompressed = await runTransformStream(
      new DecompressionStream('deflate-raw'),
      compressedBytes,
      MAX_IMPORT_FILE_BYTES,
    );
    const jsonStr = new TextDecoder('utf-8', { fatal: true }).decode(decompressed);
    const parsed = JSON.parse(jsonStr);
    return importProgressPayload(parsed, current);
  }
  return decodeSyncCodeWithMeta(trimmed, current);
}

export function decodeSyncCode(code, current = null) {
  return decodeSyncCodeWithMeta(code, current).progress;
}

/**
 * @typedef {{ getItem?: (key: string) => string | null, setItem?: (key: string, value: string) => void, removeItem?: (key: string) => void }} StorageLike
 */

/** @param {StorageLike} [storage] */
export function loadOmdbApiKey(storage = globalThis.localStorage) {
  try {
    const dedicated = storage?.getItem(OMDB_STORAGE_KEY);
    if (dedicated) return dedicated.trim();

    // Migración transparente desde el almacenamiento antiguo dentro de userProgress
    const legacyRaw = storage?.getItem(LOCAL_STORAGE_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      if (parsed && typeof parsed.omdbApiKey === 'string' && parsed.omdbApiKey.trim()) {
        const key = parsed.omdbApiKey.trim();
        storage.setItem(OMDB_STORAGE_KEY, key);
        return key;
      }
    }
  } catch {
    // Ignorar errores de almacenamiento (modo privado, cuota, etc.)
  }
  return '';
}

/** @param {string} key @param {StorageLike} [storage] */
export function saveOmdbApiKeyToStorage(key, storage = globalThis.localStorage) {
  try {
    const cleaned = String(key ?? '').trim();
    if (cleaned) {
      storage?.setItem(OMDB_STORAGE_KEY, cleaned);
    } else {
      storage?.removeItem(OMDB_STORAGE_KEY);
    }
  } catch {
    // Ignorar errores de almacenamiento
  }
}

/** @param {StorageLike} [storage] */
export function loadExternalMediaPref(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(EXTERNAL_MEDIA_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/** @param {boolean} enabled @param {StorageLike} [storage] */
export function saveExternalMediaPref(enabled, storage = globalThis.localStorage) {
  try {
    if (enabled) {
      storage?.setItem(EXTERNAL_MEDIA_STORAGE_KEY, 'true');
    } else {
      storage?.removeItem(EXTERNAL_MEDIA_STORAGE_KEY);
    }
  } catch {
    // Ignorar errores de almacenamiento
  }
}

/** @param {StorageLike} [storage] */
export function loadProgressFromStorage(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return createDefaultProgress();
    const parsed = JSON.parse(raw);
    return normalizeUserProgress(parsed);
  } catch {
    return createDefaultProgress();
  }
}

/** @param {any} progress @param {StorageLike} [storage] */
export function saveProgressToStorage(progress, storage = globalThis.localStorage) {
  try {
    if (!storage) return false;
    storage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify(getExportableProgress(progress, { exportedAt: null })),
    );
    return true;
  } catch {
    return false;
  }
}
