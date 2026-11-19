export const LOCAL_STORAGE_KEY = 'mcu_multiverse_master_progress_v2';
export const OMDB_STORAGE_KEY = 'mcu_multiverse_omdb_key_v1';
export const EXTERNAL_MEDIA_STORAGE_KEY = 'mcu_multiverse_external_media_v1';
export const DEFAULT_TARGET_DATE = '2026-12-18';
export const MAX_NOTE_LENGTH = 2000;
export const MAX_MAP_ENTRIES = 1000;
export const MAX_SYNC_CODE_LENGTH = 512 * 1024;
export const MAX_IMPORT_FILE_BYTES = 512 * 1024;

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

export function createDefaultProgress(targetDate = DEFAULT_TARGET_DATE) {
  return {
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
    current && isValidIsoDate(current.targetDate)
      ? current.targetDate
      : DEFAULT_TARGET_DATE;

  const base = createDefaultProgress(fallbackDate);
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

  return base;
}

/**
 * Devuelve un payload seguro para exportar (JSON o código de sincronización).
 * Nunca incluye omdbApiKey.
 */
export function getExportableProgress(progress) {
  const normalized = normalizeUserProgress(progress);
  return {
    watchedItems: normalized.watchedItems,
    watchedEpisodes: normalized.watchedEpisodes,
    userRatings: normalized.userRatings,
    userNotes: normalized.userNotes,
    targetDate: normalized.targetDate,
  };
}

export function encodeSyncCode(progress) {
  const jsonStr = JSON.stringify(getExportableProgress(progress));
  return btoa(encodeURIComponent(jsonStr));
}

export function decodeSyncCode(code, current = null) {
  const trimmed = String(code ?? '').trim();
  if (!trimmed) {
    throw new Error('Código vacío');
  }
  if (trimmed.length > MAX_SYNC_CODE_LENGTH) {
    throw new Error('Código demasiado grande');
  }
  const decoded = decodeURIComponent(atob(trimmed));
  const parsed = JSON.parse(decoded);
  if (!isPlainObject(parsed)) {
    throw new Error('Formato de progreso inválido');
  }
  return normalizeUserProgress(parsed, current);
}

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

export function loadExternalMediaPref(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(EXTERNAL_MEDIA_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

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

export function saveProgressToStorage(progress, storage = globalThis.localStorage) {
  try {
    if (!storage) return false;
    storage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(getExportableProgress(progress)));
    return true;
  } catch {
    return false;
  }
}
