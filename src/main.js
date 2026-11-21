import { MCU_CATALOG } from './catalog.js';
import {
  createDefaultProgress,
  getExportableProgress,
  encodeCompressedSyncCode,
  decodeAnySyncCodeWithMeta,
  buildShareDeeplink,
  extractSyncCodeFromHash,
  sanitizeNick,
  importProgressPayload,
  PROGRESS_SCHEMA_VERSION,
  loadOmdbApiKey,
  saveOmdbApiKeyToStorage,
  loadExternalMediaPref,
  saveExternalMediaPref,
  loadProgressFromStorage,
  saveProgressToStorage,
  MAX_IMPORT_FILE_BYTES,
  MAX_NOTE_LENGTH,
} from './store.js';
import {
  getItemCompletionStatus,
  getFilteredAndSortedCatalog,
  getItemSagaMeta,
  getCategoryColors,
} from './logic.js';
import { createMediaApi } from './mediaApi.js';
import {
  applyPosterToDom,
  renderGlobalStats,
  renderMarathonPlanner,
  renderCatalogGrid,
  renderDetailModalBody,
  renderDeeplinkModal,
  renderOverwriteConfirmModal,
  renderCompareModal,
  updateSyncBadge,
  syncToggleAllGroupsButton,
} from './ui.js';
import { initPWA, triggerNativePwaInstall } from './pwa.js';
import { debounce, copyToClipboard } from './utils.js';
import { loadEpisodeSynopsesForItem } from './data/episodes/index.js';
import {
  applyStaticTranslations,
  detectInitialLang,
  getLang,
  getLocalizedPhase,
  loadCatalogTranslations,
  setLang,
  t,
} from './i18n.js';

const itemsById = new Map(MCU_CATALOG.map((item) => [item.id, item]));

let userProgress = createDefaultProgress();
const filterState = {
  orderMode: 'release', // 'release' | 'chrono'
  groupMode: 'interleaved_sagas', // 'interleaved_sagas' | 'strict_phases' | 'none'
  category: 'all',
  phase: 'all',
  status: 'all',
  doomsdayOnly: false,
  search: '',
};

const collapsedGroups = {};
let currentOpenItemId = null;
let toastTimeout = null;
let pendingIncomingShare = null;
let pendingImportSource = 'progress';
let activeCompareTab = 'both';
let syncOutputSeq = 0;
let deeplinkRequestSeq = 0;
/** @type {{ code: string, url: string } | null} */
let latestLocalExport = null;
/** @type {Promise<void> | null} */
let pendingSyncRefreshPromise = null;
let syncTextareaDirty = false;
/** @type {HTMLElement | null} */
let modalReturnFocusEl = null;

const mediaApi = createMediaApi({
  onPosterResolved: (itemId, url) => applyPosterToDom(itemId, url),
});

/**
 * @param {string} id
 * @returns {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null}
 */
function getFormField(id) {
  const el = document.getElementById(id);
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  ) {
    return el;
  }
  return null;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMessage');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.classList.remove('hidden');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3200);
}

function saveProgress() {
  const saved = saveProgressToStorage(userProgress);
  if (!saved) {
    updateSyncBadge(t('header.noLocalSpace'), 'amber');
    showToast(t('toast.quotaError'));
  } else {
    updateSyncBadge(t('header.savedLocal'), 'emerald');
  }
}

function renderApp() {
  renderGlobalStats(MCU_CATALOG, userProgress);
  renderMarathonPlanner(MCU_CATALOG, filterState, userProgress);
  updateActiveFiltersBadge();
  const list = getFilteredAndSortedCatalog(MCU_CATALOG, filterState, userProgress);
  renderCatalogGrid({
    catalog: MCU_CATALOG,
    list,
    filterState,
    userProgress,
    collapsedGroups,
    mediaApi,
    itemsById,
  });
}

// ============================================================================
// MODALES (CON SOPORTE ESCAPE Y CLIC EN BACKDROP)
// ============================================================================
const MODAL_IDS = [
  'pwaModal',
  'detailModal',
  'syncModal',
  'imageApiModal',
  'confirmResetModal',
  'legalModal',
  'deeplinkModal',
  'compareModal',
  'confirmOverwriteModal',
];

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getTopmostVisibleModal() {
  for (let i = MODAL_IDS.length - 1; i >= 0; i--) {
    const modal = document.getElementById(MODAL_IDS[i]);
    if (modal && !modal.classList.contains('hidden')) {
      return modal;
    }
  }
  return null;
}

/** @param {HTMLElement} container */
function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => {
    if (!(el instanceof HTMLElement)) return false;
    return !el.classList.contains('hidden') && el.offsetParent !== null;
  });
}

/** @param {HTMLElement} modal */
function focusFirstElementInModal(modal) {
  const focusables = getFocusableElements(modal);
  if (focusables.length > 0 && focusables[0] instanceof HTMLElement) {
    focusables[0].focus();
    return;
  }
  if (!modal.hasAttribute('tabindex')) {
    modal.setAttribute('tabindex', '-1');
  }
  modal.focus();
}

/** @param {KeyboardEvent} e */
function handleModalTabTrap(e) {
  const modal = getTopmostVisibleModal();
  if (!modal) return;
  const focusables = getFocusableElements(modal);
  if (focusables.length === 0) {
    e.preventDefault();
    return;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;
  if (e.shiftKey) {
    if (active === first || !(active instanceof Node) || !modal.contains(active)) {
      e.preventDefault();
      if (last instanceof HTMLElement) last.focus();
    }
  } else if (active === last || !(active instanceof Node) || !modal.contains(active)) {
    e.preventDefault();
    if (first instanceof HTMLElement) first.focus();
  }
}

function openModal(id) {
  const anyAlreadyOpen = getTopmostVisibleModal() !== null;
  if (!anyAlreadyOpen && document.activeElement instanceof HTMLElement) {
    modalReturnFocusEl = document.activeElement;
  }
  if (id === 'syncModal') {
    syncTextareaDirty = false;
    const nickInput = getFormField('exportNickInput');
    if (nickInput) nickInput.value = userProgress.nick || '';
    const shareBtn = document.getElementById('btnNativeShareLink');
    if (shareBtn) {
      const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
      shareBtn.classList.toggle('hidden', !canShare);
      shareBtn.classList.toggle('inline-flex', canShare);
    }
    void refreshSyncModalOutputs();
  }
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
    focusFirstElementInModal(modal);
  }
}

function isModalVisible(id) {
  const modal = document.getElementById(id);
  return Boolean(modal && !modal.classList.contains('hidden'));
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
  if (id === 'detailModal') currentOpenItemId = null;
  if (
    (id === 'deeplinkModal' || id === 'compareModal' || id === 'confirmOverwriteModal') &&
    !isModalVisible('deeplinkModal') &&
    !isModalVisible('compareModal') &&
    !isModalVisible('confirmOverwriteModal')
  ) {
    pendingIncomingShare = null;
  }
  if (!getTopmostVisibleModal() && modalReturnFocusEl) {
    const returnEl = modalReturnFocusEl;
    modalReturnFocusEl = null;
    if (returnEl.isConnected && returnEl.offsetParent !== null) {
      returnEl.focus();
    }
  }
}

function closeActiveModal() {
  for (let i = MODAL_IDS.length - 1; i >= 0; i--) {
    const id = MODAL_IDS[i];
    const modal = document.getElementById(id);
    if (modal && !modal.classList.contains('hidden')) {
      closeModal(id);
      return;
    }
  }
}

// ============================================================================
// ACCIONES DE CHECKLIST Y DETALLE
// ============================================================================
function toggleItemWatched(itemId) {
  const item = itemsById.get(itemId);
  if (!item) return;

  const comp = getItemCompletionStatus(item, userProgress);
  const markAsDone = comp.status !== 'completed';

  if (markAsDone) {
    userProgress.watchedItems[itemId] = true;
    if (item.seasons) {
      const epMap = {};
      item.seasons.forEach((s) =>
        s.episodes.forEach((ep) => {
          epMap[ep.code] = true;
        }),
      );
      userProgress.watchedEpisodes[itemId] = epMap;
    }
  } else {
    delete userProgress.watchedItems[itemId];
    delete userProgress.watchedEpisodes[itemId];
  }

  saveProgress();
  renderApp();
  if (currentOpenItemId === itemId) {
    renderDetailModalBody(item, { filterState, userProgress, mediaApi });
  }
  showToast(t(markAsDone ? 'toast.markedWatched' : 'toast.markedUnwatched', { title: item.title }));
}

function toggleEpisodeWatched(itemId, epCode) {
  const item = itemsById.get(itemId);
  if (!item) return;

  if (!userProgress.watchedEpisodes[itemId]) {
    userProgress.watchedEpisodes[itemId] = {};
  }
  if (userProgress.watchedEpisodes[itemId][epCode]) {
    delete userProgress.watchedEpisodes[itemId][epCode];
  } else {
    userProgress.watchedEpisodes[itemId][epCode] = true;
  }

  const comp = getItemCompletionStatus(item, userProgress);
  if (comp.status === 'completed') {
    userProgress.watchedItems[itemId] = true;
  } else {
    delete userProgress.watchedItems[itemId];
  }

  saveProgress();
  renderApp();
  if (currentOpenItemId === itemId) {
    renderDetailModalBody(item, { filterState, userProgress, mediaApi });
  }
}

function toggleSeasonWatched(itemId, seasonNumber) {
  const item = itemsById.get(itemId);
  if (!item || !item.seasons) return;

  const season = item.seasons.find((s) => s.seasonNumber === seasonNumber);
  if (!season) return;

  if (!userProgress.watchedEpisodes[itemId]) {
    userProgress.watchedEpisodes[itemId] = {};
  }
  const epMap = userProgress.watchedEpisodes[itemId];
  const allDone = season.episodes.every((ep) => Boolean(epMap[ep.code]));

  season.episodes.forEach((ep) => {
    if (allDone) delete epMap[ep.code];
    else epMap[ep.code] = true;
  });

  const comp = getItemCompletionStatus(item, userProgress);
  if (comp.status === 'completed') {
    userProgress.watchedItems[itemId] = true;
  } else {
    delete userProgress.watchedItems[itemId];
  }

  saveProgress();
  renderApp();
  if (currentOpenItemId === itemId) {
    renderDetailModalBody(item, { filterState, userProgress, mediaApi });
  }
}

function setUserRating(itemId, stars) {
  const num = Number(stars);
  if (!Number.isInteger(num) || num < 1 || num > 5) return;
  userProgress.userRatings[itemId] = num;
  saveProgress();
  renderApp();
  const item = itemsById.get(itemId);
  if (item && currentOpenItemId === itemId) {
    renderDetailModalBody(item, { filterState, userProgress, mediaApi });
  }
  showToast(t('toast.ratingSaved', { stars: num }));
}

function saveUserNote(itemId, text) {
  const trimmed = String(text ?? '')
    .trim()
    .slice(0, MAX_NOTE_LENGTH);
  if (trimmed) userProgress.userNotes[itemId] = trimmed;
  else delete userProgress.userNotes[itemId];
  saveProgress();
  renderApp();
  showToast(t('toast.noteSaved'));
}

async function openDetailModal(itemId) {
  const item = itemsById.get(itemId);
  if (!item) return;
  currentOpenItemId = itemId;

  const catStyle = getCategoryColors(item.category);
  const catBadge = document.getElementById('modalCategoryBadge');
  if (catBadge) {
    catBadge.className = `text-xs font-bold px-2.5 py-1 rounded-md border ${catStyle.badge}`;
    catBadge.textContent = catStyle.label;
  }
  const phaseBadge = document.getElementById('modalPhaseBadge');
  if (phaseBadge) {
    phaseBadge.textContent = `${getLocalizedPhase(item.phase)} • ${item.timelineYear}`;
  }

  if (Array.isArray(item.seasons) && item.seasons.length > 0) {
    try {
      await loadEpisodeSynopsesForItem(item.id, getLang());
    } catch (err) {
      console.error('Error loading episode synopses:', err);
    }
  }

  renderDetailModalBody(item, { filterState, userProgress, mediaApi });
  openModal('detailModal');

  // Cargar póster si aún no está en caché
  if (!mediaApi.getCachedPoster(item.id)) {
    mediaApi.fetchPosterForItem(item);
  }

  // Cargar metadatos de episodios desde TVMaze de forma desacoplada de OMDb
  if (item.tvShowQuery && !mediaApi.hasEpisodeMeta(item.id)) {
    await mediaApi.fetchEpisodeMetaForItem(item);
    if (currentOpenItemId === item.id) {
      renderDetailModalBody(item, { filterState, userProgress, mediaApi });
    }
  }
}

// ============================================================================
// CONTROLES DE FILTROS, GRUPOS Y PLANIFICADOR
// ============================================================================
const ORDER_BTN_BASE_CLASS =
  'py-2 px-2 sm:px-3 rounded-lg text-[11px] sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 text-center leading-tight';
const ORDER_BTN_ACTIVE_CLASS = `${ORDER_BTN_BASE_CLASS} bg-marvel-red text-white shadow`;
const ORDER_BTN_INACTIVE_CLASS = `${ORDER_BTN_BASE_CLASS} text-gray-400 hover:text-white`;

const CAT_PILL_BASE_CLASS = 'cat-pill shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-semibold';
const CAT_PILL_ACTIVE_CLASS = `${CAT_PILL_BASE_CLASS} bg-white text-gray-900 shadow`;
const CAT_PILL_INACTIVE_CLASS = `${CAT_PILL_BASE_CLASS} bg-[#0B0E14] text-gray-300 hover:text-white border border-marvel-border`;

function setOrderMode(mode) {
  filterState.orderMode = mode;
  const btnRelease = document.getElementById('btnOrderRelease');
  const btnChrono = document.getElementById('btnOrderChrono');

  if (btnRelease && btnChrono) {
    const isRelease = mode === 'release';
    btnRelease.className = isRelease ? ORDER_BTN_ACTIVE_CLASS : ORDER_BTN_INACTIVE_CLASS;
    btnChrono.className = isRelease ? ORDER_BTN_INACTIVE_CLASS : ORDER_BTN_ACTIVE_CLASS;
  }
  renderApp();
}

function setCategoryFilter(cat) {
  filterState.category = cat;
  document.querySelectorAll('.cat-pill').forEach((btn) => {
    const isActive = btn.getAttribute('data-cat') === cat;
    btn.className = isActive ? CAT_PILL_ACTIVE_CLASS : CAT_PILL_INACTIVE_CLASS;
  });
  renderApp();
}

function toggleDoomsdayFilter() {
  filterState.doomsdayOnly = !filterState.doomsdayOnly;
  const btn = document.getElementById('btnDoomsdayFilter');
  if (btn) {
    btn.setAttribute('aria-pressed', String(filterState.doomsdayOnly));
    if (filterState.doomsdayOnly) {
      btn.className =
        'w-full h-full py-2.5 px-3 rounded-xl border border-emerald-400 bg-emerald-500/20 text-xs sm:text-sm font-bold text-emerald-300 flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/10';
    } else {
      btn.className =
        'w-full h-full py-2.5 px-3 rounded-xl border border-marvel-border bg-[#0B0E14] hover:border-emerald-500/50 text-xs sm:text-sm font-semibold text-gray-300 flex items-center justify-center gap-2 transition';
    }
  }
  renderApp();
}

function applyFilters() {
  const searchInput = getFormField('searchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  const phaseSelect = getFormField('phaseSelect');
  const statusSelect = getFormField('statusSelect');

  const searchVal = searchInput ? searchInput.value : '';
  filterState.search = searchVal;
  if (clearBtn) clearBtn.classList.toggle('hidden', !searchVal);
  if (phaseSelect) filterState.phase = phaseSelect.value;
  if (statusSelect) filterState.status = statusSelect.value;
  renderApp();
}

const debouncedSearchFilter = debounce(applyFilters, 200);

function clearSearch() {
  debouncedSearchFilter.cancel();
  const searchInput = getFormField('searchInput');
  if (searchInput) searchInput.value = '';
  applyFilters();
}

function resetFilters() {
  debouncedSearchFilter.cancel();
  const searchInput = getFormField('searchInput');
  const phaseSelect = getFormField('phaseSelect');
  const statusSelect = getFormField('statusSelect');
  if (searchInput) searchInput.value = '';
  document.getElementById('clearSearchBtn')?.classList.add('hidden');
  if (phaseSelect) phaseSelect.value = 'all';
  if (statusSelect) statusSelect.value = 'all';
  filterState.search = '';
  filterState.phase = 'all';
  filterState.status = 'all';
  if (filterState.doomsdayOnly) toggleDoomsdayFilter();
  setCategoryFilter('all');
}

function setGroupMode(mode) {
  filterState.groupMode = mode;
  const toggleBtn = document.getElementById('btnToggleAllGroups');
  if (toggleBtn) {
    toggleBtn.classList.toggle('hidden', mode === 'none');
  }
  renderApp();
}

function toggleGroupCollapse(groupId) {
  collapsedGroups[groupId] = !collapsedGroups[groupId];
  renderApp();
}

function toggleAllGroups() {
  const groupEls = document.querySelectorAll('[data-group-section]');
  const anyExpanded = Array.from(groupEls).some(
    (el) => !collapsedGroups[el.getAttribute('data-group-section')],
  );
  groupEls.forEach((el) => {
    const gId = el.getAttribute('data-group-section');
    if (gId) collapsedGroups[gId] = anyExpanded;
  });
  syncToggleAllGroupsButton(collapsedGroups);
  renderApp();
}

function toggleGroupWatched(groupId) {
  const list = getFilteredAndSortedCatalog(MCU_CATALOG, filterState, userProgress);
  const groupItems = list.filter(
    (item) => getItemSagaMeta(item, filterState.orderMode, filterState.groupMode).id === groupId,
  );
  if (groupItems.length === 0) return;

  const allDone = groupItems.every(
    (item) => getItemCompletionStatus(item, userProgress).status === 'completed',
  );
  groupItems.forEach((item) => {
    if (allDone) {
      delete userProgress.watchedItems[item.id];
      delete userProgress.watchedEpisodes[item.id];
    } else {
      userProgress.watchedItems[item.id] = true;
      if (item.seasons) {
        const epMap = {};
        item.seasons.forEach((s) =>
          s.episodes.forEach((ep) => {
            epMap[ep.code] = true;
          }),
        );
        userProgress.watchedEpisodes[item.id] = epMap;
      }
    }
  });
  saveProgress();
  renderApp();
  showToast(
    t(allDone ? 'toast.blockUnwatched' : 'toast.blockWatched', { count: groupItems.length }),
  );
}

function markVisibleAsWatched() {
  const visible = getFilteredAndSortedCatalog(MCU_CATALOG, filterState, userProgress);
  visible.forEach((item) => {
    userProgress.watchedItems[item.id] = true;
    if (item.seasons) {
      const epMap = {};
      item.seasons.forEach((s) =>
        s.episodes.forEach((ep) => {
          epMap[ep.code] = true;
        }),
      );
      userProgress.watchedEpisodes[item.id] = epMap;
    }
  });
  saveProgress();
  renderApp();
  showToast(t('toast.visibleMarked', { count: visible.length }));
}

function resetAllProgress() {
  // Preserva targetDate y nick; mantiene intacta la clave OMDb (almacenada por separado)
  userProgress = createDefaultProgress(userProgress.targetDate, userProgress.nick);
  saveProgress();
  renderApp();
  closeModal('confirmResetModal');
  showToast(t('toast.resetDone'));
}

function isCompactViewport() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(max-width: 1023px), (max-height: 780px)').matches;
}

function setPlannerExpanded(expanded) {
  const panel = document.getElementById('plannerSection');
  if (panel) panel.classList.toggle('hidden', !expanded);
  document.querySelectorAll('[data-action="toggle-planner"]').forEach((btn) => {
    btn.setAttribute('aria-expanded', String(expanded));
  });
}

function togglePlannerPanel() {
  const panel = document.getElementById('plannerSection');
  if (!panel) return;
  setPlannerExpanded(panel.classList.contains('hidden'));
}

function setFiltersExpanded(expanded) {
  const body = document.getElementById('filtersCollapsibleBody');
  const btn = document.getElementById('btnToggleFilters');
  const chevron = document.getElementById('filtersChevron');
  if (body) body.classList.toggle('hidden', !expanded);
  if (btn) btn.setAttribute('aria-expanded', String(expanded));
  if (chevron) chevron.classList.toggle('rotate-180', expanded);
}

function toggleFiltersPanel() {
  const body = document.getElementById('filtersCollapsibleBody');
  if (!body) return;
  setFiltersExpanded(body.classList.contains('hidden'));
}

function updateActiveFiltersBadge() {
  const badge = document.getElementById('activeFiltersCountBadge');
  if (!badge) return;
  let activeCount = 0;
  if (filterState.category !== 'all') activeCount += 1;
  if (filterState.phase !== 'all') activeCount += 1;
  if (filterState.status !== 'all') activeCount += 1;
  if (filterState.doomsdayOnly) activeCount += 1;
  if (filterState.orderMode !== 'release') activeCount += 1;

  badge.textContent = String(activeCount);
  badge.classList.toggle('hidden', activeCount === 0);
}

function handleTargetDateChange() {
  const targetInput = getFormField('targetDateInput');
  if (!targetInput) return;
  const val = targetInput.value || '2026-12-18';
  userProgress.targetDate = val;
  saveProgress();
  renderMarathonPlanner(MCU_CATALOG, filterState, userProgress);
}

// ============================================================================
// EXPORTAR / IMPORTAR Y CLAVE OMDB
// ============================================================================
function getExportOptionsFromModal() {
  const nickInput = getFormField('exportNickInput');
  const includeNotesEl = document.getElementById('exportIncludeNotesCheckbox');
  const includeNotes = includeNotesEl instanceof HTMLInputElement ? includeNotesEl.checked : true;
  const nick = nickInput ? sanitizeNick(nickInput.value) : userProgress.nick || '';
  return { includeNotes, nick };
}

async function refreshSyncModalOutputs() {
  const seq = ++syncOutputSeq;
  // Invalidar de inmediato la exportación previa para no compartir datos obsoletos (p. ej. notas recién excluidas)
  latestLocalExport = null;
  const linkInput = getFormField('shareDeeplinkInput');
  if (linkInput) linkInput.value = '';
  const textarea = getFormField('syncCodeTextarea');
  if (textarea && !syncTextareaDirty) textarea.value = '';

  const run = (async () => {
    try {
      const { includeNotes, nick } = getExportOptionsFromModal();
      const code = await encodeCompressedSyncCode(userProgress, { includeNotes, nick });
      if (seq !== syncOutputSeq) return;
      const url = buildShareDeeplink(window.location.href, code);
      latestLocalExport = { code, url };
      if (linkInput) linkInput.value = url;
      if (textarea && !syncTextareaDirty) textarea.value = code;
    } catch (err) {
      if (seq === syncOutputSeq) {
        latestLocalExport = null;
        if (linkInput) linkInput.value = '';
        if (textarea && !syncTextareaDirty) textarea.value = '';
        const isTooLarge = err instanceof Error && err.message === 'Código demasiado grande';
        showToast(isTooLarge ? t('toast.exportTooLarge') : t('toast.invalidCode'));
      }
    } finally {
      if (seq === syncOutputSeq) {
        pendingSyncRefreshPromise = null;
      }
    }
  })();

  pendingSyncRefreshPromise = run;
  return run;
}

const debouncedExportNickInput = debounce(() => {
  const nickInput = getFormField('exportNickInput');
  if (!nickInput) return;
  const cleaned = sanitizeNick(nickInput.value);
  if (userProgress.nick !== cleaned) {
    userProgress.nick = cleaned;
    saveProgress();
  }
  void refreshSyncModalOutputs();
}, 250);

function handleExportNickInput() {
  latestLocalExport = null;
  const linkInput = getFormField('shareDeeplinkInput');
  if (linkInput) linkInput.value = '';
  debouncedExportNickInput();
}

async function ensureFreshLocalExport() {
  if (latestLocalExport) return latestLocalExport;
  if (pendingSyncRefreshPromise) {
    await pendingSyncRefreshPromise;
    return latestLocalExport;
  }
  await refreshSyncModalOutputs();
  return latestLocalExport;
}

async function handleCopyShareLink() {
  const exp = latestLocalExport || (await ensureFreshLocalExport());
  if (!exp) return;
  const linkInput = getFormField('shareDeeplinkInput');
  const ok = await copyToClipboard(exp.url, linkInput);
  showToast(ok ? t('toast.linkCopied') : t('toast.linkCopyFallback'));
}

async function handleNativeShareLink() {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return;
  const exp = latestLocalExport || (await ensureFreshLocalExport());
  if (!exp) return;
  const linkInput = getFormField('shareDeeplinkInput');
  try {
    await navigator.share({
      title: t('meta.title'),
      text: userProgress.nick
        ? t('deeplink.fromUser', { nick: userProgress.nick })
        : t('meta.title'),
      url: exp.url,
    });
    showToast(t('toast.linkShared'));
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return;
    const ok = await copyToClipboard(exp.url, linkInput);
    showToast(ok ? t('toast.linkCopied') : t('toast.linkCopyFallback'));
  }
}

async function handleCopySyncCode() {
  const textarea = getFormField('syncCodeTextarea');
  const exp = latestLocalExport || (await ensureFreshLocalExport());
  if (!exp) return;
  syncTextareaDirty = false;
  if (textarea) textarea.value = exp.code;
  const ok = await copyToClipboard(exp.code, textarea);
  showToast(ok ? t('toast.codeCopied') : t('toast.codeCopyFallback'));
}

function formatImportSuccessToast(compatibility, sourceLabel) {
  if (compatibility.status === 'legacy') {
    return t('toast.importLegacy', { source: sourceLabel, current: compatibility.currentVersion });
  }
  if (compatibility.status === 'newer_minor') {
    return t('toast.importNewerMinor', {
      source: sourceLabel,
      imported: compatibility.importedVersion,
      current: compatibility.currentVersion,
    });
  }
  return t('toast.importExact', { source: sourceLabel, imported: compatibility.importedVersion });
}

async function handleImportSyncCode() {
  const textarea = getFormField('syncCodeTextarea');
  const raw = textarea ? textarea.value.trim() : '';
  if (!raw) {
    showToast(t('toast.pasteValidCode'));
    return;
  }
  try {
    const incoming = await decodeAnySyncCodeWithMeta(raw, userProgress);
    pendingIncomingShare = incoming;
    pendingImportSource = 'progress';
    closeModal('syncModal');
    renderOverwriteConfirmModal(MCU_CATALOG, userProgress, incoming);
    openModal('confirmOverwriteModal');
  } catch (err) {
    const msg =
      err instanceof Error && err.message.startsWith('Versión de esquema')
        ? err.message
        : t('toast.invalidCode');
    showToast(msg);
  }
}

async function checkIncomingDeeplinkHash() {
  const code = extractSyncCodeFromHash(window.location.hash);
  if (!code) return;

  const reqSeq = ++deeplinkRequestSeq;

  // Limpiar el fragmento de la URL para evitar reabrir el modal al recargar
  try {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  } catch {
    // Ignorar en entornos donde replaceState esté restringido
  }

  try {
    const incoming = await decodeAnySyncCodeWithMeta(code, userProgress);
    if (reqSeq !== deeplinkRequestSeq) return;
    closeModal('confirmOverwriteModal');
    closeModal('compareModal');
    pendingIncomingShare = incoming;
    pendingImportSource = 'deeplink';
    renderDeeplinkModal(MCU_CATALOG, incoming);
    openModal('deeplinkModal');
  } catch (err) {
    if (reqSeq !== deeplinkRequestSeq) return;
    const msg =
      err instanceof Error && err.message.startsWith('Versión de esquema')
        ? err.message
        : t('toast.deeplinkInvalid');
    showToast(msg);
  }
}

function handleOpenCompareFromDeeplink() {
  if (!pendingIncomingShare) return;
  activeCompareTab = 'both';
  renderCompareModal(MCU_CATALOG, userProgress, pendingIncomingShare, activeCompareTab);
  openModal('compareModal');
  closeModal('deeplinkModal');
}

function handleRequestOverwriteConfirm() {
  if (!pendingIncomingShare) return;
  renderOverwriteConfirmModal(MCU_CATALOG, userProgress, pendingIncomingShare);
  openModal('confirmOverwriteModal');
  closeModal('deeplinkModal');
  closeModal('compareModal');
}

function handleConfirmOverwriteImport() {
  if (!pendingIncomingShare) return;
  const { progress, compatibility, meta } = pendingIncomingShare;
  const source = pendingImportSource;
  userProgress = progress;
  const targetInput = getFormField('targetDateInput');
  if (targetInput) targetInput.value = userProgress.targetDate;
  saveProgress();
  renderApp();
  pendingIncomingShare = null;
  closeModal('confirmOverwriteModal');
  if (source === 'json') {
    showToast(formatImportSuccessToast(compatibility, t('toast.sourceJson')));
  } else if (meta?.nick) {
    showToast(t('toast.deeplinkImported', { nick: meta.nick }));
  } else {
    showToast(formatImportSuccessToast(compatibility, t('toast.sourceProgress')));
  }
}

function handleDownloadJsonBackup() {
  const { nick } = getExportOptionsFromModal();
  const dataStr = JSON.stringify(getExportableProgress(userProgress, { nick }), null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mcu_checklist_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(t('toast.jsonDownloaded'));
}

function handleUploadJsonBackup(event) {
  const input = event.target;
  const file = input.files?.[0];
  if (!file) return;
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    input.value = '';
    showToast(t('toast.jsonTooLarge'));
    return;
  }

  const reader = new FileReader();
  reader.addEventListener('load', (e) => {
    try {
      const parsed = JSON.parse(String(e.target?.result ?? ''));
      const incoming = importProgressPayload(parsed, userProgress);
      pendingIncomingShare = incoming;
      pendingImportSource = 'json';
      closeModal('syncModal');
      renderOverwriteConfirmModal(MCU_CATALOG, userProgress, incoming);
      openModal('confirmOverwriteModal');
    } catch (err) {
      const msg =
        err instanceof Error && err.message.startsWith('Versión de esquema')
          ? err.message
          : t('toast.invalidJson');
      showToast(msg);
    } finally {
      // Permite volver a seleccionar el mismo archivo tras una importación o fallo
      input.value = '';
    }
  });
  reader.addEventListener('error', () => {
    input.value = '';
    showToast(t('toast.jsonReadError'));
  });
  reader.readAsText(file);
}

function syncExternalMediaToggleUi() {
  const enabled = mediaApi.isExternalMediaEnabled();
  const btn = document.getElementById('btnToggleExternalMedia');
  const label = document.getElementById('externalMediaStatusLabel');
  const track = document.getElementById('externalMediaTrack');
  const knob = document.getElementById('externalMediaKnob');

  if (btn) btn.setAttribute('aria-checked', String(enabled));
  if (label) {
    label.textContent = enabled ? t('imageApi.enabled') : t('imageApi.disabled');
    label.className = `text-xs font-bold ${enabled ? 'text-emerald-400' : 'text-gray-400'}`;
  }
  if (track) {
    track.className = `watch-switch-track relative inline-flex items-center w-11 h-6 rounded-full border ${
      enabled
        ? 'bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/25'
        : 'bg-gray-800 border-gray-600/80'
    }`;
  }
  if (knob) {
    knob.className = `watch-switch-knob inline-block w-4 h-4 rounded-full shadow-md transform ${
      enabled ? 'translate-x-5 bg-white' : 'translate-x-0.5 bg-gray-300'
    }`;
  }
}

function handleToggleExternalMedia() {
  const next = !mediaApi.isExternalMediaEnabled();
  saveExternalMediaPref(next);
  mediaApi.setExternalMediaEnabled(next);
  syncExternalMediaToggleUi();
  renderApp();
  showToast(next ? t('toast.externalOn') : t('toast.externalOff'));
}

function handleSaveOmdbApiKey() {
  const input = getFormField('omdbApiKeyInput');
  const val = input ? input.value.trim() : '';
  saveOmdbApiKeyToStorage(val);
  mediaApi.setOmdbApiKey(val);
  renderApp();
  closeModal('imageApiModal');
  if (!mediaApi.isExternalMediaEnabled() && val) {
    showToast(t('toast.omdbSavedOff'));
  } else {
    showToast(val ? t('toast.omdbSavedOn') : t('toast.omdbRemoved'));
  }
}

function syncSchemaBadgeText() {
  const schemaBadge = document.getElementById('syncSchemaVersionBadge');
  if (schemaBadge) {
    schemaBadge.textContent = t('sync.schemaBadge', { version: PROGRESS_SCHEMA_VERSION });
  }
}

async function handleToggleLang() {
  const nextLang = getLang() === 'es' ? 'en' : 'es';
  setLang(nextLang);
  await loadCatalogTranslations(nextLang);
  applyStaticTranslations();
  syncExternalMediaToggleUi();
  syncSchemaBadgeText();
  updateSyncBadge(t('header.savedLocal'), 'emerald');
  renderApp();

  if (currentOpenItemId) {
    const item = itemsById.get(currentOpenItemId);
    if (item) {
      if (Array.isArray(item.seasons) && item.seasons.length > 0) {
        await loadEpisodeSynopsesForItem(item.id, nextLang);
      }
      const catStyle = getCategoryColors(item.category);
      const catBadge = document.getElementById('modalCategoryBadge');
      if (catBadge) {
        catBadge.className = `text-xs font-bold px-2.5 py-1 rounded-md border ${catStyle.badge}`;
        catBadge.textContent = catStyle.label;
      }
      const phaseBadge = document.getElementById('modalPhaseBadge');
      if (phaseBadge) {
        phaseBadge.textContent = `${getLocalizedPhase(item.phase)} • ${item.timelineYear}`;
      }
      renderDetailModalBody(item, { filterState, userProgress, mediaApi });
    }
  }

  if (pendingIncomingShare) {
    if (isModalVisible('deeplinkModal')) {
      renderDeeplinkModal(MCU_CATALOG, pendingIncomingShare);
    }
    if (isModalVisible('compareModal')) {
      renderCompareModal(MCU_CATALOG, userProgress, pendingIncomingShare, activeCompareTab);
    }
    if (isModalVisible('confirmOverwriteModal')) {
      renderOverwriteConfirmModal(MCU_CATALOG, userProgress, pendingIncomingShare);
    }
  }
  showToast(t('toast.langSwitched'));
}

function setEpisodeCardSynopsisExpanded(card, expanded) {
  const panel = card?.querySelector('[data-episode-synopsis]');
  if (!panel) return;
  panel.classList.toggle('hidden', !expanded);
  card
    .querySelector('[data-action="toggle-episode-synopsis"]')
    ?.setAttribute('aria-expanded', String(expanded));
  card.querySelector('[data-ep-chevron]')?.classList.toggle('rotate-180', expanded);
}

function handleCatalogGridClick(e) {
  if (e.target.closest('[data-stop-card="true"]')) return;

  const toggleItemBtn = e.target.closest('[data-action="toggle-item"]');
  if (toggleItemBtn) {
    e.stopPropagation();
    toggleItemWatched(toggleItemBtn.getAttribute('data-item-id'));
    return;
  }

  const toggleGroupWatchedBtn = e.target.closest('[data-action="toggle-group-watched"]');
  if (toggleGroupWatchedBtn) {
    e.stopPropagation();
    toggleGroupWatched(toggleGroupWatchedBtn.getAttribute('data-group-id'));
    return;
  }

  const toggleCollapseEl = e.target.closest('[data-action="toggle-group-collapse"]');
  if (toggleCollapseEl) {
    toggleGroupCollapse(toggleCollapseEl.getAttribute('data-group-id'));
    return;
  }

  const detailTrigger = e.target.closest('[data-action="open-detail"]');
  if (detailTrigger) {
    openDetailModal(detailTrigger.getAttribute('data-item-id'));
  }
}

function handleDetailModalClick(e) {
  const toggleItemBtn = e.target.closest('[data-action="toggle-item"]');
  if (toggleItemBtn) {
    toggleItemWatched(toggleItemBtn.getAttribute('data-item-id'));
    return;
  }

  const toggleEpBtn = e.target.closest('[data-action="toggle-episode"]');
  if (toggleEpBtn) {
    toggleEpisodeWatched(
      toggleEpBtn.getAttribute('data-item-id'),
      toggleEpBtn.getAttribute('data-ep-code'),
    );
    return;
  }

  const toggleEpSynopsisBtn = e.target.closest('[data-action="toggle-episode-synopsis"]');
  if (toggleEpSynopsisBtn) {
    const card = toggleEpSynopsisBtn.closest('[data-episode-card]');
    const panel = card?.querySelector('[data-episode-synopsis]');
    if (panel) {
      setEpisodeCardSynopsisExpanded(card, panel.classList.contains('hidden'));
    }
    return;
  }

  const toggleSeasonSynopsesBtn = e.target.closest('[data-action="toggle-season-synopses"]');
  if (toggleSeasonSynopsesBtn) {
    const seasonBlock = toggleSeasonSynopsesBtn.closest('[data-season-block]');
    if (!seasonBlock) return;
    const shouldOpen = toggleSeasonSynopsesBtn.getAttribute('aria-expanded') !== 'true';
    toggleSeasonSynopsesBtn.setAttribute('aria-expanded', String(shouldOpen));
    const label = toggleSeasonSynopsesBtn.querySelector('[data-season-synopses-label]');
    if (label) label.textContent = shouldOpen ? t('detail.hideReviews') : t('detail.showReviews');
    seasonBlock.querySelectorAll('[data-episode-card]').forEach((card) => {
      setEpisodeCardSynopsisExpanded(card, shouldOpen);
    });
    return;
  }

  const toggleSeasonBtn = e.target.closest('[data-action="toggle-season"]');
  if (toggleSeasonBtn) {
    toggleSeasonWatched(
      toggleSeasonBtn.getAttribute('data-item-id'),
      Number(toggleSeasonBtn.getAttribute('data-season-num')),
    );
    return;
  }

  const ratingBtn = e.target.closest('[data-action="set-rating"]');
  if (ratingBtn) {
    setUserRating(
      ratingBtn.getAttribute('data-item-id'),
      Number(ratingBtn.getAttribute('data-stars')),
    );
    return;
  }

  const saveNoteBtn = e.target.closest('[data-action="save-note"]');
  if (saveNoteBtn) {
    const noteInput = getFormField('userNoteInput');
    saveUserNote(saveNoteBtn.getAttribute('data-item-id'), noteInput ? noteInput.value : '');
  }
}

// Manejo de errores de carga de pósters en fase de captura (compatible con CSP estricta sin inline onerror)
function handlePosterError(e) {
  const target = e.target;
  if (target instanceof HTMLImageElement && target.hasAttribute('data-poster-id')) {
    target.classList.add('opacity-0');
  }
}

// ============================================================================
// REGISTRO DE EVENTOS Y DELEGACIÓN
// ============================================================================
function bindEvents() {
  // Búsqueda con debounce
  document.getElementById('searchInput')?.addEventListener('input', () => {
    const val = getFormField('searchInput')?.value || '';
    document.getElementById('clearSearchBtn')?.classList.toggle('hidden', !val);
    debouncedSearchFilter();
  });

  document.getElementById('clearSearchBtn')?.addEventListener('click', clearSearch);
  document.getElementById('phaseSelect')?.addEventListener('change', applyFilters);
  document.getElementById('statusSelect')?.addEventListener('change', applyFilters);
  document.getElementById('groupModeSelect')?.addEventListener('change', (e) => {
    if (e.target instanceof HTMLSelectElement) setGroupMode(e.target.value);
  });
  document
    .getElementById('btnOrderRelease')
    ?.addEventListener('click', () => setOrderMode('release'));
  document
    .getElementById('btnOrderChrono')
    ?.addEventListener('click', () => setOrderMode('chrono'));
  document.getElementById('btnDoomsdayFilter')?.addEventListener('click', toggleDoomsdayFilter);
  document.getElementById('btnToggleAllGroups')?.addEventListener('click', toggleAllGroups);
  document.getElementById('btnMarkVisibleWatched')?.addEventListener('click', markVisibleAsWatched);
  document.getElementById('btnResetFilters')?.addEventListener('click', resetFilters);
  document.getElementById('btnConfirmReset')?.addEventListener('click', resetAllProgress);

  // Planificador
  document.getElementById('targetDateInput')?.addEventListener('change', handleTargetDateChange);
  document
    .getElementById('plannerScopeSelect')
    ?.addEventListener('change', () =>
      renderMarathonPlanner(MCU_CATALOG, filterState, userProgress),
    );
  document.querySelectorAll('[data-action="toggle-planner"]').forEach((btn) => {
    btn.addEventListener('click', togglePlannerPanel);
  });
  document.getElementById('btnToggleFilters')?.addEventListener('click', toggleFiltersPanel);
  document.getElementById('btnToggleLang')?.addEventListener('click', handleToggleLang);

  // Categorías
  document.getElementById('categoryFilterContainer')?.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;
    const btn = e.target.closest('.cat-pill');
    if (!btn) return;
    const cat = btn.getAttribute('data-cat');
    if (cat) setCategoryFilter(cat);
  });

  // Apertura y cierre de modales
  document.querySelectorAll('[data-open-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-open-modal');
      if (target) openModal(target);
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-close-modal');
      if (target) closeModal(target);
    });
  });

  // Cierre al hacer clic en el backdrop del modal
  MODAL_IDS.forEach((id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(id);
    });
  });

  // Cierre con tecla Escape y focus trap con Tab dentro del modal activo
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeActiveModal();
    } else if (e.key === 'Tab') {
      handleModalTabTrap(e);
    }
  });

  // Sync / Backup / Deeplink / Compare / OMDb / PWA
  document.getElementById('exportNickInput')?.addEventListener('input', handleExportNickInput);
  document.getElementById('syncCodeTextarea')?.addEventListener('input', () => {
    syncTextareaDirty = true;
  });
  document
    .getElementById('exportIncludeNotesCheckbox')
    ?.addEventListener('change', () => void refreshSyncModalOutputs());
  document.getElementById('btnCopyShareLink')?.addEventListener('click', handleCopyShareLink);
  document.getElementById('btnNativeShareLink')?.addEventListener('click', handleNativeShareLink);
  document.getElementById('btnCopySyncCode')?.addEventListener('click', handleCopySyncCode);
  document.getElementById('btnImportSyncCode')?.addEventListener('click', handleImportSyncCode);
  document.getElementById('btnDownloadJson')?.addEventListener('click', handleDownloadJsonBackup);
  document.getElementById('uploadJsonInput')?.addEventListener('change', handleUploadJsonBackup);
  document
    .getElementById('btnDeeplinkCompare')
    ?.addEventListener('click', handleOpenCompareFromDeeplink);
  document
    .getElementById('btnDeeplinkImport')
    ?.addEventListener('click', handleRequestOverwriteConfirm);
  document
    .getElementById('btnCompareImport')
    ?.addEventListener('click', handleRequestOverwriteConfirm);
  document
    .getElementById('btnConfirmOverwrite')
    ?.addEventListener('click', handleConfirmOverwriteImport);
  document.getElementById('compareModalBody')?.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;
    const tabBtn = e.target.closest('[data-action="compare-tab"]');
    if (!tabBtn || !pendingIncomingShare) return;
    const nextTab = tabBtn.getAttribute('data-compare-tab') || 'both';
    activeCompareTab = nextTab;
    renderCompareModal(MCU_CATALOG, userProgress, pendingIncomingShare, activeCompareTab);
  });
  window.addEventListener('hashchange', () => void checkIncomingDeeplinkHash());
  document.getElementById('btnSaveOmdbKey')?.addEventListener('click', handleSaveOmdbApiKey);
  document
    .getElementById('btnToggleExternalMedia')
    ?.addEventListener('click', handleToggleExternalMedia);
  document
    .getElementById('btnNativePwaInstall')
    ?.addEventListener('click', () => triggerNativePwaInstall({ showToast, closeModal }));
  document.getElementById('btnOpenSyncFromPwa')?.addEventListener('click', () => {
    closeModal('pwaModal');
    openModal('syncModal');
  });

  // Delegación de clics y teclado en catálogo
  const catalogGrid = document.getElementById('catalogGrid');
  catalogGrid?.addEventListener('click', handleCatalogGridClick);
  catalogGrid?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (!(e.target instanceof Element)) return;
    const card = e.target.closest('article[data-action="open-detail"]');
    if (!card || e.target !== card) return;
    e.preventDefault();
    openDetailModal(card.getAttribute('data-item-id'));
  });

  // Delegación de clics en el modal de detalle
  const modalBody = document.getElementById('modalBodyContent');
  modalBody?.addEventListener('click', handleDetailModalClick);

  catalogGrid?.addEventListener('error', handlePosterError, true);
  modalBody?.addEventListener('error', handlePosterError, true);
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  initPWA();

  const initialLang = detectInitialLang();
  setLang(initialLang);
  await loadCatalogTranslations(initialLang);
  applyStaticTranslations();

  userProgress = loadProgressFromStorage();
  const targetInput = getFormField('targetDateInput');
  if (targetInput && userProgress.targetDate) {
    targetInput.value = userProgress.targetDate;
  }

  const externalMediaPref = loadExternalMediaPref();
  mediaApi.setExternalMediaEnabled(externalMediaPref);
  syncExternalMediaToggleUi();

  const savedOmdbKey = loadOmdbApiKey();
  if (savedOmdbKey) {
    mediaApi.setOmdbApiKey(savedOmdbKey);
    const omdbInput = getFormField('omdbApiKeyInput');
    if (omdbInput) omdbInput.value = savedOmdbKey;
  }

  bindEvents();
  const startExpanded = !isCompactViewport();
  setPlannerExpanded(startExpanded);
  setFiltersExpanded(startExpanded);
  syncSchemaBadgeText();
  updateSyncBadge(t('header.savedLocal'), 'emerald');
  renderApp();
  await checkIncomingDeeplinkHash();
});
