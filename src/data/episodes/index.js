const loadedBuckets = new Map();

const BUCKET_LOADERS = {
  dplus: async () => (await import('./disneyPlus.js')).DISNEY_PLUS_EPISODE_SYNOPSES,
  netflix: async () => (await import('./netflix.js')).NETFLIX_EPISODE_SYNOPSES,
  abc: async () => (await import('./abc.js')).ABC_EPISODE_SYNOPSES,
  ya: async () => (await import('./hulu.js')).HULU_EPISODE_SYNOPSES,
};

function getBucketKey(itemId) {
  if (typeof itemId !== 'string') return null;
  const prefix = itemId.split('_')[0];
  return Object.prototype.hasOwnProperty.call(BUCKET_LOADERS, prefix) ? prefix : null;
}

export async function loadEpisodeSynopsesForItem(itemId) {
  const bucketKey = getBucketKey(itemId);
  if (!bucketKey) return null;
  if (loadedBuckets.has(bucketKey)) {
    return loadedBuckets.get(bucketKey)[itemId] || null;
  }
  const bucketData = await BUCKET_LOADERS[bucketKey]();
  loadedBuckets.set(bucketKey, bucketData);
  return bucketData[itemId] || null;
}

export async function loadAllEpisodeSynopses() {
  await Promise.all(
    Object.keys(BUCKET_LOADERS).map(async (key) => {
      if (!loadedBuckets.has(key)) {
        const data = await BUCKET_LOADERS[key]();
        loadedBuckets.set(key, data);
      }
    }),
  );
}

export function getEpisodeSynopsis(itemId, epCode) {
  const bucketKey = getBucketKey(itemId);
  if (!bucketKey) return '';
  const bucket = loadedBuckets.get(bucketKey);
  if (!bucket || !bucket[itemId]) return '';
  return bucket[itemId][epCode] || '';
}
