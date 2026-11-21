import { getLang, t } from './i18n.js';

const SAGA_META_EN = {
  strict_fase_1: {
    saga: 'THE INFINITY SAGA',
    title: 'Phase 1: Avengers Assembled (2008–2012)',
    subtitle: 'The birth of the founding heroes and the first gathering of the Avengers',
  },
  strict_fase_2: {
    saga: 'THE INFINITY SAGA',
    title: 'Phase 2: Cosmic Expansion & Fall of S.H.I.E.L.D. (2013–2015)',
    subtitle: 'From the aftermath of New York to the Age of Ultron and the Quantum Realm',
  },
  strict_fase_3: {
    saga: 'THE INFINITY SAGA',
    title: 'Phase 3: Civil War & Infinity War (2016–2019)',
    subtitle: 'From the fracture of the Avengers to the Snap and Avengers: Endgame',
  },
  strict_era_marvel_tv: {
    saga: 'MARVEL TELEVISION ERA',
    title: 'ABC, Netflix (The Defenders) & Hulu / Freeform Series (2013–2020)',
    subtitle:
      'Agents of S.H.I.E.L.D., Agent Carter, Daredevil, Jessica Jones, Punisher, Runaways & Cloak & Dagger',
  },
  strict_era_fox_sony: {
    saga: 'MULTIVERSAL LEGACY',
    title: 'Fox Era (X-Men, Deadpool, F4) & Sony / Spider-Verse (2000–2024)',
    subtitle:
      'Parallel Earths whose heroes converge in No Way Home, Deadpool & Wolverine, and Doomsday',
  },
  strict_fase_4: {
    saga: 'THE MULTIVERSE SAGA',
    title: 'Phase 4: Awakening of the Multiverse & New Legacies (2021–2022)',
    subtitle:
      'From WandaVision and Loki S1 to Spider-Man: No Way Home, Multiverse of Madness, and Wakanda Forever',
  },
  strict_fase_5: {
    saga: 'THE MULTIVERSE SAGA',
    title: 'Phase 5: Incursions, TVA & New Avengers (2023–2025)',
    subtitle:
      'From Quantumania and Loki S2 to Deadpool & Wolverine, Daredevil: Born Again, and Thunderbolts*',
  },
  strict_fase_6: {
    saga: 'THE MULTIVERSE SAGA',
    title: 'Phase 6: Final Collision — Doomsday & Secret Wars (2025–2027)',
    subtitle:
      'The Fantastic Four: First Steps, Spider-Man: Brand New Day, VisionQuest, Doomsday, and Secret Wars',
  },
  chrono_era_1: {
    saga: 'MCU ORIGINS & S.S.R. ERA',
    title: 'Era 1: Antiquity, World War II & Post-War (1200 BC – 1947)',
    subtitle: 'Eyes of Wakanda, The First Avenger, and both seasons of Agent Carter',
  },
  chrono_era_2: {
    saga: 'EARLY MULTIVERSAL & COSMIC ERA',
    title: 'Era 2: 1960s–1990s — First Mutants, Earth-828 & Captain Marvel (1962–1995)',
    subtitle: 'X-Men in the 60s–90s, The Fantastic Four on Earth-828, and Carol Danvers in 1995',
  },
  chrono_era_3: {
    saga: 'PRE-MCU ERA: FOX & SONY LEGACY',
    title: 'Era 3: Dawn of the Multiverse Heroes (2000–2007)',
    subtitle:
      'Original X-Men trilogy, Sam Raimi Spider-Man trilogy, Daredevil (2003), and Fantastic Four (2005)',
  },
  chrono_fase_1: {
    saga: 'THE INFINITY SAGA • PHASE 1',
    title: 'Chronological Phase 1: The Avengers Initiative (2008–2012)',
    subtitle: 'From Iron Man to the Battle of New York in The Avengers (+ The Amazing Spider-Man)',
  },
  chrono_fase_2: {
    saga: 'THE INFINITY SAGA • PHASE 2 + ABC & NETFLIX',
    title: 'Chronological Phase 2: Fall of S.H.I.E.L.D., Defenders & Age of Ultron (2013–2015)',
    subtitle:
      'Phase 2 films interleaved with Agents of S.H.I.E.L.D. (S1–S2), Daredevil (S1–S2), Jessica Jones (S1), and Luke Cage (S1)',
  },
  chrono_fase_3: {
    saga: 'THE INFINITY SAGA • PHASE 3 + MARVEL TV & MULTIVERSE',
    title: 'Chronological Phase 3: From Civil War to Avengers: Infinity War (2016–2018)',
    subtitle:
      'Phase 3 films interleaved with Agents of S.H.I.E.L.D. (S3–S5), The Defenders, Punisher, Runaways, Cloak & Dagger, Deadpool, and Venom',
  },
  chrono_blip_endgame: {
    saga: 'THE INFINITY SAGA • THE BLIP & CLIMAX',
    title: 'Phase 3 (Epilogue): The Blip Years & Avengers: Endgame (2019–2023)',
    subtitle:
      'Agents of S.H.I.E.L.D. (S6–S7), Helstrom, Spider-Verse ties, and the final battle against Thanos',
  },
  chrono_fase_4: {
    saga: 'THE MULTIVERSE SAGA • PHASE 4',
    title: 'Chronological Phase 4: The TVA & First Cracks in the Multiverse (2023–2025)',
    subtitle:
      'Loki (S1–S2), WandaVision, No Way Home, Multiverse of Madness, Wakanda Forever, and new Disney+ series',
  },
  chrono_fase_5: {
    saga: 'THE MULTIVERSE SAGA • PHASE 5',
    title: 'Chronological Phase 5: Incursions, Mayor Fisk & New Avengers (2026–2027)',
    subtitle:
      'From Quantumania, Guardians Vol. 3, and The Marvels to Daredevil: Born Again (S1), Brave New World, and Thunderbolts*',
  },
  chrono_fase_6: {
    saga: 'THE MULTIVERSE SAGA • PHASE 6',
    title: 'Chronological Phase 6: Road to Avengers: Doomsday & Secret Wars (2027–2029)',
    subtitle:
      'Born Again (S2), Spider-Man: Brand New Day, VisionQuest, Logan, Deadpool & Wolverine, Doomsday, and Secret Wars',
  },
  rel_era_pre_mcu: {
    saga: 'PRE-MCU ERA: FOX & SONY LEGACY',
    title: 'Pre-MCU Era: X-Men, Spider-Man (Raimi), Daredevil & Fantastic Four (2000–2007)',
    subtitle:
      'Foundational classics whose casts return in No Way Home, Deadpool & Wolverine, and Doomsday',
  },
  rel_fase_1: {
    saga: 'THE INFINITY SAGA • PHASE 1',
    title: 'Phase 1 (2008–2012): From Iron Man to The Avengers',
    subtitle: 'Phase 1 movies, One-Shots, and prelude comics (+ 2009–2012 multiverse releases)',
  },
  rel_fase_2: {
    saga: 'THE INFINITY SAGA • PHASE 2 + ABC / NETFLIX ERA',
    title: 'Phase 2 (2013–2015): From Iron Man 3 to Ant-Man + S.H.I.E.L.D. & Daredevil Debut',
    subtitle:
      'Phase 2 films interleaved by release date with Agents of S.H.I.E.L.D. (S1–S2), Agent Carter (S1), Daredevil (S1), and Jessica Jones (S1)',
  },
  rel_fase_3: {
    saga: 'THE INFINITY SAGA • PHASE 3 + MARVEL TV CLIMAX',
    title: 'Phase 3 (2016–2020): From Civil War to Endgame & Far From Home',
    subtitle:
      'Interleaved with The Defenders, Punisher, S.H.I.E.L.D. (S3–S7), Runaways, Cloak & Dagger, Deadpool, and Logan',
  },
  rel_fase_4: {
    saga: 'THE MULTIVERSE SAGA • PHASE 4',
    title: 'Phase 4 (2021–2022): From WandaVision to Black Panther: Wakanda Forever',
    subtitle: 'Debut of Marvel Studios Disney+ series and opening of the Multiverse in theaters',
  },
  rel_fase_5: {
    saga: 'THE MULTIVERSE SAGA • PHASE 5',
    title: 'Phase 5 (2023 – June 2025): From Quantumania to Thunderbolts* & Ironheart',
    subtitle:
      'Guardians Vol. 3, Loki S2, The Marvels, Deadpool & Wolverine, Daredevil: Born Again S1, Brave New World, and Thunderbolts*',
  },
  rel_fase_6: {
    saga: 'THE MULTIVERSE SAGA • PHASE 6',
    title:
      'Phase 6 (July 2025 – 2027): From The Fantastic Four: First Steps to Doomsday & Secret Wars',
    subtitle:
      'Eyes of Wakanda, Wonder Man, Born Again S2, Spider-Man: Brand New Day, VisionQuest, Doomsday, and Secret Wars',
  },
};

function localizeSagaMeta(meta, lang) {
  if (lang !== 'en' || !SAGA_META_EN[meta.id]) return meta;
  return { ...meta, ...SAGA_META_EN[meta.id] };
}

export function getItemCompletionStatus(item, userProgress) {
  const isSeries = Array.isArray(item.seasons) && item.seasons.length > 0;
  if (!isSeries) {
    const done = Boolean(userProgress.watchedItems[item.id]);
    return {
      status: done ? 'completed' : 'pending',
      watchedCount: done ? 1 : 0,
      totalCount: 1,
      percent: done ? 100 : 0,
    };
  }

  const epMap = userProgress.watchedEpisodes[item.id] || {};
  let totalCount = 0;
  let watchedCount = 0;
  item.seasons.forEach((s) => {
    (s.episodes || []).forEach((ep) => {
      totalCount++;
      if (epMap[ep.code]) watchedCount++;
    });
  });

  const percent = totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0;
  let status = 'pending';
  if (watchedCount > 0 && watchedCount < totalCount) status = 'in_progress';
  else if (watchedCount === totalCount && totalCount > 0) status = 'completed';

  return { status, watchedCount, totalCount, percent };
}

export function getFilteredAndSortedCatalog(catalog, filterState, userProgress) {
  const q = (filterState.search || '').trim().toLowerCase();
  const list = catalog.filter((item) => {
    if (filterState.category !== 'all' && item.category !== filterState.category) return false;
    if (filterState.phase !== 'all' && item.phase !== filterState.phase) return false;
    if (filterState.doomsdayOnly && !item.doomsdayEssential) return false;

    const comp = getItemCompletionStatus(item, userProgress);
    if (filterState.status !== 'all' && comp.status !== filterState.status) return false;

    if (q) {
      const haystack =
        `${item.title} ${item.year} ${item.synopsis} ${item.category} ${item.phase} ${item.timelineYear}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  list.sort((a, b) => {
    if (filterState.orderMode === 'chrono') {
      return a.chronoOrder - b.chronoOrder;
    }
    return a.releaseOrder - b.releaseOrder;
  });

  return list;
}

export function computeGlobalStats(catalog, userProgress) {
  const totalItems = catalog.length;
  let completedItems = 0;
  let totalEpisodes = 0;
  let watchedEpisodes = 0;
  let remainingMinutes = 0;

  catalog.forEach((item) => {
    const comp = getItemCompletionStatus(item, userProgress);
    if (comp.status === 'completed') completedItems++;

    if (Array.isArray(item.seasons) && item.seasons.length > 0) {
      totalEpisodes += comp.totalCount;
      watchedEpisodes += comp.watchedCount;
      const watchedFraction = comp.totalCount > 0 ? comp.watchedCount / comp.totalCount : 1;
      const unwatchedFraction = 1 - watchedFraction;
      remainingMinutes += Math.round((item.runtimeMins || 0) * unwatchedFraction);
    } else if (comp.status !== 'completed') {
      remainingMinutes += item.runtimeMins || 0;
    }
  });

  const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const remainingHours = Math.round(remainingMinutes / 60);

  return {
    totalItems,
    completedItems,
    percent,
    totalEpisodes,
    watchedEpisodes,
    remainingMinutes,
    remainingHours,
  };
}

export function computeMarathonPlan(
  catalog,
  filterState,
  userProgress,
  scope = 'filtered',
  now = new Date(),
) {
  const rawTarget = userProgress.targetDate || '2026-12-18';
  const parsedTarget = new Date(`${rawTarget}T23:59:59`);
  const isTargetValid = !Number.isNaN(parsedTarget.getTime());
  const targetStr = isTargetValid ? rawTarget : '2026-12-18';
  const targetDate = isTargetValid ? parsedTarget : new Date('2026-12-18T23:59:59');
  const diffMs = targetDate.getTime() - now.getTime();
  const daysLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  let pool = [];
  if (scope === 'filtered') {
    pool = getFilteredAndSortedCatalog(catalog, filterState, userProgress);
  } else if (scope === 'doomsday') {
    pool = catalog.filter((i) => i.doomsdayEssential);
  } else {
    pool = [...catalog];
  }

  pool.sort((a, b) =>
    filterState.orderMode === 'chrono'
      ? a.chronoOrder - b.chronoOrder
      : a.releaseOrder - b.releaseOrder,
  );

  let pendingMinutes = 0;
  let pendingTitles = 0;
  let pendingEpisodesOrMovies = 0;
  let nextItem = null;

  pool.forEach((item) => {
    const comp = getItemCompletionStatus(item, userProgress);
    if (comp.status !== 'completed') {
      pendingTitles++;
      if (!nextItem) nextItem = item;

      if (Array.isArray(item.seasons) && item.seasons.length > 0) {
        const remEps = comp.totalCount - comp.watchedCount;
        pendingEpisodesOrMovies += remEps;
        const fraction = comp.totalCount > 0 ? remEps / comp.totalCount : 1;
        pendingMinutes += Math.round((item.runtimeMins || 0) * fraction);
      } else {
        pendingEpisodesOrMovies += 1;
        pendingMinutes += item.runtimeMins || 0;
      }
    }
  });

  const pendingHours = Math.round((pendingMinutes / 60) * 10) / 10;
  const minsPerDay = Math.ceil(pendingMinutes / daysLeft);
  const epsPerDay = (pendingEpisodesOrMovies / daysLeft).toFixed(1);
  const hoursPerWeek = (pendingMinutes / 60 / Math.max(1, daysLeft / 7)).toFixed(1);
  const titlesPerWeek = (pendingTitles / Math.max(1, daysLeft / 7)).toFixed(1);

  return {
    targetDate: targetStr,
    isReached: diffMs <= 0,
    daysLeft,
    pendingMinutes,
    pendingHours,
    pendingTitles,
    pendingEpisodesOrMovies,
    minsPerDay,
    epsPerDay,
    hoursPerWeek,
    titlesPerWeek,
    nextItem,
  };
}

export function getCategoryColors(category, lang = getLang()) {
  const map = {
    'Película UCM': {
      label: t('cat.movie', undefined, lang),
      badge: 'bg-red-500/15 text-red-300 border-red-500/30',
    },
    'Serie Disney+': {
      label: t('cat.disneyPlus', undefined, lang),
      badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    },
    'Serie Netflix': {
      label: t('cat.netflix', undefined, lang),
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    },
    'Serie ABC': {
      label: t('cat.abc', undefined, lang),
      badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    },
    'Marvel TV Juvenil / Hulu': {
      label: t('cat.hulu', undefined, lang),
      badge: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    },
    'Legado Fox / Multiverso': {
      label: t('cat.fox', undefined, lang),
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    },
    'Universo Sony / Spider-Verse': {
      label: t('cat.sony', undefined, lang),
      badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    },
    'Cómic Canon': {
      label: t('cat.comic', undefined, lang),
      badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    },
    'Especial / Corto': {
      label: t('cat.special', undefined, lang),
      badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    },
  };
  return (
    map[category] || { label: category, badge: 'bg-gray-500/15 text-gray-300 border-gray-500/30' }
  );
}

export function getShortSagaName(phase, lang = getLang()) {
  if (phase === 'Fase 1' || phase === 'Fase 2' || phase === 'Fase 3') {
    return t('saga.shortInfinity', undefined, lang);
  }
  if (phase === 'Fase 4' || phase === 'Fase 5' || phase === 'Fase 6') {
    return t('saga.shortMultiverse', undefined, lang);
  }
  if (phase === 'Era Marvel Television') return t('saga.shortMarvelTv', undefined, lang);
  return t('saga.shortFoxSony', undefined, lang);
}

export function getItemSagaMeta(item, orderMode, groupMode, lang = getLang()) {
  return localizeSagaMeta(getRawItemSagaMeta(item, orderMode, groupMode), lang);
}

function getRawItemSagaMeta(item, orderMode, groupMode) {
  if (groupMode === 'strict_phases') {
    const phaseMap = {
      'Fase 1': {
        id: 'strict_fase_1',
        saga: 'LA SAGA DEL INFINITO',
        title: 'Fase 1: Avengers Assembled (2008–2012)',
        subtitle: 'El nacimiento de los héroes fundadores y la primera unión de los Vengadores',
        accent: 'from-red-600/25 via-red-900/10 to-transparent border-red-500/40',
        badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
        icon: 'fa-a',
        order: 1,
      },
      'Fase 2': {
        id: 'strict_fase_2',
        saga: 'LA SAGA DEL INFINITO',
        title: 'Fase 2: Expansión Cósmica y Caída de S.H.I.E.L.D. (2013–2015)',
        subtitle: 'De las secuelas de Nueva York a la era de Ultrón y el Reino Cuántico',
        accent: 'from-amber-600/25 via-amber-900/10 to-transparent border-amber-500/40',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: 'fa-robot',
        order: 2,
      },
      'Fase 3': {
        id: 'strict_fase_3',
        saga: 'LA SAGA DEL INFINITO',
        title: 'Fase 3: Guerra Civil y Guerra del Infinito (2016–2019)',
        subtitle: 'De la fractura de los Vengadores al Chasquido de Thanos y Avengers: Endgame',
        accent: 'from-purple-600/25 via-purple-900/10 to-transparent border-purple-500/40',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        icon: 'fa-infinity',
        order: 3,
      },
      'Era Marvel Television': {
        id: 'strict_era_marvel_tv',
        saga: 'ERA MARVEL TELEVISION',
        title: 'Series de ABC, Netflix (The Defenders) y Hulu / Freeform (2013–2020)',
        subtitle:
          'Agents of S.H.I.E.L.D., Agent Carter, Daredevil, Jessica Jones, Punisher, Runaways y Cloak & Dagger',
        accent: 'from-sky-600/25 via-sky-900/10 to-transparent border-sky-500/40',
        badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        icon: 'fa-shield-halved',
        order: 4,
      },
      'Era Multiversal Fox/Sony': {
        id: 'strict_era_fox_sony',
        saga: 'LEGADO MULTIVERSAL',
        title: 'Era Fox (X-Men, Deadpool, 4F) y Universo Sony / Spider-Verse (2000–2024)',
        subtitle:
          'Las Tierras paralelas cuyos héroes convergen en No Way Home, Deadpool & Wolverine y Doomsday',
        accent: 'from-indigo-600/25 via-indigo-900/10 to-transparent border-indigo-500/40',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        icon: 'fa-dna',
        order: 5,
      },
      'Fase 4': {
        id: 'strict_fase_4',
        saga: 'LA SAGA DEL MULTIVERSO',
        title: 'Fase 4: Despertar del Multiverso y Nuevos Legados (2021–2022)',
        subtitle:
          'De WandaVision y Loki T1 a Spider-Man: No Way Home, Multiverse of Madness y Wakanda Forever',
        accent: 'from-rose-600/25 via-rose-900/10 to-transparent border-rose-500/40',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        icon: 'fa-wand-magic-sparkles',
        order: 6,
      },
      'Fase 5': {
        id: 'strict_fase_5',
        saga: 'LA SAGA DEL MULTIVERSO',
        title: 'Fase 5: Incursiones, AVT y Nuevos Vengadores (2023–2025)',
        subtitle:
          'De Quantumania y Loki T2 a Deadpool & Wolverine, Daredevil: Born Again y Thunderbolts*',
        accent: 'from-blue-600/25 via-blue-900/10 to-transparent border-blue-500/40',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        icon: 'fa-asterisk',
        order: 7,
      },
      'Fase 6': {
        id: 'strict_fase_6',
        saga: 'LA SAGA DEL MULTIVERSO',
        title: 'Fase 6: Colisión Final — Doomsday y Secret Wars (2025–2027)',
        subtitle:
          'The Fantastic Four: First Steps, Spider-Man: Brand New Day, VisionQuest, Doomsday y Secret Wars',
        accent: 'from-emerald-600/25 via-emerald-900/10 to-transparent border-emerald-500/40',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: 'fa-mask',
        order: 8,
      },
    };
    return phaseMap[item.phase] || phaseMap['Fase 1'];
  }

  if (orderMode === 'chrono') {
    const c = item.chronoSort;
    if (c <= 6) {
      return {
        id: 'chrono_era_1',
        saga: 'ORÍGENES DEL UCM Y ERA S.S.R.',
        title: 'Era 1: Antigüedad, Segunda Guerra Mundial y Posguerra (1200 a.C. – 1947)',
        subtitle: 'Eyes of Wakanda, El Primer Vengador y las dos temporadas de Agent Carter',
        accent: 'from-amber-600/25 via-amber-900/10 to-transparent border-amber-500/40',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: 'fa-shield',
      };
    } else if (c <= 13) {
      return {
        id: 'chrono_era_2',
        saga: 'ERA MULTIVERSAL Y CÓSMICA TEMPRANA',
        title: 'Era 2: Años 60 a 90 — Primeros Mutantes, Tierra-828 y Captain Marvel (1962–1995)',
        subtitle:
          'X-Men en los años 60-90, Los 4 Fantásticos en Tierra-828 y el origen de Carol Danvers en 1995',
        accent: 'from-sky-600/25 via-sky-900/10 to-transparent border-sky-500/40',
        badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        icon: 'fa-star-of-life',
      };
    } else if (c <= 22) {
      return {
        id: 'chrono_era_3',
        saga: 'ERA PRE-UCM: LEGADO FOX Y SONY',
        title: 'Era 3: Amanecer de los Héroes del Multiverso (2000–2007)',
        subtitle:
          'Trilogía X-Men original, Trilogía Spider-Man de Sam Raimi, Daredevil (2003) y 4 Fantásticos (2005)',
        accent: 'from-indigo-600/25 via-indigo-900/10 to-transparent border-indigo-500/40',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        icon: 'fa-dna',
      };
    } else if (c <= 32) {
      return {
        id: 'chrono_fase_1',
        saga: 'LA SAGA DEL INFINITO • FASE 1',
        title: 'Fase 1 Cronológica: La Iniciativa Vengadores (2008–2012)',
        subtitle:
          'De Iron Man a la Batalla de Nueva York en The Avengers (+ The Amazing Spider-Man)',
        accent: 'from-red-600/25 via-red-900/10 to-transparent border-red-500/40',
        badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
        icon: 'fa-a',
      };
    } else if (c <= 47) {
      return {
        id: 'chrono_fase_2',
        saga: 'LA SAGA DEL INFINITO • FASE 2 + ABC & NETFLIX',
        title: 'Fase 2 Cronológica: Caída de S.H.I.E.L.D., Defensores y Era de Ultrón (2013–2015)',
        subtitle:
          'Películas de Fase 2 intercaladas con Agents of S.H.I.E.L.D. (T1–T2), Daredevil (T1–T2), Jessica Jones (T1) y Luke Cage (T1)',
        accent: 'from-orange-600/25 via-orange-900/10 to-transparent border-orange-500/40',
        badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        icon: 'fa-robot',
      };
    } else if (c <= 77) {
      return {
        id: 'chrono_fase_3',
        saga: 'LA SAGA DEL INFINITO • FASE 3 + MARVEL TV & MULTIVERSO',
        title: 'Fase 3 Cronológica: De Civil War a Avengers: Infinity War (2016–2018)',
        subtitle:
          'Películas de Fase 3 intercaladas con Agents of S.H.I.E.L.D. (T3–T5), The Defenders, Punisher, Runaways, Cloak & Dagger, Deadpool y Venom',
        accent: 'from-purple-600/25 via-purple-900/10 to-transparent border-purple-500/40',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        icon: 'fa-gem',
      };
    } else if (c <= 84) {
      return {
        id: 'chrono_blip_endgame',
        saga: 'LA SAGA DEL INFINITO • EL BLIP Y CLÍMAX',
        title: 'Fase 3 (Epílogo): Los Años del Blip y Avengers: Endgame (2019–2023)',
        subtitle:
          'Agents of S.H.I.E.L.D. (T6–T7), Helstrom, conexiones del Spider-Verse y la batalla final contra Thanos',
        accent: 'from-violet-600/25 via-violet-900/10 to-transparent border-violet-500/40',
        badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
        icon: 'fa-infinity',
      };
    } else if (c <= 104) {
      return {
        id: 'chrono_fase_4',
        saga: 'LA SAGA DEL MULTIVERSO • FASE 4',
        title: 'Fase 4 Cronológica: La AVT y las Primeras Fisuras del Multiverso (2023–2025)',
        subtitle:
          'Loki (T1–T2), WandaVision, No Way Home, Multiverse of Madness, Wakanda Forever y las nuevas series de Disney+',
        accent: 'from-rose-600/25 via-rose-900/10 to-transparent border-rose-500/40',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        icon: 'fa-hourglass-half',
      };
    } else if (c <= 114) {
      return {
        id: 'chrono_fase_5',
        saga: 'LA SAGA DEL MULTIVERSO • FASE 5',
        title: 'Fase 5 Cronológica: Incursiones, Alcalde Fisk y Nuevos Vengadores (2026–2027)',
        subtitle:
          'De Quantumania, Guardians Vol. 3 y The Marvels a Daredevil: Born Again (T1), Brave New World y Thunderbolts*',
        accent: 'from-blue-600/25 via-blue-900/10 to-transparent border-blue-500/40',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        icon: 'fa-asterisk',
      };
    } else {
      return {
        id: 'chrono_fase_6',
        saga: 'LA SAGA DEL MULTIVERSO • FASE 6',
        title: 'Fase 6 Cronológica: Rumbo a Avengers: Doomsday y Secret Wars (2027–2029)',
        subtitle:
          'Born Again (T2), Spider-Man: Brand New Day, VisionQuest, Logan, Deadpool & Wolverine, Doomsday y Secret Wars',
        accent: 'from-emerald-600/25 via-emerald-900/10 to-transparent border-emerald-500/40',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: 'fa-mask',
      };
    }
  }

  const rDate = item.releaseDate;
  if (rDate < '2008-01-01') {
    return {
      id: 'rel_era_pre_mcu',
      saga: 'ERA PRE-UCM: LEGADO FOX & SONY',
      title: 'Era Pre-UCM: X-Men, Spider-Man (Raimi), Daredevil y 4 Fantásticos (2000–2007)',
      subtitle:
        'Los clásicos fundacionales cuyos repartos regresan en No Way Home, Deadpool & Wolverine y Doomsday',
      accent: 'from-indigo-600/25 via-indigo-900/10 to-transparent border-indigo-500/40',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      icon: 'fa-dna',
    };
  } else if (rDate <= '2012-12-31') {
    return {
      id: 'rel_fase_1',
      saga: 'LA SAGA DEL INFINITO • FASE 1',
      title: 'Fase 1 (2008–2012): De Iron Man a The Avengers',
      subtitle:
        'Películas, cortos One-Shots y cómics preludio de la Fase 1 (+ estrenos multiversales de 2009–2012)',
      accent: 'from-red-600/25 via-red-900/10 to-transparent border-red-500/40',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
      icon: 'fa-a',
    };
  } else if (rDate <= '2015-12-31') {
    return {
      id: 'rel_fase_2',
      saga: 'LA SAGA DEL INFINITO • FASE 2 + ERA ABC / NETFLIX',
      title: 'Fase 2 (2013–2015): De Iron Man 3 a Ant-Man + Inicio de S.H.I.E.L.D. y Daredevil',
      subtitle:
        'Películas de Fase 2 intercaladas por fecha de estreno con Agents of S.H.I.E.L.D. (T1–T2), Agent Carter (T1), Daredevil (T1) y Jessica Jones (T1)',
      accent: 'from-amber-600/25 via-amber-900/10 to-transparent border-amber-500/40',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: 'fa-robot',
    };
  } else if (rDate <= '2020-12-31') {
    return {
      id: 'rel_fase_3',
      saga: 'LA SAGA DEL INFINITO • FASE 3 + ERA DEFENDERS / FOX / SONY',
      title: 'Fase 3 (2016–2020): De Civil War a Endgame, Far From Home y Final de S.H.I.E.L.D.',
      subtitle:
        'Clímax de la Saga del Infinito intercalado con The Defenders, Punisher, S.H.I.E.L.D. (T3–T7), Runaways, Cloak & Dagger, Deadpool y Logan',
      accent: 'from-purple-600/25 via-purple-900/10 to-transparent border-purple-500/40',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: 'fa-infinity',
    };
  } else if (rDate <= '2022-12-31') {
    return {
      id: 'rel_fase_4',
      saga: 'LA SAGA DEL MULTIVERSO • FASE 4',
      title: 'Fase 4 (2021–2022): De WandaVision a Black Panther: Wakanda Forever',
      subtitle:
        'Estreno de las primeras series de Marvel Studios en Disney+ y apertura del Multiverso en cines',
      accent: 'from-rose-600/25 via-rose-900/10 to-transparent border-rose-500/40',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: 'fa-wand-magic-sparkles',
    };
  } else if (rDate <= '2025-06-30') {
    return {
      id: 'rel_fase_5',
      saga: 'LA SAGA DEL MULTIVERSO • FASE 5',
      title: 'Fase 5 (2023 – Junio 2025): De Quantumania a Thunderbolts* e Ironheart',
      subtitle:
        'Guardians Vol. 3, Loki T2, The Marvels, Deadpool & Wolverine, Daredevil: Born Again T1, Brave New World y Thunderbolts*',
      accent: 'from-blue-600/25 via-blue-900/10 to-transparent border-blue-500/40',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      icon: 'fa-asterisk',
    };
  } else {
    return {
      id: 'rel_fase_6',
      saga: 'LA SAGA DEL MULTIVERSO • FASE 6',
      title:
        'Fase 6 (Julio 2025 – 2027): De The Fantastic Four: First Steps a Doomsday y Secret Wars',
      subtitle:
        'Eyes of Wakanda, Wonder Man, Born Again T2, Spider-Man: Brand New Day, VisionQuest, Doomsday y Secret Wars',
      accent: 'from-emerald-600/25 via-emerald-900/10 to-transparent border-emerald-500/40',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: 'fa-mask',
    };
  }
}
