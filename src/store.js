export const LOCAL_STORAGE_KEY = 'mcu_multiverse_master_progress_v2';
export const OMDB_STORAGE_KEY = 'mcu_multiverse_omdb_key_v1';
export const EXTERNAL_MEDIA_STORAGE_KEY = 'mcu_multiverse_external_media_v1';
export const DEFAULT_TARGET_DATE = '2026-12-18';

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function safeKeys(obj) {
  return Object.keys(obj).filter(
    (k) => Object.prototype.hasOwnProperty.call(obj, k) && !FORBIDDEN_KEYS.has(k)
  );
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
        const trimmed = note.trim();
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
    storage?.setItem(LOCAL_STORAGE_KEY, JSON.stringify(getExportableProgress(progress)));
  } catch {
    // Ignorar errores de almacenamiento
  }
}

// Estado de sincronización en la nube (Firebase cargado dinámicamente solo si existe configuración)
let db = null;
let auth = null;
let currentUser = null;
let firestoreDocFn = null;
let firestoreSetDocFn = null;
let unsubscribeSnapshot = null;

function getAppId() {
  return typeof globalThis.__app_id !== 'undefined' ? globalThis.__app_id : 'mcu-master-checklist';
}

export async function initCloudPersistence({ onRemoteProgress, onStatusChange }) {
  try {
    const rawConfig = typeof globalThis.__firebase_config !== 'undefined' ? globalThis.__firebase_config : null;
    if (!rawConfig) {
      onStatusChange?.('Guardado en LocalStorage', 'emerald');
      return;
    }

    const firebaseConfig = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig;

    // Import dinámico: no se descargan módulos de Firebase en despliegues estándar
    const firebaseAppUrl = 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
    const firebaseAuthUrl = 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
    const firebaseFirestoreUrl = 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

    const [{ initializeApp }, { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged }, { getFirestore, doc, setDoc, onSnapshot }] =
      await Promise.all([
        import(/* @vite-ignore */ firebaseAppUrl),
        import(/* @vite-ignore */ firebaseAuthUrl),
        import(/* @vite-ignore */ firebaseFirestoreUrl),
      ]);

    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    firestoreDocFn = doc;
    firestoreSetDocFn = setDoc;

    if (typeof globalThis.__initial_auth_token !== 'undefined' && globalThis.__initial_auth_token) {
      await signInWithCustomToken(auth, globalThis.__initial_auth_token);
    } else {
      await signInAnonymously(auth);
    }

    onAuthStateChanged(auth, (user) => {
      // Cancelar cualquier suscripción previa antes de crear una nueva
      if (typeof unsubscribeSnapshot === 'function') {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      currentUser = user;
      if (!currentUser) return;

      const stateDocRef = doc(db, 'artifacts', getAppId(), 'users', currentUser.uid, 'mcu_checklist_data', 'user_state');
      unsubscribeSnapshot = onSnapshot(
        stateDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data && data.payload) {
              try {
                const parsed = JSON.parse(data.payload);
                onRemoteProgress?.(parsed);
              } catch (e) {
                console.error('Error parsing stored state:', e);
              }
            }
          }
          onStatusChange?.('Guardado automático activo', 'emerald');
        },
        (err) => {
          console.error('Snapshot error:', err);
          onStatusChange?.('Guardado en LocalStorage', 'emerald');
        }
      );
    });
  } catch (err) {
    console.error('Init persistence warning:', err);
    onStatusChange?.('Guardado en LocalStorage', 'emerald');
  }
}

export async function saveProgressToCloud(progress) {
  if (!db || !currentUser || !firestoreDocFn || !firestoreSetDocFn) return;
  try {
    const stateDocRef = firestoreDocFn(
      db,
      'artifacts',
      getAppId(),
      'users',
      currentUser.uid,
      'mcu_checklist_data',
      'user_state'
    );
    await firestoreSetDocFn(stateDocRef, {
      payload: JSON.stringify(getExportableProgress(progress)),
      updatedAt: Date.now(),
    });
  } catch (e) {
    console.error('Save error:', e);
  }
}
