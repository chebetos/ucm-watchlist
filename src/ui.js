import {
  getItemCompletionStatus,
  getCategoryColors,
  getShortSagaName,
  getItemSagaMeta,
  computeGlobalStats,
  computeMarathonPlan,
  computeProgressComparison,
} from './logic.js';
import { escapeHtml, sanitizeImageUrl } from './utils.js';
import { getEpisodeSynopsis } from './data/episodes/index.js';
import {
  getLang,
  getLocalizedItemSynopsis,
  getLocalizedPhase,
  getLocalizedSeasonNote,
  t,
} from './i18n.js';

export function applyPosterToDom(itemId, url) {
  const safeUrl = sanitizeImageUrl(url);
  if (!safeUrl || typeof document === 'undefined') return;
  const selector = `img[data-poster-id="${CSS.escape(itemId)}"]`;
  document.querySelectorAll(selector).forEach((img) => {
    if (!(img instanceof HTMLImageElement)) return;
    img.src = safeUrl;
    img.classList.remove('opacity-0');
  });
}

export function renderPosterArt(item, orderNumber, mediaApi) {
  const [c1, c2] = item.palette || ['#1F2937', '#E62429'];
  const cachedUrl = sanitizeImageUrl(mediaApi.getCachedPoster(item.id)) || '';
  const safeId = escapeHtml(item.id);
  const safeTitle = escapeHtml(item.title);
  const safeYear = escapeHtml(item.year);
  const safePhase = escapeHtml(getLocalizedPhase(item.phase));
  const safeIcon = escapeHtml(item.icon || 'fa-film');

  return `
    <div class="w-20 sm:w-28 h-32 sm:h-40 rounded-xl shrink-0 relative overflow-hidden border border-white/15 shadow-lg flex flex-col justify-between p-2 sm:p-2.5 select-none"
         style="background: linear-gradient(155deg, ${escapeHtml(c1)} 0%, #0B0E14 68%, ${escapeHtml(c2)} 100%);">
      <div class="poster-shine absolute inset-0 pointer-events-none z-10"></div>
      <img data-poster-id="${safeId}"
           ${cachedUrl ? `src="${escapeHtml(cachedUrl)}"` : ''}
           alt="${safeTitle}"
           loading="lazy"
           referrerpolicy="no-referrer"
           class="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${cachedUrl ? '' : 'opacity-0'} z-0">
      <div class="relative z-20 flex items-center justify-between">
        <span class="text-[10px] font-black bg-black/75 backdrop-blur-sm text-white px-1.5 py-0.5 rounded border border-white/15">
          #${orderNumber}
        </span>
        <span class="text-[9px] font-bold bg-black/65 text-gray-200 px-1.5 py-0.5 rounded">
          ${safeYear}
        </span>
      </div>
      <div class="relative z-20 flex-1 flex items-center justify-center my-1">
        <div class="w-10 h-10 rounded-full bg-black/45 border border-white/15 flex items-center justify-center backdrop-blur-sm">
          <i class="fa-solid ${safeIcon} text-lg text-white/90" aria-hidden="true"></i>
        </div>
      </div>
      <div class="relative z-20 bg-black/75 backdrop-blur-sm -mx-2.5 -mb-2.5 px-2 py-1 border-t border-white/10">
        <div class="text-[9px] font-bold text-gray-200 truncate text-center uppercase tracking-wider">
          ${safePhase}
        </div>
      </div>
    </div>
  `;
}

export function renderWatchSwitchHtml(item, comp) {
  const isCompleted = comp.status === 'completed';
  const isInProgress = comp.status === 'in_progress';
  const safeId = escapeHtml(item.id);
  const safeTitle = escapeHtml(item.title);

  let trackClasses = 'bg-gray-800 border-gray-600/80';
  let knobTranslate = 'translate-x-0.5 bg-gray-300';
  let labelText = t('card.unwatched');
  let labelColor = 'text-gray-400';

  if (isCompleted) {
    trackClasses = 'bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/25';
    knobTranslate = 'translate-x-5 bg-white';
    labelText = t('card.watched');
    labelColor = 'text-emerald-400';
  } else if (isInProgress) {
    trackClasses = 'bg-amber-500/80 border-amber-400';
    knobTranslate = 'translate-x-2.5 bg-white';
    labelText = t('card.epShort', { watched: comp.watchedCount, total: comp.totalCount });
    labelColor = 'text-amber-300';
  }

  const toggleTitle = isCompleted ? t('card.markUnwatchedTitle') : t('card.markWatchedTitle');
  const actionLabel = `${toggleTitle}: ${safeTitle}`;

  return `
    <button type="button"
         data-action="toggle-item"
         data-item-id="${safeId}"
         role="switch"
         aria-checked="${isCompleted}"
         aria-label="${escapeHtml(actionLabel)}"
         title="${escapeHtml(toggleTitle)}"
         class="inline-flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-[#0B0E14] hover:bg-gray-900 border border-marvel-border cursor-pointer select-none transition group focus:outline-none focus-visible:ring-2 focus-visible:ring-marvel-red">
      <span class="text-xs font-bold ${labelColor} group-hover:text-white transition">
        ${escapeHtml(labelText)}
      </span>
      <span class="watch-switch-track relative inline-flex items-center w-11 h-6 rounded-full border ${trackClasses}" aria-hidden="true">
        <span class="watch-switch-knob inline-block w-4 h-4 rounded-full shadow-md transform ${knobTranslate} flex items-center justify-center">
          ${isCompleted ? '<i class="fa-solid fa-check text-[9px] text-emerald-600"></i>' : isInProgress ? '<i class="fa-solid fa-ellipsis text-[8px] text-amber-600"></i>' : ''}
        </span>
      </span>
    </button>
  `;
}

export function renderCardHtml(item, globalIndex, userProgress, mediaApi) {
  const comp = getItemCompletionStatus(item, userProgress);
  const catStyle = getCategoryColors(item.category);
  const isSeries = Array.isArray(item.seasons) && item.seasons.length > 0;
  const userStars = userProgress.userRatings[item.id] || 0;
  const hasNote = Boolean(userProgress.userNotes[item.id]);
  const sagaShort = getShortSagaName(item.phase);

  const safeId = escapeHtml(item.id);
  const safeTitle = escapeHtml(item.title);
  const safePhase = escapeHtml(getLocalizedPhase(item.phase));
  const safeSaga = escapeHtml(sagaShort);
  const safeTimeline = escapeHtml(item.timelineYear);
  const safeSynopsis = escapeHtml(getLocalizedItemSynopsis(item));
  const safeImdbId = item.imdbId ? encodeURIComponent(item.imdbId) : '';

  return `
    <article data-action="open-detail"
        data-item-id="${safeId}"
        tabindex="0"
        aria-label="${safeTitle}"
        class="card-hover cursor-pointer bg-marvel-card border ${comp.status === 'completed' ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-marvel-border'} rounded-2xl p-3.5 flex flex-col justify-between gap-3 relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-marvel-red">

      <div class="flex gap-3.5">
        ${renderPosterArt(item, globalIndex, mediaApi)}

        <div class="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md border ${catStyle.badge}">
                ${escapeHtml(catStyle.label)}
              </span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-gray-200 border border-white/10">
                ${safePhase} • ${safeSaga}
              </span>
              ${
                item.doomsdayEssential
                  ? `
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" title="${escapeHtml(t('card.doomsdayTitle'))}">
                  <i class="fa-solid fa-bolt mr-0.5" aria-hidden="true"></i>Doomsday
                </span>
              `
                  : ''
              }
              ${
                userStars > 0
                  ? `
                <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                  <i class="fa-solid fa-star mr-0.5" aria-hidden="true"></i>${userStars}/5
                </span>
              `
                  : ''
              }
            </div>

            <h2 class="font-bold text-sm sm:text-base text-white leading-snug line-clamp-2 ${comp.status === 'completed' ? 'line-through decoration-emerald-500/60 text-gray-300' : ''}">
              ${safeTitle}
            </h2>

            <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-gray-400 mt-1">
              <span><i class="fa-regular fa-calendar mr-1 text-gray-500" aria-hidden="true"></i>${escapeHtml(t('card.release', { year: item.year }))}</span>
              <span class="text-sky-300/90 font-medium"><i class="fa-solid fa-timeline mr-1" aria-hidden="true"></i>${safeTimeline}</span>
              ${item.postCredits > 0 ? `<span class="text-amber-400/90" title="${escapeHtml(t('card.postCreditsTitle'))}"><i class="fa-solid fa-film mr-1" aria-hidden="true"></i>${escapeHtml(t('card.postCredits', { count: item.postCredits }))}</span>` : ''}
            </div>

            <p class="text-xs text-gray-300/90 mt-2 line-clamp-3 leading-relaxed">
              ${safeSynopsis}
            </p>
          </div>

          ${
            isSeries
              ? `
            <div class="mt-2.5 pt-2 border-t border-marvel-border/60">
              <div class="flex justify-between text-[11px] mb-1">
                <span class="text-blue-300 font-semibold">
                  <i class="fa-solid fa-list-check mr-1" aria-hidden="true"></i>${escapeHtml(t('card.episodesWatched', { watched: comp.watchedCount, total: comp.totalCount }))}
                </span>
                <span class="font-bold text-gray-300">${comp.percent}%</span>
              </div>
              <div class="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500 transition-all duration-300" style="width: ${comp.percent}%"></div>
              </div>
            </div>
          `
              : ''
          }
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between pt-2.5 border-t border-marvel-border/70 gap-2">
        <div class="flex items-center gap-1.5">
          <button type="button"
              data-action="open-detail"
              data-item-id="${safeId}"
              class="text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0B0E14] border border-marvel-border focus:outline-none focus-visible:ring-2 focus-visible:ring-marvel-red">
            <i class="fa-solid ${isSeries ? 'fa-images text-blue-400' : 'fa-circle-info text-gray-400'}" aria-hidden="true"></i>
            ${escapeHtml(isSeries ? t('card.episodesBtn') : t('card.reviewBtn'))}
            ${hasNote ? `<i class="fa-solid fa-comment-dots text-amber-400 ml-1" title="${escapeHtml(t('card.hasNoteTitle'))}" aria-label="${escapeHtml(t('card.hasNoteTitle'))}"></i>` : ''}
          </button>
          ${
            safeImdbId
              ? `
            <a href="https://www.imdb.com/title/${safeImdbId}/" target="_blank" rel="noopener noreferrer"
               data-stop-card="true"
               class="px-2 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-bold transition"
               title="${escapeHtml(t('card.imdbTitle'))}">
              IMDb
            </a>
          `
              : ''
          }
        </div>

        ${renderWatchSwitchHtml(item, comp)}
      </div>
    </article>
  `;
}

export function renderGlobalStats(catalog, userProgress) {
  const stats = computeGlobalStats(catalog, userProgress);
  const progressLabel = document.getElementById('progressLabel');
  const progressPercent = document.getElementById('progressPercent');
  const progressBar = document.getElementById('progressBar');
  const episodesCounter = document.getElementById('episodesCounter');
  const timeRemaining = document.getElementById('timeRemaining');
  const countAll = document.getElementById('count-all');

  if (progressLabel) {
    progressLabel.textContent = t('stats.titlesWatched', {
      completed: stats.completedItems,
      total: stats.totalItems,
    });
  }
  if (progressPercent) progressPercent.textContent = `${stats.percent}%`;
  if (progressBar) progressBar.style.width = `${stats.percent}%`;
  if (episodesCounter) {
    episodesCounter.textContent = t('stats.episodes', {
      watched: stats.watchedEpisodes,
      total: stats.totalEpisodes,
    });
  }
  if (timeRemaining) {
    timeRemaining.textContent = t('stats.remainingHours', { hours: stats.remainingHours });
  }
  if (countAll) countAll.textContent = String(stats.totalItems);
}

function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

export function renderMarathonPlanner(catalog, filterState, userProgress) {
  const scopeSelect = document.getElementById('plannerScopeSelect');
  const scope = scopeSelect instanceof HTMLSelectElement ? scopeSelect.value : 'filtered';
  const plan = computeMarathonPlan(catalog, filterState, userProgress, scope);

  const daysBadge = document.getElementById('plannerDaysLeftBadge');
  if (daysBadge) {
    daysBadge.textContent = plan.isReached
      ? t('planner.reached')
      : t('planner.daysLeft', { days: plan.daysLeft });
  }

  setElementText('planPendingHours', `${plan.pendingHours} h`);
  setElementText(
    'planPendingItems',
    t('planner.pendingItems', { titles: plan.pendingTitles, units: plan.pendingEpisodesOrMovies }),
  );
  setElementText('planDailyPace', t('planner.dailyUnit', { mins: plan.minsPerDay }));
  setElementText('planDailyEps', t('planner.dailyEps', { eps: plan.epsPerDay }));
  setElementText('planWeeklyPace', t('planner.weeklyUnit', { hours: plan.hoursPerWeek }));
  setElementText('planWeeklyMovies', t('planner.weeklyTitles', { titles: plan.titlesPerWeek }));

  if (plan.nextItem) {
    setElementText('planNextItem', plan.nextItem.title);
    setElementText(
      'planNextMeta',
      `${getLocalizedPhase(plan.nextItem.phase)} • ${plan.nextItem.timelineYear}`,
    );
  } else {
    setElementText('planNextItem', t('planner.allDone'));
    setElementText('planNextMeta', t('planner.upToDate'));
  }
}

export function renderCatalogGrid({
  catalog,
  list,
  filterState,
  userProgress,
  collapsedGroups,
  mediaApi,
  itemsById,
}) {
  const grid = document.getElementById('catalogGrid');
  const emptyState = document.getElementById('emptyState');
  const resultsCountEl = document.getElementById('resultsCountText');
  if (!grid || !emptyState || !resultsCountEl) return;

  resultsCountEl.textContent = t('toolbar.resultsCount', {
    shown: list.length,
    total: catalog.length,
    order:
      filterState.orderMode === 'release'
        ? t('toolbar.orderReleaseLong')
        : t('toolbar.orderChronoLong'),
  });

  if (list.length === 0) {
    grid.innerHTML = '';
    mediaApi.disconnectObserver();
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  if (filterState.groupMode === 'none') {
    grid.className = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4';
    grid.innerHTML = list
      .map((item, idx) => renderCardHtml(item, idx + 1, userProgress, mediaApi))
      .join('');
    mediaApi.observeVisiblePosters(grid, itemsById);
    return;
  }

  grid.className = 'space-y-6';
  const groups = [];
  const groupMap = {};

  list.forEach((item, idx) => {
    const meta = getItemSagaMeta(item, filterState.orderMode, filterState.groupMode);
    if (!groupMap[meta.id]) {
      const newGroup = { ...meta, items: [] };
      groupMap[meta.id] = newGroup;
      groups.push(newGroup);
    }
    groupMap[meta.id].items.push({ item, globalIndex: idx + 1 });
  });

  if (filterState.groupMode === 'strict_phases') {
    groups.sort((a, b) => (a.order || 99) - (b.order || 99));
    let runningIdx = 1;
    groups.forEach((g) => {
      g.items.forEach((entry) => {
        entry.globalIndex = runningIdx++;
      });
    });
  }

  grid.innerHTML = groups
    .map((group) => {
      const totalInGroup = group.items.length;
      const completedInGroup = group.items.filter(
        (e) => getItemCompletionStatus(e.item, userProgress).status === 'completed',
      ).length;
      const pct = totalInGroup > 0 ? Math.round((completedInGroup / totalInGroup) * 100) : 0;
      const isCollapsed = Boolean(collapsedGroups[group.id]);
      const allGroupCompleted = completedInGroup === totalInGroup && totalInGroup > 0;
      const safeGroupId = escapeHtml(group.id);
      const safeGroupTitle = escapeHtml(group.title);

      return `
        <section data-group-section="${safeGroupId}" class="rounded-2xl border border-marvel-border bg-[#0E131D]/90 overflow-hidden shadow-xl">
          <div data-action="toggle-group-collapse"
               data-group-id="${safeGroupId}"
               class="cursor-pointer p-4 sm:px-5 bg-gradient-to-r ${group.accent} border-b ${isCollapsed ? 'border-transparent' : 'border-marvel-border'} flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 select-none transition hover:brightness-110">

            <div class="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0">
              <div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#0B0E14]/90 border border-white/15 flex items-center justify-center shrink-0 shadow-md">
                <i class="fa-solid ${escapeHtml(group.icon || 'fa-layer-group')} text-base sm:text-lg text-white" aria-hidden="true"></i>
              </div>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-0.5">
                  <span class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${group.badgeColor}">
                    ${escapeHtml(group.saga)}
                  </span>
                  <span class="text-xs font-bold text-gray-300">
                    ${totalInGroup} ${escapeHtml(totalInGroup === 1 ? t('group.titleSingular') : t('group.titlePlural'))}
                  </span>
                </div>
                <h3 class="text-base sm:text-lg font-extrabold text-white leading-snug">
                  ${safeGroupTitle}
                </h3>
                <p class="text-xs text-gray-300/80 mt-0.5">
                  ${escapeHtml(group.subtitle)}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-2.5 sm:gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/10">
              <div class="flex-1 min-w-[130px] sm:flex-initial sm:w-44 bg-[#0B0E14]/85 border border-marvel-border rounded-xl px-3 py-1.5">
                <div class="flex justify-between text-[11px] mb-1">
                  <span class="text-gray-300 font-semibold">${escapeHtml(t('group.watchedCount', { done: completedInGroup, total: totalInGroup }))}</span>
                  <span class="font-bold ${allGroupCompleted ? 'text-emerald-400' : 'text-amber-400'}">${pct}%</span>
                </div>
                <div class="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div class="h-full ${allGroupCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-marvel-red to-amber-400'} transition-all duration-300" style="width: ${pct}%"></div>
                </div>
              </div>

              <button type="button"
                   data-action="toggle-group-watched"
                   data-group-id="${safeGroupId}"
                   role="switch"
                   aria-checked="${allGroupCompleted}"
                   aria-label="${escapeHtml(allGroupCompleted ? `${t('group.unmarkPhaseTitle')}: ${group.title}` : `${t('group.markPhaseTitle')}: ${group.title}`)}"
                   title="${escapeHtml(allGroupCompleted ? t('group.unmarkPhaseTitle') : t('group.markPhaseTitle'))}"
                   class="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#0B0E14]/90 hover:bg-gray-900 border border-marvel-border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-marvel-red">
                <span class="text-[11px] font-bold ${allGroupCompleted ? 'text-emerald-400' : 'text-gray-400'}">
                  ${escapeHtml(allGroupCompleted ? t('group.phaseDone') : t('group.markPhase'))}
                </span>
                <span class="watch-switch-track relative inline-flex items-center w-9 h-5 rounded-full border ${allGroupCompleted ? 'bg-emerald-500 border-emerald-400' : 'bg-gray-800 border-gray-600'}" aria-hidden="true">
                  <span class="watch-switch-knob inline-block w-3.5 h-3.5 rounded-full bg-white shadow transform ${allGroupCompleted ? 'translate-x-4' : 'translate-x-0.5'}"></span>
                </span>
              </button>

              <button type="button"
                   data-action="toggle-group-collapse"
                   data-group-id="${safeGroupId}"
                   aria-expanded="${!isCollapsed}"
                   aria-label="${isCollapsed ? `Desplegar ${safeGroupTitle}` : `Plegar ${safeGroupTitle}`}"
                   class="w-8 h-8 rounded-lg bg-[#0B0E14]/80 border border-marvel-border text-gray-300 hover:text-white flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-marvel-red">
                <i class="fa-solid ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-xs" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <div class="${isCollapsed ? 'hidden' : 'p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'}">
            ${group.items.map((entry) => renderCardHtml(entry.item, entry.globalIndex, userProgress, mediaApi)).join('')}
          </div>
        </section>
      `;
    })
    .join('');

  syncToggleAllGroupsButton(collapsedGroups);
  mediaApi.observeVisiblePosters(grid, itemsById);
}

export function syncToggleAllGroupsButton(collapsedGroups) {
  const btn = document.getElementById('btnToggleAllGroups');
  if (!btn) return;
  const groupEls = document.querySelectorAll('[data-group-section]');
  const anyExpanded = Array.from(groupEls).some(
    (el) => !collapsedGroups[el.getAttribute('data-group-section')],
  );
  btn.innerHTML = anyExpanded
    ? `<i class="fa-solid fa-angles-up" aria-hidden="true"></i><span>${escapeHtml(t('toolbar.collapseBlocks'))}</span>`
    : `<i class="fa-solid fa-angles-down" aria-hidden="true"></i><span>${escapeHtml(t('toolbar.expandBlocks'))}</span>`;
}

function renderEpisodeCardHtml({ safeItemId, seasonNumber, ep, isEpWatched, meta, synopsis }) {
  const displayTitle = escapeHtml(meta.title || ep.title);
  const safeAirdate = meta.airdate ? escapeHtml(meta.airdate) : '';
  const safeEpCode = escapeHtml(ep.code);
  const safeThumb = sanitizeImageUrl(meta.image);
  const safeSynopsis = escapeHtml(synopsis);
  const panelId = `ep-synopsis-${seasonNumber}-${safeEpCode}`;

  const cardTheme = isEpWatched
    ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-200'
    : 'bg-marvel-card/60 border-marvel-border/70 text-gray-300 hover:border-gray-600';
  const trackTheme = isEpWatched
    ? 'bg-emerald-500 border-emerald-400'
    : 'bg-gray-800 border-gray-600';
  const knobPosition = isEpWatched ? 'translate-x-4' : 'translate-x-0.5';

  const thumbHtml = safeThumb
    ? `<img src="${escapeHtml(safeThumb)}" alt="${safeEpCode}" loading="lazy" referrerpolicy="no-referrer" class="w-16 h-10 object-cover rounded-lg border border-white/10 shrink-0">`
    : `<div class="w-12 h-9 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0 text-[10px] font-mono font-bold text-gray-400">${safeEpCode}</div>`;

  return `
    <div data-episode-card="${safeEpCode}"
         class="rounded-xl border transition select-none overflow-hidden ${cardTheme}">
      <div class="flex items-center justify-between gap-2 p-2">
        <button type="button"
             data-action="toggle-episode-synopsis"
             data-ep-code="${safeEpCode}"
             aria-expanded="true"
             aria-controls="${panelId}"
             title="Mostrar u ocultar reseña de ${safeEpCode}"
             class="text-left flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-marvel-red">
          ${thumbHtml}
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-mono font-bold text-amber-400">${safeEpCode}</span>
              ${safeAirdate ? `<span class="text-[10px] text-gray-500">• ${safeAirdate}</span>` : ''}
              ${safeSynopsis ? '<i data-ep-chevron class="fa-solid fa-chevron-down rotate-180 text-[9px] text-gray-500 ml-auto transition-transform duration-200" aria-hidden="true"></i>' : ''}
            </div>
            <div class="text-xs font-semibold truncate ${isEpWatched ? 'line-through decoration-emerald-500/60' : ''}" title="${displayTitle}">
              ${displayTitle}
            </div>
          </div>
        </button>
        <button type="button"
             data-action="toggle-episode"
             data-item-id="${safeItemId}"
             data-ep-code="${safeEpCode}"
             role="switch"
             aria-checked="${isEpWatched}"
             aria-label="${isEpWatched ? 'Desmarcar' : 'Marcar'} ${safeEpCode}: ${displayTitle}"
             title="${isEpWatched ? 'Marcar como no visto' : 'Marcar como visto'}"
             class="shrink-0 p-1 rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-marvel-red">
          <span class="watch-switch-track relative inline-flex items-center w-9 h-5 rounded-full border ${trackTheme}" aria-hidden="true">
            <span class="watch-switch-knob inline-block w-3.5 h-3.5 rounded-full bg-white shadow transform ${knobPosition}"></span>
          </span>
        </button>
      </div>
      ${
        safeSynopsis
          ? `
        <div id="${panelId}" data-episode-synopsis class="px-3 py-2 text-[11px] sm:text-xs text-gray-300 leading-relaxed bg-[#0B0E14]/80 border-t border-marvel-border/60 select-text">
          ${safeSynopsis}
        </div>
      `
          : ''
      }
    </div>
  `;
}

function renderSeasonsSectionHtml({ item, safeItemId, comp, epMap, liveEpMeta }) {
  const lang = getLang();
  const seasonsMarkup = item.seasons
    .map((season) => {
      const watchedInSeason = season.episodes.filter((ep) => Boolean(epMap[ep.code])).length;
      const allSeasonDone = watchedInSeason === season.episodes.length;
      const seasonBtnTheme = allSeasonDone
        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
        : 'bg-marvel-card border-marvel-border text-gray-300 hover:text-white';
      const seasonNote = getLocalizedSeasonNote(item, season, lang);

      const episodesMarkup = season.episodes
        .map((ep) =>
          renderEpisodeCardHtml({
            safeItemId,
            seasonNumber: season.seasonNumber,
            ep,
            isEpWatched: Boolean(epMap[ep.code]),
            meta: liveEpMeta[ep.code] || {},
            synopsis: getEpisodeSynopsis(item.id, ep.code, lang),
          }),
        )
        .join('');

      return `
        <div data-season-block="${season.seasonNumber}" class="bg-[#0B0E14] border border-marvel-border rounded-xl overflow-hidden">
          <div class="px-4 py-3 bg-gray-900/70 border-b border-marvel-border flex flex-wrap items-center justify-between gap-2">
            <div>
              <span class="font-bold text-sm text-white">${escapeHtml(t('detail.seasonTitle', { num: season.seasonNumber, year: season.year }))}</span>
              <span class="text-xs text-gray-400 ml-2">${escapeHtml(t('detail.seasonCount', { watched: watchedInSeason, total: season.episodes.length }))}</span>
              ${seasonNote ? `<p class="text-[11px] text-gray-400 mt-0.5">${escapeHtml(seasonNote)}</p>` : ''}
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
              <button type="button"
                  data-action="toggle-season-synopses"
                  data-season-num="${season.seasonNumber}"
                  aria-expanded="true"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold border border-marvel-border bg-marvel-card text-sky-300 hover:text-white hover:border-sky-500/40 transition inline-flex items-center gap-1">
                <i class="fa-solid fa-book-open text-[10px]" aria-hidden="true"></i>
                <span data-season-synopses-label>${escapeHtml(t('detail.hideReviews'))}</span>
              </button>
              <button type="button"
                  data-action="toggle-season"
                  data-item-id="${safeItemId}"
                  data-season-num="${season.seasonNumber}"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${seasonBtnTheme}">
                <i class="fa-solid ${allSeasonDone ? 'fa-check-double' : 'fa-check'} mr-1" aria-hidden="true"></i>
                ${escapeHtml(allSeasonDone ? t('detail.seasonDone') : t('detail.markAllSeason'))}
              </button>
            </div>
          </div>
          <div class="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-start">
            ${episodesMarkup}
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-bold uppercase tracking-wider text-blue-400">
          <i class="fa-solid fa-list-check mr-1" aria-hidden="true"></i>${escapeHtml(t('detail.episodesChecklist', { watched: comp.watchedCount, total: comp.totalCount }))}
        </h4>
      </div>
      <div class="space-y-3">
        ${seasonsMarkup}
      </div>
    </div>
  `;
}

export function renderDetailModalBody(item, { filterState, userProgress, mediaApi }) {
  const comp = getItemCompletionStatus(item, userProgress);
  const isSeries = Array.isArray(item.seasons) && item.seasons.length > 0;
  const userStars = userProgress.userRatings[item.id] || 0;
  const userNote =
    typeof userProgress.userNotes[item.id] === 'string' ? userProgress.userNotes[item.id] : '';
  const epMap = userProgress.watchedEpisodes[item.id] || {};
  const liveEpMeta = mediaApi.getEpisodeMeta(item.id);

  const safeItemId = escapeHtml(item.id);
  const safeTitle = escapeHtml(item.title);
  const safeSynopsis = escapeHtml(getLocalizedItemSynopsis(item));
  const safeUserNote = escapeHtml(userNote);

  const progInfo = document.getElementById('modalProgressInfo');
  if (progInfo) {
    progInfo.textContent = isSeries
      ? t('detail.episodesProgress', {
          watched: comp.watchedCount,
          total: comp.totalCount,
          percent: comp.percent,
        })
      : comp.status === 'completed'
        ? t('detail.completed')
        : t('detail.pending');
  }

  const seasonsHtml = isSeries
    ? renderSeasonsSectionHtml({ item, safeItemId, comp, epMap, liveEpMeta })
    : '';

  const safeImdbId = item.imdbId ? encodeURIComponent(item.imdbId) : '';
  const externalLinksHtml = `
    <div class="flex flex-wrap items-center gap-2 pt-1">
      ${
        safeImdbId
          ? `
        <a href="https://www.imdb.com/title/${safeImdbId}/" target="_blank" rel="noopener noreferrer"
           class="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition">
          <i class="fa-brands fa-imdb text-sm" aria-hidden="true"></i> ${escapeHtml(t('detail.imdbLink'))}
        </a>
      `
          : ''
      }
      ${
        item.category === 'Cómic Canon'
          ? `
        <a href="https://marvelcinematicuniverse.fandom.com/wiki/Category:Comics" target="_blank" rel="noopener noreferrer"
           class="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition">
          <i class="fa-solid fa-book-open" aria-hidden="true"></i> ${escapeHtml(t('detail.comicLink'))}
        </a>
      `
          : ''
      }
    </div>
  `;

  const body = document.getElementById('modalBodyContent');
  if (!body) return;

  body.innerHTML = `
    <div class="flex flex-col sm:flex-row gap-4 bg-[#0B0E14] border border-marvel-border rounded-2xl p-4">
      ${renderPosterArt(item, filterState.orderMode === 'chrono' ? item.chronoOrder : item.releaseOrder, mediaApi)}
      <div class="flex-1 space-y-2.5">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 id="detailModalTitle" class="text-lg sm:text-xl font-extrabold text-white">${safeTitle}</h3>
            <p class="text-xs text-gray-400 mt-0.5">
              ${escapeHtml(t('detail.metaLine', { date: item.releaseDate, release: item.releaseOrder, chrono: item.chronoOrder }))}
            </p>
          </div>
          ${renderWatchSwitchHtml(item, comp)}
        </div>

        <div class="bg-marvel-card border border-marvel-border rounded-xl p-3">
          <span class="text-[11px] font-bold uppercase tracking-wider text-marvel-red block mb-1">${escapeHtml(t('detail.synopsisHeading'))}</span>
          <p class="text-xs sm:text-sm text-gray-200 leading-relaxed">${safeSynopsis}</p>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-xs">
          <span class="px-2.5 py-1 rounded-lg bg-marvel-card border border-marvel-border text-gray-300">
            <i class="fa-regular fa-clock mr-1 text-gray-400" aria-hidden="true"></i>${escapeHtml(t('detail.runtime', { hours: Math.round((item.runtimeMins / 60) * 10) / 10, mins: item.runtimeMins }))}
          </span>
          <span class="px-2.5 py-1 rounded-lg bg-marvel-card border border-marvel-border text-gray-300">
            <i class="fa-solid fa-film mr-1 text-amber-400" aria-hidden="true"></i>${escapeHtml(t('detail.postCredits', { count: item.postCredits }))}
          </span>
          ${
            item.doomsdayEssential
              ? `
            <span class="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
              <i class="fa-solid fa-bolt mr-1" aria-hidden="true"></i>${escapeHtml(t('detail.doomsdayBadge'))}
            </span>
          `
              : ''
          }
        </div>

        ${externalLinksHtml}
      </div>
    </div>

    <div class="bg-[#0B0E14] border border-marvel-border rounded-2xl p-4 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xs font-bold uppercase tracking-wider text-amber-400">
          <i class="fa-solid fa-pen-to-square mr-1" aria-hidden="true"></i>${escapeHtml(t('detail.ratingHeading'))}
        </span>
        <div class="flex items-center gap-1" role="group" aria-label="${escapeHtml(t('detail.yourRating'))}">
          <span class="text-xs text-gray-400 mr-1">${escapeHtml(t('detail.yourRating'))}</span>
          ${[1, 2, 3, 4, 5]
            .map(
              (star) => `
                <button type="button"
                    data-action="set-rating"
                    data-item-id="${safeItemId}"
                    data-stars="${star}"
                    aria-label="${star}/5"
                    aria-pressed="${star <= userStars}"
                    class="text-base px-1 transition ${star <= userStars ? 'text-amber-400 scale-110' : 'text-gray-600 hover:text-gray-400'}">
                  <i class="fa-solid fa-star" aria-hidden="true"></i>
                </button>
              `,
            )
            .join('')}
        </div>
      </div>
      <div class="flex gap-2">
        <input id="userNoteInput" type="text" maxlength="2000" value="${safeUserNote}"
            aria-label="${escapeHtml(t('detail.ratingHeading'))}"
            placeholder="${escapeHtml(t('detail.notePlaceholder'))}"
            class="flex-1 bg-marvel-card border border-marvel-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400">
        <button type="button"
            data-action="save-note"
            data-item-id="${safeItemId}"
            class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-bold transition">
          ${escapeHtml(t('detail.saveNote'))}
        </button>
      </div>
    </div>

    ${seasonsHtml}
  `;
}

const SYNC_BADGE_BASE_CLASS =
  'inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full border';

export function updateSyncBadge(text, color) {
  const badge = document.getElementById('syncBadge');
  if (!badge) return;
  const isEmerald = color === 'emerald';
  const themeClass = isEmerald
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
    : 'bg-amber-500/10 text-amber-300 border-amber-500/25';
  const iconClass = isEmerald ? 'fa-circle-check' : 'fa-floppy-disk';

  badge.className = `${SYNC_BADGE_BASE_CLASS} ${themeClass}`;
  badge.innerHTML = `<i class="fa-solid ${iconClass} text-[10px]" aria-hidden="true"></i><span>${escapeHtml(text)}</span>`;
}

/** @param {string | null | undefined} isoStr @param {'es' | 'en'} [lang] */
export function formatUtcTimestamp(isoStr, lang = getLang()) {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-ES', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return isoStr.replace('T', ' ').slice(0, 16);
  }
}

export function renderDeeplinkModal(catalog, incoming) {
  const nickDisplay = incoming.meta?.nick || t('deeplink.anonymous');
  const formattedDate = formatUtcTimestamp(incoming.meta?.exportedAt);
  const stats = computeGlobalStats(catalog, incoming.progress);

  const senderEl = document.getElementById('deeplinkSenderBadge');
  if (senderEl) senderEl.textContent = t('deeplink.fromUser', { nick: nickDisplay });

  const dateEl = document.getElementById('deeplinkDateText');
  if (dateEl) {
    dateEl.textContent = formattedDate
      ? t('deeplink.exportedAt', { date: formattedDate })
      : t('deeplink.noDate');
  }

  const summaryEl = document.getElementById('deeplinkSummaryText');
  if (summaryEl) {
    summaryEl.textContent = t('deeplink.summary', {
      completed: stats.completedItems,
      total: stats.totalItems,
      percent: stats.percent,
      epWatched: stats.watchedEpisodes,
    });
  }
}

export function renderOverwriteConfirmModal(catalog, localProgress, incoming) {
  const container = document.getElementById('overwriteDiffSummary');
  if (!container) return;

  const myStats = computeGlobalStats(catalog, localProgress);
  const incomingStats = computeGlobalStats(catalog, incoming.progress);
  const nickDisplay = incoming.meta?.nick || t('deeplink.anonymous');
  const formattedDate = formatUtcTimestamp(incoming.meta?.exportedAt);

  const myLine = t('deeplink.summary', {
    completed: myStats.completedItems,
    total: myStats.totalItems,
    percent: myStats.percent,
    epWatched: myStats.watchedEpisodes,
  });
  const incLine = t('deeplink.summary', {
    completed: incomingStats.completedItems,
    total: incomingStats.totalItems,
    percent: incomingStats.percent,
    epWatched: incomingStats.watchedEpisodes,
  });

  container.innerHTML = `
    <div class="space-y-1">
      <div class="text-[10px] uppercase font-bold text-gray-400">${escapeHtml(t('overwrite.currentLabel'))}</div>
      <div class="font-semibold text-white">${escapeHtml(myLine)}</div>
    </div>
    <div class="border-t border-marvel-border/70 pt-2 space-y-1">
      <div class="text-[10px] uppercase font-bold text-amber-300">${escapeHtml(t('overwrite.incomingLabel', { nick: nickDisplay }))}</div>
      <div class="font-semibold text-emerald-400">${escapeHtml(incLine)}</div>
      ${
        formattedDate
          ? `<div class="text-[11px] text-gray-400">${escapeHtml(t('deeplink.exportedAt', { date: formattedDate }))}</div>`
          : ''
      }
    </div>
  `;
}

function renderCompareStatCard(label, stats, accentClass, barClass) {
  return `
    <div class="bg-[#0B0E14] border ${accentClass} rounded-xl p-3.5 space-y-2.5 min-w-0">
      <div class="flex items-center justify-between gap-2">
        <span class="font-extrabold text-white text-sm truncate">${escapeHtml(label)}</span>
        <span class="text-sm font-black ${barClass}">${stats.percent}%</span>
      </div>
      <div class="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-marvel-red via-amber-500 to-emerald-500" style="width: ${stats.percent}%"></div>
      </div>
      <div class="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span class="text-gray-400 block">${escapeHtml(t('compare.titles'))}</span>
          <span class="font-bold text-white">${stats.completedItems} / ${stats.totalItems}</span>
        </div>
        <div>
          <span class="text-gray-400 block">${escapeHtml(t('compare.episodes'))}</span>
          <span class="font-bold text-white">${stats.watchedEpisodes} / ${stats.totalEpisodes}</span>
        </div>
        <div>
          <span class="text-gray-400 block">${escapeHtml(t('compare.hoursWatched'))}</span>
          <span class="font-bold text-white">${stats.watchedHours} h</span>
        </div>
        <div>
          <span class="text-gray-400 block">${escapeHtml(t('compare.avgRating'))}</span>
          <span class="font-bold text-amber-400">${stats.avgRating !== null ? `★ ${stats.avgRating}` : escapeHtml(t('compare.noRatings'))}</span>
        </div>
      </div>
    </div>
  `;
}

export function renderCompareModal(catalog, localProgress, incoming, activeTab = 'both') {
  const body = document.getElementById('compareModalBody');
  const subtitle = document.getElementById('compareMetaSubtitle');
  if (!body) return;

  const nickDisplay = incoming.meta?.nick || t('deeplink.anonymous');
  const formattedDate = formatUtcTimestamp(incoming.meta?.exportedAt);
  if (subtitle) {
    const parts = [t('deeplink.fromUser', { nick: nickDisplay })];
    if (formattedDate) parts.push(t('deeplink.exportedAt', { date: formattedDate }));
    subtitle.textContent = parts.join(' • ');
  }

  const cmp = computeProgressComparison(catalog, localProgress, incoming.progress);
  const myNick = localProgress?.nick
    ? `${t('compare.you')} (${localProgress.nick})`
    : t('compare.you');

  const tabs = [
    { id: 'both', label: t('compare.tabBoth', { count: cmp.lists.both.length }) },
    {
      id: 'onlyFriend',
      label: t('compare.tabOnlyFriend', { nick: nickDisplay, count: cmp.lists.onlyFriend.length }),
    },
    { id: 'onlyMe', label: t('compare.tabOnlyMe', { count: cmp.lists.onlyMe.length }) },
    { id: 'neither', label: t('compare.tabNeither', { count: cmp.lists.neither.length }) },
  ];

  const validTab = Object.prototype.hasOwnProperty.call(cmp.lists, activeTab) ? activeTab : 'both';
  const rows = cmp.lists[validTab];

  const tabsHtml = tabs
    .map((tab) => {
      const isActive = tab.id === validTab;
      const cls = isActive
        ? 'bg-sky-600 text-white border-sky-500 shadow'
        : 'bg-[#0B0E14] text-gray-300 hover:text-white border-marvel-border';
      return `
        <button type="button"
            data-action="compare-tab"
            data-compare-tab="${tab.id}"
            class="px-3 py-1.5 rounded-lg border text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${cls}">
          ${escapeHtml(tab.label)}
        </button>
      `;
    })
    .join('');

  const listHtml =
    rows.length === 0
      ? `<div class="bg-[#0B0E14] border border-marvel-border rounded-xl p-6 text-center text-gray-400">${escapeHtml(t('compare.emptyTab'))}</div>`
      : rows
          .map(({ item, myComp, friendComp, myRating, friendRating }) => {
            const cat = getCategoryColors(item.category);
            const ratingsHtml =
              myRating || friendRating
                ? `<div class="flex items-center gap-2 text-[11px] shrink-0">
                     ${myRating ? `<span class="text-emerald-400 font-bold" title="${escapeHtml(myNick)}">★ ${myRating}</span>` : ''}
                     ${friendRating ? `<span class="text-sky-400 font-bold" title="${escapeHtml(nickDisplay)}">★ ${friendRating}</span>` : ''}
                   </div>`
                : '';
            const epInfo =
              myComp.totalEpisodes > 0 &&
              (myComp.status === 'in_progress' || friendComp.status === 'in_progress')
                ? `<span class="text-[10px] text-gray-400">
                     ${escapeHtml(t('compare.you'))}: ${myComp.watchedEpisodes}/${myComp.totalEpisodes} • ${escapeHtml(nickDisplay)}: ${friendComp.watchedEpisodes}/${friendComp.totalEpisodes}
                   </span>`
                : '';

            return `
              <div class="flex items-center justify-between gap-3 bg-[#0B0E14] border border-marvel-border rounded-xl px-3 py-2">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="font-bold text-white text-xs truncate">${escapeHtml(item.title)}</span>
                    <span class="text-[10px] text-gray-500">(${escapeHtml(item.year)})</span>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 mt-0.5">
                    <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cat.badge}">${escapeHtml(cat.label)}</span>
                    <span class="text-[10px] text-gray-400">${escapeHtml(getLocalizedPhase(item.phase))}</span>
                    ${epInfo}
                  </div>
                </div>
                ${ratingsHtml}
              </div>
            `;
          })
          .join('');

  body.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      ${renderCompareStatCard(myNick, cmp.me, 'border-emerald-500/35', 'text-emerald-400')}
      ${renderCompareStatCard(nickDisplay, cmp.friend, 'border-sky-500/35', 'text-sky-400')}
    </div>
    <div class="flex flex-wrap items-center gap-1.5 pt-1">
      ${tabsHtml}
    </div>
    <div class="space-y-1.5 max-h-80 overflow-y-auto pr-1">
      ${listHtml}
    </div>
  `;
}
