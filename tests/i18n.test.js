import { describe, expect, test } from 'bun:test';
import {
  LANG_STORAGE_KEY,
  TRANSLATIONS,
  detectInitialLang,
  getLang,
  setLang,
  t,
  getLocalizedPhase,
  loadCatalogTranslations,
  getLocalizedItemSynopsis,
  getLocalizedSeasonNote,
} from '../src/i18n.js';
import { MCU_CATALOG } from '../src/catalog.js';
import { getCategoryColors, getShortSagaName, getItemSagaMeta } from '../src/logic.js';

function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

describe('i18n (ES / EN)', () => {
  test('paridad exacta de claves entre diccionarios ES y EN', () => {
    const esKeys = Object.keys(TRANSLATIONS.es).toSorted();
    const enKeys = Object.keys(TRANSLATIONS.en).toSorted();
    expect(enKeys).toEqual(esKeys);
  });

  test('detectInitialLang prioriza localStorage y hace fallback a navigator.language', () => {
    expect(detectInitialLang(createMemoryStorage({ [LANG_STORAGE_KEY]: 'en' }), 'es-ES')).toBe(
      'en',
    );
    expect(detectInitialLang(createMemoryStorage({ [LANG_STORAGE_KEY]: 'es' }), 'en-US')).toBe(
      'es',
    );
    expect(detectInitialLang(createMemoryStorage(), 'en-GB')).toBe('en');
    expect(detectInitialLang(createMemoryStorage(), 'es-MX')).toBe('es');
    expect(detectInitialLang(createMemoryStorage(), 'fr-FR')).toBe('es');
  });

  test('setLang persiste el idioma y actualiza getLang y t()', () => {
    const storage = createMemoryStorage();
    expect(setLang('en', storage)).toBe('en');
    expect(getLang()).toBe('en');
    expect(storage.getItem(LANG_STORAGE_KEY)).toBe('en');
    expect(t('header.savedLocal')).toBe('Saved locally');
    expect(t('stats.titlesWatched', { completed: 5, total: 124 })).toBe('5 / 124 titles watched');

    expect(setLang('es', storage)).toBe('es');
    expect(getLang()).toBe('es');
    expect(t('header.savedLocal')).toBe('Guardado local');
  });

  test('getLocalizedPhase traduce fases y eras al inglés', () => {
    expect(getLocalizedPhase('Fase 1', 'en')).toBe('Phase 1');
    expect(getLocalizedPhase('Era Multiversal Fox/Sony', 'en')).toBe('Fox/Sony Multiverse Era');
    expect(getLocalizedPhase('Fase 1', 'es')).toBe('Fase 1');
  });

  test('loadCatalogTranslations y getters de sinopsis/notas en inglés', async () => {
    await loadCatalogTranslations('en');
    const wanda = MCU_CATALOG.find((i) => i.title.includes('WandaVision'));
    expect(wanda).toBeDefined();
    if (!wanda) return;

    const esSyn = getLocalizedItemSynopsis(wanda, 'es');
    const enSyn = getLocalizedItemSynopsis(wanda, 'en');
    expect(enSyn).not.toBe(esSyn);
    expect(enSyn.length).toBeGreaterThan(20);

    const notedItem = MCU_CATALOG.find((i) => i.seasons?.some((s) => Boolean(s.note)));
    expect(notedItem).toBeDefined();
    if (!notedItem || !notedItem.seasons) return;
    const notedSeason = notedItem.seasons.find((s) => Boolean(s.note));
    expect(notedSeason).toBeDefined();
    if (!notedSeason) return;
    const enNote = getLocalizedSeasonNote(notedItem, notedSeason, 'en');
    expect(enNote.length).toBeGreaterThan(0);
    expect(enNote).not.toBe(notedSeason.note);
  });

  test('logic.js localiza categorías y bloques de saga en inglés', () => {
    expect(getCategoryColors('Película UCM', 'en').label).toBe('MCU Movie');
    expect(getCategoryColors('Película UCM', 'es').label).toBe('Película UCM');
    expect(getShortSagaName('Fase 1', 'en')).toBe('The Infinity Saga');
    expect(getShortSagaName('Fase 4', 'en')).toBe('The Multiverse Saga');

    const ironMan = MCU_CATALOG.find((i) => i.phase === 'Fase 1');
    expect(ironMan).toBeDefined();
    if (!ironMan) return;
    const metaEn = getItemSagaMeta(ironMan, 'release', 'strict_phases', 'en');
    expect(metaEn.title).toContain('Phase 1');
    expect(metaEn.saga).toBe('THE INFINITY SAGA');
  });
});
