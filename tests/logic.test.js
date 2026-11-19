import { describe, expect, test } from 'bun:test';
import {
  getItemCompletionStatus,
  getFilteredAndSortedCatalog,
  computeGlobalStats,
  computeMarathonPlan,
  getItemSagaMeta,
} from '../src/logic.js';
import { createDefaultProgress } from '../src/store.js';

const MOCK_CATALOG = [
  {
    id: 'movie_1',
    title: 'Iron Man',
    year: '2008',
    releaseDate: '2008-05-02',
    releaseOrder: 1,
    chronoSort: 10,
    chronoOrder: 2,
    category: 'Película UCM',
    phase: 'Fase 1',
    runtimeMins: 126,
    doomsdayEssential: true,
    timelineYear: '2008',
    synopsis: 'Tony Stark construye la armadura.',
  },
  {
    id: 'series_1',
    title: 'Loki',
    year: '2021',
    releaseDate: '2021-06-09',
    releaseOrder: 2,
    chronoSort: 1,
    chronoOrder: 1,
    category: 'Serie Disney+',
    phase: 'Fase 4',
    runtimeMins: 300,
    doomsdayEssential: true,
    timelineYear: 'Fuera del tiempo',
    synopsis: 'La AVT y el multiverso.',
    seasons: [
      {
        seasonNumber: 1,
        episodes: [
          { code: 'S1E1', title: 'Ep 1' },
          { code: 'S1E2', title: 'Ep 2' },
        ],
      },
    ],
  },
  {
    id: 'empty_series',
    title: 'Serie Sin Episodios',
    year: '2026',
    releaseDate: '2026-01-01',
    releaseOrder: 3,
    chronoSort: 20,
    chronoOrder: 3,
    category: 'Serie Disney+',
    phase: 'Fase 6',
    runtimeMins: 240,
    doomsdayEssential: false,
    timelineYear: '2026',
    synopsis: 'Caso límite sin episodios.',
    seasons: [{ seasonNumber: 1, episodes: [] }],
  },
];

describe('getItemCompletionStatus y computeGlobalStats', () => {
  test('calcula estados pending, in_progress y completed correctamente', () => {
    const progress = createDefaultProgress();
    expect(getItemCompletionStatus(MOCK_CATALOG[0], progress).status).toBe('pending');

    progress.watchedItems.movie_1 = true;
    expect(getItemCompletionStatus(MOCK_CATALOG[0], progress).status).toBe('completed');

    progress.watchedEpisodes.series_1 = { S1E1: true };
    const partial = getItemCompletionStatus(MOCK_CATALOG[1], progress);
    expect(partial).toEqual({ status: 'in_progress', watchedCount: 1, totalCount: 2, percent: 50 });

    progress.watchedEpisodes.series_1.S1E2 = true;
    expect(getItemCompletionStatus(MOCK_CATALOG[1], progress).status).toBe('completed');
  });

  test('no produce NaN si una serie tiene 0 episodios', () => {
    const progress = createDefaultProgress();
    const stats = computeGlobalStats(MOCK_CATALOG, progress);
    expect(Number.isNaN(stats.remainingMinutes)).toBe(false);
    expect(Number.isNaN(stats.remainingHours)).toBe(false);
    expect(stats.totalEpisodes).toBe(2);
  });
});

describe('getFilteredAndSortedCatalog', () => {
  test('filtra por búsqueda, categoría, doomsdayOnly y ordena por publicación o cronológico', () => {
    const progress = createDefaultProgress();
    const baseFilters = {
      orderMode: 'release',
      groupMode: 'interleaved_sagas',
      category: 'all',
      phase: 'all',
      status: 'all',
      doomsdayOnly: false,
      search: '',
    };

    const byRelease = getFilteredAndSortedCatalog(MOCK_CATALOG, baseFilters, progress);
    expect(byRelease.map((i) => i.id)).toEqual(['movie_1', 'series_1', 'empty_series']);

    const byChrono = getFilteredAndSortedCatalog(MOCK_CATALOG, { ...baseFilters, orderMode: 'chrono' }, progress);
    expect(byChrono.map((i) => i.id)).toEqual(['series_1', 'movie_1', 'empty_series']);

    const doomsday = getFilteredAndSortedCatalog(MOCK_CATALOG, { ...baseFilters, doomsdayOnly: true }, progress);
    expect(doomsday.map((i) => i.id)).toEqual(['movie_1', 'series_1']);

    const searched = getFilteredAndSortedCatalog(MOCK_CATALOG, { ...baseFilters, search: 'multiverso' }, progress);
    expect(searched.map((i) => i.id)).toEqual(['series_1']);
  });
});

describe('computeMarathonPlan y getItemSagaMeta', () => {
  test('calcula ritmo diario y próximo recomendado según el alcance', () => {
    const progress = createDefaultProgress('2026-12-18');
    progress.watchedItems.movie_1 = true;

    const filterState = {
      orderMode: 'release',
      groupMode: 'interleaved_sagas',
      category: 'all',
      phase: 'all',
      status: 'all',
      doomsdayOnly: false,
      search: '',
    };

    const now = new Date('2026-12-08T12:00:00Z');
    const plan = computeMarathonPlan(MOCK_CATALOG, filterState, progress, 'doomsday', now);
    expect(plan.pendingTitles).toBe(1);
    expect(plan.nextItem?.id).toBe('series_1');
    expect(plan.pendingMinutes).toBe(300);
    expect(plan.daysLeft).toBeGreaterThanOrEqual(10);
  });

  test('usa fa-a en minúsculas para Fase 1 en todos los modos', () => {
    expect(getItemSagaMeta(MOCK_CATALOG[0], 'release', 'strict_phases').icon).toBe('fa-a');
    expect(getItemSagaMeta(MOCK_CATALOG[0], 'release', 'interleaved_sagas').icon).toBe('fa-a');
    expect(getItemSagaMeta({ ...MOCK_CATALOG[0], chronoSort: 25 }, 'chrono', 'interleaved_sagas').icon).toBe('fa-a');
  });
});
