const loadedBuckets = new Map();

const BUCKET_LOADERS = {
  es: {
    dplus: async () => (await import('./disneyPlus.js')).DISNEY_PLUS_EPISODE_SYNOPSES,
    netflix: async () => (await import('./netflix.js')).NETFLIX_EPISODE_SYNOPSES,
    abc: async () => (await import('./abc.js')).ABC_EPISODE_SYNOPSES,
    ya: async () => (await import('./hulu.js')).HULU_EPISODE_SYNOPSES,
  },
  en: {
    dplus: async () => (await import('./en/disneyPlus.js')).DISNEY_PLUS_EPISODE_SYNOPSES_EN,
    netflix: async () => (await import('./en/netflix.js')).NETFLIX_EPISODE_SYNOPSES_EN,
    abc: async () => (await import('./en/abc.js')).ABC_EPISODE_SYNOPSES_EN,
    ya: async () => (await import('./en/hulu.js')).HULU_EPISODE_SYNOPSES_EN,
  },
};

function normalizeLang(lang) {
  return lang === 'en' ? 'en' : 'es';
}

function getBucketKey(itemId) {
  if (typeof itemId !== 'string') return null;
  const prefix = itemId.split('_')[0];
  return Object.prototype.hasOwnProperty.call(BUCKET_LOADERS.es, prefix) ? prefix : null;
}

export async function loadEpisodeSynopsesForItem(itemId, lang = 'es') {
  const safeLang = normalizeLang(lang);
  const bucketKey = getBucketKey(itemId);
  if (!bucketKey) return null;
  const cacheKey = `${safeLang}:${bucketKey}`;
  if (loadedBuckets.has(cacheKey)) {
    return loadedBuckets.get(cacheKey)[itemId] || null;
  }
  const bucketData = await BUCKET_LOADERS[safeLang][bucketKey]();
  loadedBuckets.set(cacheKey, bucketData);
  return bucketData[itemId] || null;
}

export async function loadAllEpisodeSynopses(lang = 'es') {
  const safeLang = normalizeLang(lang);
  const loaders = BUCKET_LOADERS[safeLang];
  await Promise.all(
    Object.keys(loaders).map(async (key) => {
      const cacheKey = `${safeLang}:${key}`;
      if (!loadedBuckets.has(cacheKey)) {
        const data = await loaders[key]();
        loadedBuckets.set(cacheKey, data);
      }
    }),
  );
}

export function getEpisodeSynopsis(itemId, epCode, lang = 'es') {
  const safeLang = normalizeLang(lang);
  const bucketKey = getBucketKey(itemId);
  if (!bucketKey) return '';
  const bucket = loadedBuckets.get(`${safeLang}:${bucketKey}`);
  if (bucket && bucket[itemId] && bucket[itemId][epCode]) {
    return bucket[itemId][epCode];
  }
  if (safeLang !== 'es') {
    const esBucket = loadedBuckets.get(`es:${bucketKey}`);
    if (esBucket && esBucket[itemId] && esBucket[itemId][epCode]) {
      return esBucket[itemId][epCode];
    }
  }
  return '';
}
