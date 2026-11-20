export const LANG_STORAGE_KEY = 'mcu_multiverse_lang_v1';
export const SUPPORTED_LANGS = ['es', 'en'];

let currentLang = 'es';
let catalogEnMap = null;

/**
 * @typedef {{ getItem?: (key: string) => string | null, setItem?: (key: string, value: string) => void }} LangStorageLike
 */

export const TRANSLATIONS = {
  es: {
    'meta.title': 'UCM & Multiverso — Checklist No Oficial',
    'header.brand': 'UCM',
    'header.title': 'Checklist Maestro UCM & Multiverso',
    'header.subtitle': 'Guía fan no oficial: películas, series y cómics',
    'header.savedLocal': 'Guardado local',
    'header.savedLocalTitle': 'Tu progreso se guarda automáticamente en este navegador',
    'header.noLocalSpace': 'Sin espacio local',
    'header.langToggleAria': 'Cambiar idioma a inglés',
    'header.langToggleTitle': 'Switch to English',
    'header.pwaInstall': 'Instalar App (PWA)',
    'header.pwaInstallShort': '¡Instalar App!',
    'header.planner': 'Planificador Maratón',
    'header.posters': 'Portadas IMDb / TV',
    'header.sync': 'Exportar / Importar',
    'stats.titlesWatched': '{completed} / {total} títulos vistos',
    'stats.episodes': '{watched} / {total} episodios',
    'stats.remainingHours': '{hours}h restantes',
    'planner.badge': 'Planificador por Fecha Objetivo',
    'planner.daysLeft': 'Faltan {days} días',
    'planner.reached': '¡Fecha objetivo alcanzada!',
    'planner.heading': 'Calcula tu ritmo diario y semanal para llegar a tiempo',
    'planner.desc':
      'El cálculo se adapta automáticamente a los contenidos pendientes de tu vista actual (puedes filtrar por Ruta Esencial Doomsday o ver todo el catálogo).',
    'planner.targetDate': 'Fecha Objetivo',
    'planner.scope': 'Alcance del Plan',
    'planner.scopeFiltered': 'Según filtros activos',
    'planner.scopeDoomsday': 'Solo Ruta Esencial Doomsday',
    'planner.scopeAll': 'Todo el catálogo completo',
    'planner.pendingTitle': 'Pendiente en tu plan',
    'planner.pendingItems': '{titles} títulos ({units} uds.)',
    'planner.dailyPace': 'Ritmo Diario Necesario',
    'planner.dailyUnit': '{mins} min / día',
    'planner.dailyEps': '~{eps} cap./pelis al día',
    'planner.weeklyPace': 'Ritmo Semanal',
    'planner.weeklyUnit': '{hours} h / semana',
    'planner.weeklyTitles': '~{titles} títulos/sem',
    'planner.nextRecommended': 'Próximo Recomendado',
    'planner.allDone': '¡Todo completado!',
    'planner.upToDate': '100% al día',
    'filters.searchPlaceholder': 'Buscar película, serie, personaje, año...',
    'filters.searchAria': 'Buscar en el catálogo',
    'filters.clearSearchAria': 'Limpiar búsqueda',
    'filters.button': 'Filtros',
    'filters.orderRelease': '1. Publicación',
    'filters.orderChrono': '2. Cronológico',
    'filters.doomsday': 'Ruta Esencial Doomsday',
    'filters.catAll': 'Todo',
    'filters.catMovie': 'Películas UCM',
    'filters.catDisneyPlus': 'Series Disney+',
    'filters.catNetflix': 'Netflix (Defenders)',
    'filters.catAbc': 'ABC (S.H.I.E.L.D. / Carter)',
    'filters.catHulu': 'Juvenil / Hulu (Runaways / C&D)',
    'filters.catFox': 'Fox (X-Men / 4F / Deadpool)',
    'filters.catSony': 'Sony & Spider-Verse',
    'filters.catComic': 'Cómics Canon',
    'filters.catSpecial': 'Especiales',
    'filters.phaseAll': 'Todas las Fases / Eras',
    'filters.phase1': 'Fase 1 (2008-2012)',
    'filters.phase2': 'Fase 2 (2013-2015)',
    'filters.phase3': 'Fase 3 (2016-2019)',
    'filters.phase4': 'Fase 4 (2021-2022)',
    'filters.phase5': 'Fase 5 (2023-2025)',
    'filters.phase6': 'Fase 6 (2025-2027)',
    'filters.phaseFoxSony': 'Era Fox & Sony Multiverso',
    'filters.phaseMarvelTv': 'Era ABC, Netflix & Hulu',
    'filters.statusAll': 'Todos los estados',
    'filters.statusPending': 'Pendientes por ver',
    'filters.statusInProgress': 'En progreso (Temporadas)',
    'filters.statusCompleted': 'Completados',
    'toolbar.resultsCount': 'Mostrando {shown} de {total} títulos y temporadas ({order})',
    'toolbar.orderReleaseLong': '1. Orden de Publicación',
    'toolbar.orderChronoLong': '2. Orden Cronológico por Año',
    'toolbar.groupLabel': 'Agrupar:',
    'toolbar.groupInterleaved': 'Sagas, Fases y Eras (Intercalado)',
    'toolbar.groupStrict': 'Por Fase / Era Oficial Separada',
    'toolbar.groupNone': 'Sin agrupar (Lista continua)',
    'toolbar.collapseBlocks': 'Plegar bloques',
    'toolbar.expandBlocks': 'Desplegar bloques',
    'toolbar.markVisible': 'Marcar visibles como vistos',
    'toolbar.reset': 'Reiniciar',
    'empty.title': 'No se encontraron resultados',
    'empty.desc': 'Prueba a cambiar los filtros o limpiar el texto de búsqueda.',
    'empty.resetBtn': 'Restablecer filtros',
    'card.release': 'Estreno: {year}',
    'card.postCredits': '{count} poscréditos',
    'card.postCreditsTitle': 'Escenas poscréditos',
    'card.episodesWatched': '{watched}/{total} episodios vistos',
    'card.episodesBtn': 'Capítulos',
    'card.reviewBtn': 'Reseña',
    'card.hasNoteTitle': 'Tienes una nota guardada',
    'card.imdbTitle': 'Ver ficha en IMDb',
    'card.watched': 'Visto',
    'card.unwatched': 'No visto',
    'card.epShort': '{watched}/{total} ep.',
    'card.markWatchedTitle': 'Marcar como visto',
    'card.markUnwatchedTitle': 'Marcar como no visto',
    'card.doomsdayTitle': 'Imprescindible para Avengers: Doomsday',
    'group.titleSingular': 'título',
    'group.titlePlural': 'títulos',
    'group.watchedCount': '{done}/{total} vistos',
    'group.phaseDone': 'Fase vista',
    'group.markPhase': 'Marcar fase',
    'group.markPhaseTitle': 'Marcar toda esta fase/era como vista',
    'group.unmarkPhaseTitle': 'Desmarcar toda esta fase/era',
    'detail.completed': 'Completado',
    'detail.pending': 'Pendiente',
    'detail.episodesProgress': '{watched}/{total} episodios ({percent}%)',
    'detail.metaLine':
      'Estreno: {date} • Orden Publicación: #{release} • Orden Cronológico: #{chrono}',
    'detail.synopsisHeading': 'Reseña y Conexión Cronológica',
    'detail.runtime': 'Duración total: {hours} h ({mins} min)',
    'detail.postCredits': 'Escenas poscréditos: {count}',
    'detail.doomsdayBadge': 'Esencial para Avengers: Doomsday',
    'detail.imdbLink': 'Ver ficha oficial en IMDb',
    'detail.comicLink': 'Ver en Marvel Cinematic Database (Cómics)',
    'detail.ratingHeading': 'Tu Valoración y Notas Personales',
    'detail.yourRating': 'Tu nota:',
    'detail.notePlaceholder': 'Escribe aquí tu opinión, por qué minuto vas o con quién la viste...',
    'detail.saveNote': 'Guardar nota',
    'detail.episodesChecklist': 'Checklist de Episodios ({watched}/{total})',
    'detail.seasonTitle': 'Temporada {num} ({year})',
    'detail.seasonCount': '{watched}/{total} episodios',
    'detail.hideReviews': 'Ocultar reseñas',
    'detail.showReviews': 'Ver reseñas',
    'detail.seasonDone': 'Temporada completada',
    'detail.markAllSeason': 'Marcar todos',
    'detail.close': 'Cerrar',
    'footer.disclaimer':
      'Proyecto fan no oficial y sin ánimo de lucro. No afiliado a The Walt Disney Company, Marvel Studios, Sony Pictures ni 20th Century Studios.',
    'footer.legalBtn': 'Aviso Legal, Privacidad y Créditos',
    'footer.contact': 'Contacto / DMCA',
    'modal.close': 'Cerrar',
    'modal.cancel': 'Cancelar',
    'pwa.title': 'Instalar como App (PWA) y Uso Offline',
    'pwa.badgeTitle': 'PWA Lista con Manifiesto, Icono y Caché Offline',
    'pwa.intro':
      'Esta aplicación incluye Web App Manifest, Service Worker real y almacenamiento persistente en LocalStorage para funcionar a pantalla completa como una app nativa.',
    'pwa.nativeReadyTitle': 'Tu navegador permite instalación directa con un clic:',
    'pwa.nativeInstallBtn': 'Instalar App Ahora',
    'pwa.howtoTitle': 'Añadir a la pantalla de inicio desde el navegador',
    'pwa.step1Title': 'En móvil (iOS Safari / Android Chrome)',
    'pwa.step1Desc':
      'Abre esta web desde un enlace HTTPS, pulsa Compartir / Menú (⋮) → Añadir a pantalla de inicio.',
    'pwa.step2Title': 'En ordenador (Chrome / Edge)',
    'pwa.step2Desc':
      'Haz clic en el icono de instalar en la barra de direcciones para abrirla como aplicación independiente.',
    'pwa.moveTitle': '¿Quieres mover tu progreso a otro dispositivo?',
    'pwa.backupNote':
      'Usa el código de sincronización o descarga una copia de seguridad en formato JSON para restaurar tu checklist en cualquier navegador.',
    'pwa.openSyncBtn': 'Abrir Exportar / Importar',
    'pwa.manualInstallToast': 'Usa el menú de tu navegador para añadir a la pantalla de inicio',
    'pwa.installedToast': '¡Aplicación instalada correctamente!',
    'sync.title': 'Exportar e Importar Progreso entre Dispositivos',
    'sync.schemaBadge': 'Esquema v{version}',
    'sync.quickCodeLabel': '1. Código Rápido (Copiar y Pegar por WhatsApp, Telegram o Notas)',
    'sync.quickCodeDesc':
      'Copia este código para llevar todo tu progreso (películas, capítulos vistos y notas) a otro móvil u ordenador sin servidor (nunca incluye tu clave privada de OMDb):',
    'sync.copyBtn': 'Copiar mi código',
    'sync.importBtn': 'Importar código pegado',
    'sync.jsonLabel': '2. Copia de Seguridad en Archivo (.JSON)',
    'sync.downloadJson': 'Descargar archivo .JSON',
    'sync.uploadJson': 'Subir archivo .JSON',
    'imageApi.title': 'Conexión de Imágenes: IMDb / TVMaze / Wikipedia / Cómics',
    'imageApi.optInTitle': 'Cargar portadas y fotogramas desde APIs externas (Opcional)',
    'imageApi.optInDesc':
      'Por defecto está desactivado para proteger tu privacidad: la app usa pósters estilizados propios sin conectarse a ningún servidor externo.',
    'imageApi.enabled': 'Activado',
    'imageApi.disabled': 'Desactivado',
    'imageApi.privacyNotice':
      'Si activas esta opción, tu navegador realizará peticiones directas a TVMaze, Wikipedia / Wikimedia y Open Library (y a OMDb si añades tu clave), lo que implica que esos servicios recibirán tu dirección IP conforme a sus políticas de privacidad.',
    'imageApi.omdbLabel': 'Opcional: Clave gratuita de OMDb API (Datos directos de IMDb)',
    'imageApi.omdbDesc':
      'Solo se utiliza si activas la carga de portadas externas arriba. Se guarda localmente en este navegador y nunca se incluye en tus códigos de sincronización ni copias JSON.',
    'imageApi.omdbPlaceholder': 'Ej: a1b2c3d4 (Opcional)',
    'imageApi.omdbSaveBtn': 'Guardar y Recargar',
    'reset.title': '¿Reiniciar todo el progreso?',
    'reset.desc':
      'Se desmarcarán todas las películas, temporadas, episodios y notas guardadas. Tu fecha objetivo y tu clave OMDb se conservarán. Te recomendamos exportar antes una copia en JSON si quieres conservar tu estado actual.',
    'reset.confirmBtn': 'Sí, reiniciar todo',
    'legal.title': 'Aviso Legal, Privacidad y Créditos',
    'legal.s1Title': '1. Propiedad Intelectual, No Afiliación y Retirada (DMCA)',
    'legal.s1p1':
      'Esta web es un proyecto personal, fan, no oficial y estrictamente sin ánimo de lucro (sin publicidad, afiliados ni monetización). No está afiliada, patrocinada, autorizada ni relacionada oficialmente con The Walt Disney Company, Marvel Characters, Inc., Marvel Studios, Sony Pictures Entertainment ni 20th Century Studios.',
    'legal.s1p2':
      'Todos los personajes, nombres, títulos, marcas registradas, pósters y fotogramas pertenecen a sus respectivos titulares de derechos. Esta aplicación no aloja ni distribuye películas, series ni cómics; únicamente proporciona un listado informativo y una herramienta de seguimiento personal.',
    'legal.s1p3':
      'Si eres titular de derechos y consideras que algún contenido debe retirarse, escribe a',
    'legal.s1p3End': 'y se retirará de forma inmediata.',
    'legal.s2Title': '2. Privacidad y Almacenamiento Local (RGPD / LSSI-CE)',
    'legal.s2p1':
      'Esta web no utiliza cookies de seguimiento ni herramientas de analítica y no recopila ni envía tus datos personales a ningún servidor propio.',
    'legal.s2p2':
      'Para recordar tu progreso y ajustes de forma local en tu dispositivo se utiliza exclusivamente almacenamiento técnico en localStorage (exento de banner de consentimiento conforme al art. 22.2 de la LSSI-CE):',
    'legal.s2li1': 'títulos y episodios marcados, valoraciones, notas personales y fecha objetivo.',
    'legal.s2li2': 'preferencia opcional (opt-in) sobre la carga de portadas desde APIs externas.',
    'legal.s2li3': 'clave personal opcional de OMDb API (nunca se incluye al exportar progreso).',
    'legal.s2li4': 'preferencia de idioma de la interfaz (es / en).',
    'legal.s2p3':
      'Puedes borrar estos datos en cualquier momento desde el botón Reiniciar o desde la configuración de tu navegador. Por defecto la aplicación realiza cero peticiones a servidores externos; únicamente si activas manualmente la carga opcional de portadas en Portadas IMDb / TV, tu navegador consultará a TVMaze, Wikipedia, Open Library (y OMDb si añades tu clave), compartiendo tu dirección IP con dichos terceros conforme a sus respectivas políticas de privacidad.',
    'legal.s2p4':
      'El alojamiento estático y la protección de red/DDoS de esta web se prestan a través de Cloudflare, que puede procesar la dirección IP del visitante a nivel técnico de infraestructura conforme a su propia política de privacidad.',
    'legal.s3Title': '3. Créditos y Licencias de Terceros',
    'legal.s4Title': '4. Aviso Legal y Limitación de Responsabilidad',
    'legal.s4p1': 'Responsable: Cesar D. — Contacto:',
    'legal.s4p2':
      'Esta herramienta se ofrece «tal cual» (as-is), sin garantía de disponibilidad ininterrumpida ni exactitud absoluta de fechas de estreno futuras. El responsable no se hace cargo de la pérdida del progreso guardado localmente si borras la caché o cambias de dispositivo; se recomienda utilizar periódicamente la exportación en archivo .JSON.',
    'toast.saved': 'Guardado',
    'toast.quotaError': 'No se pudo guardar en el navegador (cuota llena o modo privado)',
    'toast.markedWatched': 'Marcado como visto: {title}',
    'toast.markedUnwatched': 'Marcado como pendiente: {title}',
    'toast.seasonWatched': 'Temporada {num} marcada como vista',
    'toast.seasonUnwatched': 'Temporada {num} desmarcada',
    'toast.ratingSaved': 'Valoración guardada: {stars}/5 estrellas',
    'toast.noteSaved': 'Nota personal guardada',
    'toast.blockWatched': 'Bloque marcado como visto ({count} títulos)',
    'toast.blockUnwatched': 'Bloque desmarcado ({count} títulos)',
    'toast.visibleMarked': '{count} títulos visibles marcados como vistos',
    'toast.resetDone': 'Progreso reiniciado',
    'toast.codeCopied': 'Código de sincronización copiado al portapapeles',
    'toast.codeCopyFallback': 'No se pudo copiar automáticamente; cópialo manualmente',
    'toast.pasteValidCode': 'Pega primero un código válido',
    'toast.invalidCode': 'El código introducido no tiene un formato válido',
    'toast.jsonDownloaded': 'Archivo JSON descargado',
    'toast.jsonTooLarge': 'El archivo JSON supera el límite máximo permitido (512 KB)',
    'toast.invalidJson': 'El archivo JSON no es válido',
    'toast.jsonReadError': 'No se pudo leer el archivo JSON',
    'toast.importLegacy': '{source} importado (formato anterior migrado a v{current})',
    'toast.importNewerMinor': '{source} importado (esquema v{imported}, compatible con v{current})',
    'toast.importExact': '{source} importado (esquema v{imported})',
    'toast.sourceProgress': 'Progreso',
    'toast.sourceJson': 'Backup JSON',
    'toast.externalOn': 'Portadas externas activadas (TVMaze / Wikipedia / Open Library)',
    'toast.externalOff': 'Portadas externas desactivadas (solo pósters locales)',
    'toast.omdbSavedOff': 'Clave OMDb guardada. Activa las portadas externas para usarla.',
    'toast.omdbSavedOn': 'Clave OMDb (IMDb) activada y recargando portadas',
    'toast.omdbRemoved': 'Clave OMDb eliminada',
    'toast.langSwitched': 'Idioma cambiado a Español',
    'cat.movie': 'Película UCM',
    'cat.disneyPlus': 'Serie Disney+',
    'cat.netflix': 'Netflix / Defenders',
    'cat.abc': 'ABC / S.H.I.E.L.D.',
    'cat.hulu': 'Juvenil / Hulu',
    'cat.fox': 'Legado Fox',
    'cat.sony': 'Sony / Spider-Verse',
    'cat.comic': 'Cómic Canon',
    'cat.special': 'Especial / Corto',
    'saga.shortInfinity': 'Saga del Infinito',
    'saga.shortMultiverse': 'Saga del Multiverso',
    'saga.shortFoxSony': 'Multiverso Fox/Sony',
    'saga.shortMarvelTv': 'Era Marvel TV',
  },
  en: {
    'meta.title': 'MCU & Multiverse — Unofficial Watchlist',
    'header.brand': 'MCU',
    'header.title': 'MCU & Multiverse Master Checklist',
    'header.subtitle': 'Unofficial fan guide: movies, series & comics',
    'header.savedLocal': 'Saved locally',
    'header.savedLocalTitle': 'Your progress is saved automatically in this browser',
    'header.noLocalSpace': 'Storage full',
    'header.langToggleAria': 'Switch language to Spanish',
    'header.langToggleTitle': 'Cambiar a Español',
    'header.pwaInstall': 'Install App (PWA)',
    'header.pwaInstallShort': 'Install App!',
    'header.planner': 'Marathon Planner',
    'header.posters': 'IMDb / TV Posters',
    'header.sync': 'Export / Import',
    'stats.titlesWatched': '{completed} / {total} titles watched',
    'stats.episodes': '{watched} / {total} episodes',
    'stats.remainingHours': '{hours}h left',
    'planner.badge': 'Target-Date Marathon Planner',
    'planner.daysLeft': '{days} days left',
    'planner.reached': 'Target date reached!',
    'planner.heading': 'Calculate your daily & weekly pace to finish on time',
    'planner.desc':
      'Calculations automatically adapt to the remaining items in your current view (filter by Doomsday Essential Route or track the full catalog).',
    'planner.targetDate': 'Target Date',
    'planner.scope': 'Plan Scope',
    'planner.scopeFiltered': 'Current active filters',
    'planner.scopeDoomsday': 'Doomsday Essential Route only',
    'planner.scopeAll': 'Entire catalog',
    'planner.pendingTitle': 'Remaining in your plan',
    'planner.pendingItems': '{titles} titles ({units} items)',
    'planner.dailyPace': 'Required Daily Pace',
    'planner.dailyUnit': '{mins} min / day',
    'planner.dailyEps': '~{eps} ep./movies per day',
    'planner.weeklyPace': 'Weekly Pace',
    'planner.weeklyUnit': '{hours} h / week',
    'planner.weeklyTitles': '~{titles} titles/wk',
    'planner.nextRecommended': 'Up Next',
    'planner.allDone': 'All caught up!',
    'planner.upToDate': '100% up to date',
    'filters.searchPlaceholder': 'Search movie, series, character, year...',
    'filters.searchAria': 'Search catalog',
    'filters.clearSearchAria': 'Clear search',
    'filters.button': 'Filters',
    'filters.orderRelease': '1. Release',
    'filters.orderChrono': '2. Chronological',
    'filters.doomsday': 'Doomsday Essential Route',
    'filters.catAll': 'All',
    'filters.catMovie': 'MCU Movies',
    'filters.catDisneyPlus': 'Disney+ Series',
    'filters.catNetflix': 'Netflix (Defenders)',
    'filters.catAbc': 'ABC (S.H.I.E.L.D. / Carter)',
    'filters.catHulu': 'YA / Hulu (Runaways / C&D)',
    'filters.catFox': 'Fox (X-Men / F4 / Deadpool)',
    'filters.catSony': 'Sony & Spider-Verse',
    'filters.catComic': 'Canon Comics',
    'filters.catSpecial': 'Specials',
    'filters.phaseAll': 'All Phases / Eras',
    'filters.phase1': 'Phase 1 (2008-2012)',
    'filters.phase2': 'Phase 2 (2013-2015)',
    'filters.phase3': 'Phase 3 (2016-2019)',
    'filters.phase4': 'Phase 4 (2021-2022)',
    'filters.phase5': 'Phase 5 (2023-2025)',
    'filters.phase6': 'Phase 6 (2025-2027)',
    'filters.phaseFoxSony': 'Fox & Sony Multiverse Era',
    'filters.phaseMarvelTv': 'ABC, Netflix & Hulu Era',
    'filters.statusAll': 'All statuses',
    'filters.statusPending': 'Unwatched',
    'filters.statusInProgress': 'In progress (Seasons)',
    'filters.statusCompleted': 'Completed',
    'toolbar.resultsCount': 'Showing {shown} of {total} titles & seasons ({order})',
    'toolbar.orderReleaseLong': '1. Release Order',
    'toolbar.orderChronoLong': '2. Chronological Order (by Year)',
    'toolbar.groupLabel': 'Group:',
    'toolbar.groupInterleaved': 'Sagas, Phases & Eras (Interleaved)',
    'toolbar.groupStrict': 'Separate Official Phase / Era',
    'toolbar.groupNone': 'Ungrouped (Continuous list)',
    'toolbar.collapseBlocks': 'Collapse blocks',
    'toolbar.expandBlocks': 'Expand blocks',
    'toolbar.markVisible': 'Mark visible as watched',
    'toolbar.reset': 'Reset',
    'empty.title': 'No results found',
    'empty.desc': 'Try adjusting your filters or clearing your search query.',
    'empty.resetBtn': 'Reset filters',
    'card.release': 'Release: {year}',
    'card.postCredits': '{count} post-credits',
    'card.postCreditsTitle': 'Post-credits scenes',
    'card.episodesWatched': '{watched}/{total} episodes watched',
    'card.episodesBtn': 'Episodes',
    'card.reviewBtn': 'Overview',
    'card.hasNoteTitle': 'You have a saved note',
    'card.imdbTitle': 'View on IMDb',
    'card.watched': 'Watched',
    'card.unwatched': 'Unwatched',
    'card.epShort': '{watched}/{total} ep.',
    'card.markWatchedTitle': 'Mark as watched',
    'card.markUnwatchedTitle': 'Mark as unwatched',
    'card.doomsdayTitle': 'Essential for Avengers: Doomsday',
    'group.titleSingular': 'title',
    'group.titlePlural': 'titles',
    'group.watchedCount': '{done}/{total} watched',
    'group.phaseDone': 'Phase watched',
    'group.markPhase': 'Mark phase',
    'group.markPhaseTitle': 'Mark this entire phase/era as watched',
    'group.unmarkPhaseTitle': 'Unmark this entire phase/era',
    'detail.completed': 'Completed',
    'detail.pending': 'Unwatched',
    'detail.episodesProgress': '{watched}/{total} episodes ({percent}%)',
    'detail.metaLine':
      'Release: {date} • Release Order: #{release} • Chronological Order: #{chrono}',
    'detail.synopsisHeading': 'Overview & Timeline Connection',
    'detail.runtime': 'Total runtime: {hours} h ({mins} min)',
    'detail.postCredits': 'Post-credits scenes: {count}',
    'detail.doomsdayBadge': 'Essential for Avengers: Doomsday',
    'detail.imdbLink': 'View official IMDb page',
    'detail.comicLink': 'View on Marvel Cinematic Database (Comics)',
    'detail.ratingHeading': 'Your Rating & Personal Notes',
    'detail.yourRating': 'Your rating:',
    'detail.notePlaceholder':
      'Write your thoughts, where you paused, or who you watched it with...',
    'detail.saveNote': 'Save note',
    'detail.episodesChecklist': 'Episode Checklist ({watched}/{total})',
    'detail.seasonTitle': 'Season {num} ({year})',
    'detail.seasonCount': '{watched}/{total} episodes',
    'detail.hideReviews': 'Hide reviews',
    'detail.showReviews': 'Show reviews',
    'detail.seasonDone': 'Season completed',
    'detail.markAllSeason': 'Mark all',
    'detail.close': 'Close',
    'footer.disclaimer':
      'Unofficial, non-profit fan project. Not affiliated with The Walt Disney Company, Marvel Studios, Sony Pictures, or 20th Century Studios.',
    'footer.legalBtn': 'Legal Notice, Privacy & Credits',
    'footer.contact': 'Contact / DMCA',
    'modal.close': 'Close',
    'modal.cancel': 'Cancel',
    'pwa.title': 'Install as App (PWA) & Offline Usage',
    'pwa.badgeTitle': 'PWA Ready with Manifest, Icon & Offline Cache',
    'pwa.intro':
      'This app includes a Web App Manifest, a real Service Worker, and persistent LocalStorage so it works full-screen like a native app.',
    'pwa.nativeReadyTitle': 'Your browser supports one-click direct installation:',
    'pwa.nativeInstallBtn': 'Install App Now',
    'pwa.howtoTitle': 'Add to home screen from your browser',
    'pwa.step1Title': 'On mobile (iOS Safari / Android Chrome)',
    'pwa.step1Desc': 'Open this site over HTTPS, tap Share / Menu (⋮) → Add to Home Screen.',
    'pwa.step2Title': 'On desktop (Chrome / Edge)',
    'pwa.step2Desc': 'Click the install icon in the address bar to launch it as a standalone app.',
    'pwa.moveTitle': 'Want to move your progress to another device?',
    'pwa.backupNote':
      'Use the sync code or download a .JSON backup file to restore your checklist in any browser.',
    'pwa.openSyncBtn': 'Open Export / Import',
    'pwa.manualInstallToast': 'Use your browser menu to add this app to your home screen',
    'pwa.installedToast': 'App installed successfully!',
    'sync.title': 'Export & Import Progress Across Devices',
    'sync.schemaBadge': 'Schema v{version}',
    'sync.quickCodeLabel': '1. Quick Code (Copy & Paste via WhatsApp, Telegram, or Notes)',
    'sync.quickCodeDesc':
      'Copy this code to transfer all your progress (movies, watched episodes, and notes) to another phone or computer without a server (never includes your private OMDb key):',
    'sync.copyBtn': 'Copy my code',
    'sync.importBtn': 'Import pasted code',
    'sync.jsonLabel': '2. File Backup (.JSON)',
    'sync.downloadJson': 'Download .JSON file',
    'sync.uploadJson': 'Upload .JSON file',
    'imageApi.title': 'Artwork Sources: IMDb / TVMaze / Wikipedia / Comics',
    'imageApi.optInTitle': 'Load posters & episode stills from external APIs (Optional)',
    'imageApi.optInDesc':
      'Disabled by default to protect your privacy: the app renders stylized local posters without connecting to any external server.',
    'imageApi.enabled': 'Enabled',
    'imageApi.disabled': 'Disabled',
    'imageApi.privacyNotice':
      'If enabled, your browser will send direct requests to TVMaze, Wikipedia / Wikimedia, and Open Library (plus OMDb if you add your key), sharing your IP address with those providers under their respective privacy policies.',
    'imageApi.omdbLabel': 'Optional: Free OMDb API Key (Direct IMDb artwork)',
    'imageApi.omdbDesc':
      'Only used when external artwork loading is enabled above. Stored locally in this browser and never included in sync codes or JSON backups.',
    'imageApi.omdbPlaceholder': 'e.g. a1b2c3d4 (Optional)',
    'imageApi.omdbSaveBtn': 'Save & Reload',
    'reset.title': 'Reset all progress?',
    'reset.desc':
      'All watched movies, seasons, episodes, and personal notes will be cleared. Your target date and OMDb key will be preserved. We recommend exporting a JSON backup first.',
    'reset.confirmBtn': 'Yes, reset everything',
    'legal.title': 'Legal Notice, Privacy & Credits',
    'legal.s1Title': '1. Intellectual Property, Non-Affiliation & Takedown (DMCA)',
    'legal.s1p1':
      'This website is a personal, unofficial, strictly non-profit fan project (no ads, affiliates, or monetization). It is not affiliated with, sponsored, authorized, or officially connected to The Walt Disney Company, Marvel Characters, Inc., Marvel Studios, Sony Pictures Entertainment, or 20th Century Studios.',
    'legal.s1p2':
      'All characters, names, titles, trademarks, posters, and stills belong to their respective rights holders. This application does not host or distribute movies, TV shows, or comics; it only provides an informational checklist and personal tracking tool.',
    'legal.s1p3': 'If you are a rights holder and believe any content should be removed, email',
    'legal.s1p3End': 'and it will be removed immediately.',
    'legal.s2Title': '2. Privacy & Local Storage (GDPR / LSSI-CE)',
    'legal.s2p1':
      'This website uses no tracking cookies or analytics tools and does not collect or send your personal data to any server of our own.',
    'legal.s2p2':
      'To remember your progress and settings locally on your device, it uses strictly technical localStorage keys (exempt from cookie consent banners):',
    'legal.s2li1': 'watched titles and episodes, ratings, personal notes, and target date.',
    'legal.s2li2': 'optional opt-in preference for loading artwork from external APIs.',
    'legal.s2li3': 'optional personal OMDb API key (never included when exporting progress).',
    'legal.s2li4': 'interface language preference (es / en).',
    'legal.s2p3':
      'You can delete this data anytime via the Reset button or your browser settings. By default the app makes zero external server requests; only if you manually enable external artwork under IMDb / TV Posters will your browser query TVMaze, Wikipedia, Open Library (and OMDb if you add your key), sharing your IP address under their privacy policies.',
    'legal.s2p4':
      'Static hosting and network/DDoS protection are provided by Cloudflare, which may process visitor IP addresses at the infrastructure level under its own privacy policy.',
    'legal.s3Title': '3. Third-Party Credits & Licenses',
    'legal.s4Title': '4. Legal Notice & Limitation of Liability',
    'legal.s4p1': 'Maintainer: Cesar D. — Contact:',
    'legal.s4p2':
      'This tool is provided "as-is", with no warranty of uninterrupted availability or absolute accuracy of future release dates. The maintainer is not responsible for lost local progress if you clear browser storage or switch devices; periodic .JSON export is recommended.',
    'toast.saved': 'Saved',
    'toast.quotaError': 'Could not save to browser storage (quota full or private mode)',
    'toast.markedWatched': 'Marked as watched: {title}',
    'toast.markedUnwatched': 'Marked as unwatched: {title}',
    'toast.seasonWatched': 'Season {num} marked as watched',
    'toast.seasonUnwatched': 'Season {num} unmarked',
    'toast.ratingSaved': 'Rating saved: {stars}/5 stars',
    'toast.noteSaved': 'Personal note saved',
    'toast.blockWatched': 'Block marked as watched ({count} titles)',
    'toast.blockUnwatched': 'Block unmarked ({count} titles)',
    'toast.visibleMarked': '{count} visible titles marked as watched',
    'toast.resetDone': 'Progress reset',
    'toast.codeCopied': 'Sync code copied to clipboard',
    'toast.codeCopyFallback': 'Could not copy automatically; please copy manually',
    'toast.pasteValidCode': 'Paste a valid code first',
    'toast.invalidCode': 'The entered code is not in a valid format',
    'toast.jsonDownloaded': 'JSON backup downloaded',
    'toast.jsonTooLarge': 'JSON file exceeds the maximum allowed size (512 KB)',
    'toast.invalidJson': 'The JSON file is not valid',
    'toast.jsonReadError': 'Could not read the JSON file',
    'toast.importLegacy': '{source} imported (legacy format migrated to v{current})',
    'toast.importNewerMinor': '{source} imported (schema v{imported}, compatible with v{current})',
    'toast.importExact': '{source} imported (schema v{imported})',
    'toast.sourceProgress': 'Progress',
    'toast.sourceJson': 'JSON backup',
    'toast.externalOn': 'External artwork enabled (TVMaze / Wikipedia / Open Library)',
    'toast.externalOff': 'External artwork disabled (local posters only)',
    'toast.omdbSavedOff': 'OMDb key saved. Enable external artwork above to use it.',
    'toast.omdbSavedOn': 'OMDb (IMDb) key enabled and reloading posters',
    'toast.omdbRemoved': 'OMDb key removed',
    'toast.langSwitched': 'Language switched to English',
    'cat.movie': 'MCU Movie',
    'cat.disneyPlus': 'Disney+ Series',
    'cat.netflix': 'Netflix / Defenders',
    'cat.abc': 'ABC / S.H.I.E.L.D.',
    'cat.hulu': 'YA / Hulu',
    'cat.fox': 'Fox Legacy',
    'cat.sony': 'Sony / Spider-Verse',
    'cat.comic': 'Canon Comic',
    'cat.special': 'Special / Short',
    'saga.shortInfinity': 'The Infinity Saga',
    'saga.shortMultiverse': 'The Multiverse Saga',
    'saga.shortFoxSony': 'Fox/Sony Multiverse',
    'saga.shortMarvelTv': 'Marvel TV Era',
  },
};

const PHASE_EN_MAP = {
  'Fase 1': 'Phase 1',
  'Fase 2': 'Phase 2',
  'Fase 3': 'Phase 3',
  'Fase 4': 'Phase 4',
  'Fase 5': 'Phase 5',
  'Fase 6': 'Phase 6',
  'Era Multiversal Fox/Sony': 'Fox/Sony Multiverse Era',
  'Era Marvel Television': 'Marvel Television Era',
};

/**
 * @param {LangStorageLike} [storage]
 * @param {string} [navLang]
 * @returns {'es' | 'en'}
 */
export function detectInitialLang(
  storage = globalThis.localStorage,
  navLang = typeof navigator !== 'undefined' ? navigator.language : 'es',
) {
  try {
    const saved = storage?.getItem?.(LANG_STORAGE_KEY);
    if (saved === 'es' || saved === 'en') return saved;
  } catch {
    // Ignore storage access errors
  }
  if (typeof navLang === 'string' && navLang.toLowerCase().startsWith('en')) {
    return 'en';
  }
  return 'es';
}

/** @returns {'es' | 'en'} */
export function getLang() {
  return currentLang === 'en' ? 'en' : 'es';
}

/**
 * @param {string} lang
 * @param {LangStorageLike} [storage]
 * @returns {'es' | 'en'}
 */
export function setLang(lang, storage = globalThis.localStorage) {
  const next = lang === 'en' ? 'en' : 'es';
  currentLang = next;
  try {
    storage?.setItem?.(LANG_STORAGE_KEY, next);
  } catch {
    // Ignore storage access errors
  }
  return next;
}

/**
 * @param {string} key
 * @param {Record<string, string | number>} [vars]
 * @param {'es' | 'en'} [lang]
 */
export function t(key, vars = undefined, lang = getLang()) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.es;
  let str = dict[key] ?? TRANSLATIONS.es[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
}

/** @param {string} phase @param {'es' | 'en'} [lang] */
export function getLocalizedPhase(phase, lang = getLang()) {
  if (lang === 'en' && Object.prototype.hasOwnProperty.call(PHASE_EN_MAP, phase)) {
    return PHASE_EN_MAP[phase];
  }
  return phase;
}

/** @param {'es' | 'en'} [lang] */
export async function loadCatalogTranslations(lang = getLang()) {
  if (lang !== 'en') return null;
  if (!catalogEnMap) {
    catalogEnMap = (await import('./data/catalogEn.js')).CATALOG_EN;
  }
  return catalogEnMap;
}

/** @param {{ id: string, synopsis: string }} item @param {'es' | 'en'} [lang] */
export function getLocalizedItemSynopsis(item, lang = getLang()) {
  if (lang === 'en' && catalogEnMap && catalogEnMap[item.id]?.synopsis) {
    return catalogEnMap[item.id].synopsis;
  }
  return item.synopsis;
}

/** @param {{ id: string }} item @param {{ seasonNumber: number, note?: string }} season @param {'es' | 'en'} [lang] */
export function getLocalizedSeasonNote(item, season, lang = getLang()) {
  if (lang === 'en' && catalogEnMap && catalogEnMap[item.id]?.seasonNotes?.[season.seasonNumber]) {
    return catalogEnMap[item.id].seasonNotes[season.seasonNumber];
  }
  return season.note || '';
}

/** @param {Document} [doc] */
export function applyStaticTranslations(
  doc = typeof document !== 'undefined' ? document : undefined,
) {
  if (!doc) return;
  const lang = getLang();
  doc.documentElement.lang = lang;
  doc.title = t('meta.title', undefined, lang);

  doc.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key, undefined, lang);
  });

  doc.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.setAttribute('placeholder', t(key, undefined, lang));
  });

  doc.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) el.setAttribute('aria-label', t(key, undefined, lang));
  });

  doc.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.setAttribute('title', t(key, undefined, lang));
  });

  const langBtn = doc.getElementById('btnToggleLang');
  if (langBtn) {
    langBtn.setAttribute('aria-label', t('header.langToggleAria', undefined, lang));
    langBtn.setAttribute('title', t('header.langToggleTitle', undefined, lang));
  }
  const esPill = doc.getElementById('langPillEs');
  const enPill = doc.getElementById('langPillEn');
  if (esPill && enPill) {
    esPill.className = lang === 'es' ? 'text-white font-bold' : 'text-gray-500';
    enPill.className = lang === 'en' ? 'text-white font-bold' : 'text-gray-500';
  }
}
