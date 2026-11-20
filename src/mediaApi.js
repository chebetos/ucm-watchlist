import { sanitizeImageUrl } from './utils.js';

export function createMediaApi({
  fetchFn = globalThis.fetch?.bind(globalThis),
  onPosterResolved = null,
  externalMediaEnabled: initialExternalMediaEnabled = false,
} = {}) {
  const imageCache = new Map(); // itemId -> httpsUrl
  const tvShowDataCache = new Map(); // tvShowQuery -> tvmazeResponse
  const episodeMetaCache = new Map(); // itemId -> { "S1E1": { image, title, runtime, airdate } }

  const inFlightPosterRequests = new Map();
  const inFlightTvShowRequests = new Map();

  let customOmdbKey = '';
  let externalMediaEnabled = Boolean(initialExternalMediaEnabled);
  let posterObserver = null;

  function setExternalMediaEnabled(enabled) {
    externalMediaEnabled = Boolean(enabled);
    if (!externalMediaEnabled) {
      disconnectObserver();
      imageCache.clear();
      episodeMetaCache.clear();
      inFlightPosterRequests.clear();
    }
  }

  function isExternalMediaEnabled() {
    return externalMediaEnabled;
  }

  function setOmdbApiKey(key) {
    customOmdbKey = String(key ?? '').trim();
    imageCache.clear();
    inFlightPosterRequests.clear();
  }

  function getOmdbApiKey() {
    return customOmdbKey;
  }

  function getCachedPoster(itemId) {
    return imageCache.get(itemId) || '';
  }

  function getEpisodeMeta(itemId) {
    return episodeMetaCache.get(itemId) || {};
  }

  function hasEpisodeMeta(itemId) {
    return episodeMetaCache.has(itemId);
  }

  function populateEpisodeMeta(itemId, tvData) {
    if (!tvData?._embedded?.episodes) return;
    const epMap = episodeMetaCache.get(itemId) || {};
    for (const ep of tvData._embedded.episodes) {
      const code = `S${ep.season}E${ep.number}`;
      const rawImg = ep.image ? ep.image.medium || ep.image.original : null;
      epMap[code] = {
        image: sanitizeImageUrl(rawImg),
        title: typeof ep.name === 'string' ? ep.name : null,
        runtime: ep.runtime || null,
        airdate: typeof ep.airdate === 'string' ? ep.airdate : null,
      };
    }
    episodeMetaCache.set(itemId, epMap);
  }

  async function fetchTvMazeShow(queryName) {
    if (!queryName || !fetchFn) return null;
    if (tvShowDataCache.has(queryName)) return tvShowDataCache.get(queryName);
    if (inFlightTvShowRequests.has(queryName)) return inFlightTvShowRequests.get(queryName);

    const promise = (async () => {
      try {
        const url = `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(queryName)}&embed[]=episodes&embed[]=seasons`;
        const res = await fetchFn(url);
        if (res && res.ok) {
          const data = await res.json();
          tvShowDataCache.set(queryName, data);
          return data;
        }
      } catch {
        // Error de red ignorado con fallback visual
      } finally {
        inFlightTvShowRequests.delete(queryName);
      }
      return null;
    })();

    inFlightTvShowRequests.set(queryName, promise);
    return promise;
  }

  /**
   * Obtiene los metadatos y fotogramas de episodios desde TVMaze de forma
   * desacoplada de fetchPosterForItem (funciona incluso con clave OMDb activa).
   */
  async function fetchEpisodeMetaForItem(item) {
    if (!externalMediaEnabled || !item?.tvShowQuery) return {};
    if (episodeMetaCache.has(item.id)) return episodeMetaCache.get(item.id);
    const tvData = await fetchTvMazeShow(item.tvShowQuery);
    if (tvData) {
      populateEpisodeMeta(item.id, tvData);
    }
    return episodeMetaCache.get(item.id) || {};
  }

  async function resolvePoster(item) {
    if (!fetchFn) return null;

    // 1. OMDb API (si el usuario configuró clave)
    if (customOmdbKey && item.imdbId) {
      try {
        const url = `https://www.omdbapi.com/?i=${encodeURIComponent(item.imdbId)}&apikey=${encodeURIComponent(customOmdbKey)}`;
        const res = await fetchFn(url);
        if (res && res.ok) {
          const data = await res.json();
          if (data && data.Poster && data.Poster !== 'N/A') {
            const safeUrl = sanitizeImageUrl(data.Poster);
            if (safeUrl) {
              imageCache.set(item.id, safeUrl);
              onPosterResolved?.(item.id, safeUrl);
              return safeUrl;
            }
          }
        }
      } catch {
        // Fallback al siguiente proveedor
      }
    }

    // 2. TVMaze API para series (póster de temporada + metadatos de episodios)
    if (item.tvShowQuery) {
      const tvData = await fetchTvMazeShow(item.tvShowQuery);
      if (tvData) {
        populateEpisodeMeta(item.id, tvData);
        let rawPoster = null;
        if (item.seasonNum && tvData._embedded?.seasons) {
          const matchedSeason = tvData._embedded.seasons.find((s) => s.number === item.seasonNum);
          if (matchedSeason?.image) {
            rawPoster = matchedSeason.image.medium || matchedSeason.image.original;
          }
        }
        if (!rawPoster && tvData.image) {
          rawPoster = tvData.image.medium || tvData.image.original;
        }
        const safeUrl = sanitizeImageUrl(rawPoster);
        if (safeUrl) {
          imageCache.set(item.id, safeUrl);
          onPosterResolved?.(item.id, safeUrl);
          return safeUrl;
        }
      }
    }

    // 3. OpenLibrary Covers para cómics con ISBN (verifica disponibilidad antes de caer a Wikipedia)
    if (item.comicIsbn) {
      const olUrl = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(item.comicIsbn)}-M.jpg?default=false`;
      try {
        const headRes = await fetchFn(olUrl, { method: 'HEAD' });
        if (headRes && headRes.ok) {
          imageCache.set(item.id, olUrl);
          onPosterResolved?.(item.id, olUrl);
          return olUrl;
        }
      } catch {
        // Si falla HEAD/CORS, probar Wikipedia
      }
    }

    // 4. Wikipedia REST API (películas, especiales y fallback de cómics)
    if (item.wiki) {
      try {
        const res = await fetchFn(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.wiki)}`,
        );
        if (res && res.ok) {
          const data = await res.json();
          const safeUrl = sanitizeImageUrl(data?.thumbnail?.source);
          if (safeUrl) {
            imageCache.set(item.id, safeUrl);
            onPosterResolved?.(item.id, safeUrl);
            return safeUrl;
          }
        }
      } catch {
        // Fallback visual del póster estilizado
      }
    }

    return null;
  }

  async function fetchPosterForItem(item) {
    if (!externalMediaEnabled || !item?.id) return null;
    if (imageCache.has(item.id)) return imageCache.get(item.id);
    if (inFlightPosterRequests.has(item.id)) return inFlightPosterRequests.get(item.id);

    const promise = resolvePoster(item).finally(() => {
      inFlightPosterRequests.delete(item.id);
    });
    inFlightPosterRequests.set(item.id, promise);
    return promise;
  }

  function disconnectObserver() {
    if (posterObserver) {
      posterObserver.disconnect();
      posterObserver = null;
    }
  }

  function observeVisiblePosters(container, itemsById) {
    disconnectObserver();
    if (!externalMediaEnabled || !container || typeof document === 'undefined') return;

    const images = container.querySelectorAll('img[data-poster-id]');
    if (images.length === 0) return;

    if (typeof IntersectionObserver === 'undefined') {
      images.forEach((img) => {
        const id = img.getAttribute('data-poster-id');
        const item = itemsById.get(id);
        if (item) fetchPosterForItem(item);
      });
      return;
    }

    posterObserver = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const img = entry.target;
          observer.unobserve(img);
          const id = img.getAttribute('data-poster-id');
          if (!id) continue;
          const cached = imageCache.get(id);
          if (cached) {
            onPosterResolved?.(id, cached);
          } else {
            const item = itemsById.get(id);
            if (item) fetchPosterForItem(item);
          }
        }
      },
      { rootMargin: '200px 0px' },
    );

    images.forEach((img) => {
      // No observar imágenes dentro de bloques plegados (.hidden)
      if (img.closest('.hidden')) return;
      const id = img.getAttribute('data-poster-id');
      const cached = id ? imageCache.get(id) : null;
      if (cached) {
        onPosterResolved?.(id, cached);
      } else {
        posterObserver.observe(img);
      }
    });
  }

  return {
    setExternalMediaEnabled,
    isExternalMediaEnabled,
    setOmdbApiKey,
    getOmdbApiKey,
    getCachedPoster,
    getEpisodeMeta,
    hasEpisodeMeta,
    fetchTvMazeShow,
    fetchEpisodeMetaForItem,
    fetchPosterForItem,
    observeVisiblePosters,
    disconnectObserver,
  };
}
