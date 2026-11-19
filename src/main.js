import { MCU_CATALOG } from './catalog.js';
import {
  createDefaultProgress,
  normalizeUserProgress,
  getExportableProgress,
  encodeSyncCode,
  decodeSyncCode,
  loadOmdbApiKey,
  saveOmdbApiKeyToStorage,
  loadProgressFromStorage,
  saveProgressToStorage,
  initCloudPersistence,
  saveProgressToCloud,
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
  updateSyncBadge,
  syncToggleAllGroupsButton,
} from './ui.js';
import { initPWA, triggerNativePwaInstall } from './pwa.js';
import { debounce, copyToClipboard } from './utils.js';

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

const mediaApi = createMediaApi({
  onPosterResolved: (itemId, url) => applyPosterToDom(itemId, url),
});

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
  saveProgressToStorage(userProgress);
  saveProgressToCloud(userProgress);
}

function renderApp() {
  renderGlobalStats(MCU_CATALOG, userProgress);
  renderMarathonPlanner(MCU_CATALOG, filterState, userProgress);
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
const MODAL_IDS = ['pwaModal', 'detailModal', 'syncModal', 'imageApiModal', 'confirmResetModal'];

function openModal(id) {
  if (id === 'syncModal') {
    const textarea = document.getElementById('syncCodeTextarea');
    if (textarea) textarea.value = encodeSyncCode(userProgress);
  }
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
  if (id === 'detailModal') currentOpenItemId = null;
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
      item.seasons.forEach((s) => s.episodes.forEach((ep) => { epMap[ep.code] = true; }));
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
  showToast(markAsDone ? `Marcado como visto: ${item.title}` : `Desmarcado: ${item.title}`);
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
  showToast(`Valoración guardada: ${num}/5 estrellas`);
}

function saveUserNote(itemId, text) {
  const trimmed = String(text ?? '').trim();
  if (trimmed) userProgress.userNotes[itemId] = trimmed;
  else delete userProgress.userNotes[itemId];
  saveProgress();
  renderApp();
  showToast('Nota personal guardada');
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
    phaseBadge.textContent = `${item.phase} • ${item.timelineYear}`;
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
function setOrderMode(mode) {
  filterState.orderMode = mode;
  const btnRelease = document.getElementById('btnOrderRelease');
  const btnChrono = document.getElementById('btnOrderChrono');

  if (btnRelease && btnChrono) {
    if (mode === 'release') {
      btnRelease.className = 'flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 bg-marvel-red text-white shadow';
      btnChrono.className = 'flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 text-gray-400 hover:text-white';
    } else {
      btnChrono.className = 'flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 bg-marvel-red text-white shadow';
      btnRelease.className = 'flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-1.5 text-gray-400 hover:text-white';
    }
  }
  renderApp();
}

function setCategoryFilter(cat) {
  filterState.category = cat;
  document.querySelectorAll('.cat-pill').forEach((btn) => {
    if (btn.getAttribute('data-cat') === cat) {
      btn.className = 'cat-pill px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-gray-900 shadow';
    } else {
      btn.className = 'cat-pill px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0B0E14] text-gray-300 hover:text-white border border-marvel-border';
    }
  });
  renderApp();
}

function toggleDoomsdayFilter() {
  filterState.doomsdayOnly = !filterState.doomsdayOnly;
  const btn = document.getElementById('btnDoomsdayFilter');
  if (btn) {
    btn.setAttribute('aria-pressed', String(filterState.doomsdayOnly));
    if (filterState.doomsdayOnly) {
      btn.className = 'w-full h-full py-2.5 px-3 rounded-xl border border-emerald-400 bg-emerald-500/20 text-xs sm:text-sm font-bold text-emerald-300 flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/10';
    } else {
      btn.className = 'w-full h-full py-2.5 px-3 rounded-xl border border-marvel-border bg-[#0B0E14] hover:border-emerald-500/50 text-xs sm:text-sm font-semibold text-gray-300 flex items-center justify-center gap-2 transition';
    }
  }
  renderApp();
}

function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  const phaseSelect = document.getElementById('phaseSelect');
  const statusSelect = document.getElementById('statusSelect');

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
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  applyFilters();
}

function resetFilters() {
  debouncedSearchFilter.cancel();
  const searchInput = document.getElementById('searchInput');
  const phaseSelect = document.getElementById('phaseSelect');
  const statusSelect = document.getElementById('statusSelect');
  if (searchInput) searchInput.value = '';
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
    (el) => !collapsedGroups[el.getAttribute('data-group-section')]
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
    (item) => getItemSagaMeta(item, filterState.orderMode, filterState.groupMode).id === groupId
  );
  if (groupItems.length === 0) return;

  const allDone = groupItems.every((item) => getItemCompletionStatus(item, userProgress).status === 'completed');
  groupItems.forEach((item) => {
    if (allDone) {
      delete userProgress.watchedItems[item.id];
      delete userProgress.watchedEpisodes[item.id];
    } else {
      userProgress.watchedItems[item.id] = true;
      if (item.seasons) {
        const epMap = {};
        item.seasons.forEach((s) => s.episodes.forEach((ep) => { epMap[ep.code] = true; }));
        userProgress.watchedEpisodes[item.id] = epMap;
      }
    }
  });
  saveProgress();
  renderApp();
  showToast(allDone ? 'Bloque desmarcado' : `¡${groupItems.length} títulos del bloque marcados como vistos!`);
}

function markVisibleAsWatched() {
  const visible = getFilteredAndSortedCatalog(MCU_CATALOG, filterState, userProgress);
  visible.forEach((item) => {
    userProgress.watchedItems[item.id] = true;
    if (item.seasons) {
      const epMap = {};
      item.seasons.forEach((s) => s.episodes.forEach((ep) => { epMap[ep.code] = true; }));
      userProgress.watchedEpisodes[item.id] = epMap;
    }
  });
  saveProgress();
  renderApp();
  showToast(`${visible.length} contenidos marcados como vistos`);
}

function resetAllProgress() {
  // Preserva targetDate y mantiene intacta la clave OMDb (almacenada por separado)
  userProgress = createDefaultProgress(userProgress.targetDate);
  saveProgress();
  renderApp();
  closeModal('confirmResetModal');
  showToast('Progreso reiniciado');
}

function togglePlannerPanel() {
  const panel = document.getElementById('plannerSection');
  if (panel) panel.classList.toggle('hidden');
}

function handleTargetDateChange() {
  const targetInput = document.getElementById('targetDateInput');
  if (!targetInput) return;
  const val = targetInput.value || '2026-12-18';
  userProgress.targetDate = val;
  saveProgress();
  renderMarathonPlanner(MCU_CATALOG, filterState, userProgress);
}

// ============================================================================
// EXPORTAR / IMPORTAR Y CLAVE OMDB
// ============================================================================
async function handleCopySyncCode() {
  const code = encodeSyncCode(userProgress);
  const textarea = document.getElementById('syncCodeTextarea');
  if (textarea) textarea.value = code;
  const ok = await copyToClipboard(code, textarea);
  showToast(ok ? 'Código de sincronización copiado al portapapeles' : 'No se pudo copiar automáticamente; cópialo manualmente');
}

function handleImportSyncCode() {
  const textarea = document.getElementById('syncCodeTextarea');
  const raw = textarea ? textarea.value.trim() : '';
  if (!raw) {
    showToast('Pega primero un código válido');
    return;
  }
  try {
    userProgress = decodeSyncCode(raw, userProgress);
    const targetInput = document.getElementById('targetDateInput');
    if (targetInput) targetInput.value = userProgress.targetDate;
    saveProgress();
    renderApp();
    closeModal('syncModal');
    showToast('¡Progreso importado correctamente!');
  } catch {
    showToast('El código introducido no tiene un formato válido');
  }
}

function handleDownloadJsonBackup() {
  const dataStr = JSON.stringify(getExportableProgress(userProgress), null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mcu_checklist_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Archivo JSON descargado');
}

function handleUploadJsonBackup(event) {
  const input = event.target;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(String(e.target?.result ?? ''));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('JSON raíz inválido');
      }
      userProgress = normalizeUserProgress(parsed, userProgress);
      const targetInput = document.getElementById('targetDateInput');
      if (targetInput) targetInput.value = userProgress.targetDate;
      saveProgress();
      renderApp();
      closeModal('syncModal');
      showToast('¡Copia de seguridad JSON restaurada!');
    } catch {
      showToast('El archivo JSON no es válido');
    } finally {
      // Permite volver a seleccionar el mismo archivo tras una importación o fallo
      input.value = '';
    }
  };
  reader.onerror = () => {
    input.value = '';
    showToast('No se pudo leer el archivo JSON');
  };
  reader.readAsText(file);
}

function handleSaveOmdbApiKey() {
  const input = document.getElementById('omdbApiKeyInput');
  const val = input ? input.value.trim() : '';
  saveOmdbApiKeyToStorage(val);
  mediaApi.setOmdbApiKey(val);
  renderApp();
  closeModal('imageApiModal');
  showToast(val ? 'Clave OMDb (IMDb) activada y recargando portadas' : 'Usando motor automático TVMaze + Wikipedia');
}

// ============================================================================
// REGISTRO DE EVENTOS Y DELEGACIÓN
// ============================================================================
function bindEvents() {
  // Búsqueda con debounce
  document.getElementById('searchInput')?.addEventListener('input', () => {
    const val = document.getElementById('searchInput')?.value || '';
    document.getElementById('clearSearchBtn')?.classList.toggle('hidden', !val);
    debouncedSearchFilter();
  });

  document.getElementById('clearSearchBtn')?.addEventListener('click', clearSearch);
  document.getElementById('phaseSelect')?.addEventListener('change', applyFilters);
  document.getElementById('statusSelect')?.addEventListener('change', applyFilters);
  document.getElementById('groupModeSelect')?.addEventListener('change', (e) => setGroupMode(e.target.value));
  document.getElementById('btnOrderRelease')?.addEventListener('click', () => setOrderMode('release'));
  document.getElementById('btnOrderChrono')?.addEventListener('click', () => setOrderMode('chrono'));
  document.getElementById('btnDoomsdayFilter')?.addEventListener('click', toggleDoomsdayFilter);
  document.getElementById('btnToggleAllGroups')?.addEventListener('click', toggleAllGroups);
  document.getElementById('btnMarkVisibleWatched')?.addEventListener('click', markVisibleAsWatched);
  document.getElementById('btnResetFilters')?.addEventListener('click', resetFilters);
  document.getElementById('btnConfirmReset')?.addEventListener('click', resetAllProgress);

  // Planificador
  document.getElementById('targetDateInput')?.addEventListener('change', handleTargetDateChange);
  document.getElementById('plannerScopeSelect')?.addEventListener('change', () =>
    renderMarathonPlanner(MCU_CATALOG, filterState, userProgress)
  );
  document.querySelectorAll('[data-action="toggle-planner"]').forEach((btn) => {
    btn.addEventListener('click', togglePlannerPanel);
  });

  // Categorías
  document.getElementById('categoryFilterContainer')?.addEventListener('click', (e) => {
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

  // Cierre con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeActiveModal();
    }
  });

  // Sync / Backup / OMDb / PWA
  document.getElementById('btnCopySyncCode')?.addEventListener('click', handleCopySyncCode);
  document.getElementById('btnImportSyncCode')?.addEventListener('click', handleImportSyncCode);
  document.getElementById('btnDownloadJson')?.addEventListener('click', handleDownloadJsonBackup);
  document.getElementById('uploadJsonInput')?.addEventListener('change', handleUploadJsonBackup);
  document.getElementById('btnSaveOmdbKey')?.addEventListener('click', handleSaveOmdbApiKey);
  document.getElementById('btnNativePwaInstall')?.addEventListener('click', () =>
    triggerNativePwaInstall({ showToast, closeModal })
  );
  document.getElementById('btnOpenSyncFromPwa')?.addEventListener('click', () => {
    closeModal('pwaModal');
    openModal('syncModal');
  });

  // Delegación de clics en catálogo
  const catalogGrid = document.getElementById('catalogGrid');
  catalogGrid?.addEventListener('click', (e) => {
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
  });

  // Soporte de teclado (Enter / Space) en tarjetas del catálogo
  catalogGrid?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('article[data-action="open-detail"]');
    if (!card || e.target !== card) return;
    e.preventDefault();
    openDetailModal(card.getAttribute('data-item-id'));
  });

  // Delegación de clics en el modal de detalle
  document.getElementById('modalBodyContent')?.addEventListener('click', (e) => {
    const toggleItemBtn = e.target.closest('[data-action="toggle-item"]');
    if (toggleItemBtn) {
      toggleItemWatched(toggleItemBtn.getAttribute('data-item-id'));
      return;
    }

    const toggleEpBtn = e.target.closest('[data-action="toggle-episode"]');
    if (toggleEpBtn) {
      toggleEpisodeWatched(
        toggleEpBtn.getAttribute('data-item-id'),
        toggleEpBtn.getAttribute('data-ep-code')
      );
      return;
    }

    const toggleSeasonBtn = e.target.closest('[data-action="toggle-season"]');
    if (toggleSeasonBtn) {
      toggleSeasonWatched(
        toggleSeasonBtn.getAttribute('data-item-id'),
        Number(toggleSeasonBtn.getAttribute('data-season-num'))
      );
      return;
    }

    const ratingBtn = e.target.closest('[data-action="set-rating"]');
    if (ratingBtn) {
      setUserRating(ratingBtn.getAttribute('data-item-id'), Number(ratingBtn.getAttribute('data-stars')));
      return;
    }

    const saveNoteBtn = e.target.closest('[data-action="save-note"]');
    if (saveNoteBtn) {
      const noteInput = document.getElementById('userNoteInput');
      saveUserNote(saveNoteBtn.getAttribute('data-item-id'), noteInput ? noteInput.value : '');
    }
  });
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initPWA();

  userProgress = loadProgressFromStorage();
  const targetInput = document.getElementById('targetDateInput');
  if (targetInput && userProgress.targetDate) {
    targetInput.value = userProgress.targetDate;
  }

  const savedOmdbKey = loadOmdbApiKey();
  if (savedOmdbKey) {
    mediaApi.setOmdbApiKey(savedOmdbKey);
    const omdbInput = document.getElementById('omdbApiKeyInput');
    if (omdbInput) omdbInput.value = savedOmdbKey;
  }

  bindEvents();
  renderApp();

  initCloudPersistence({
    onRemoteProgress: (remoteRaw) => {
      userProgress = normalizeUserProgress(remoteRaw, userProgress);
      saveProgressToStorage(userProgress);
      const tInput = document.getElementById('targetDateInput');
      if (tInput && userProgress.targetDate) {
        tInput.value = userProgress.targetDate;
      }
      renderApp();
    },
    onStatusChange: (text, color) => updateSyncBadge(text, color),
  });
});
