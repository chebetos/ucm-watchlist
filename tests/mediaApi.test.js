import { describe, expect, test } from 'bun:test';
import { createMediaApi } from '../src/mediaApi.js';

describe('createMediaApi', () => {
  test('codifica omdbApiKey con encodeURIComponent y desacopla TVMaze para episodios', async () => {
    const requestedUrls = [];
    const mockFetch = async (url) => {
      requestedUrls.push(url);
      if (url.startsWith('https://www.omdbapi.com/')) {
        return {
          ok: true,
          json: async () => ({ Poster: 'https://m.media-amazon.com/images/poster.jpg' }),
        };
      }
      if (url.startsWith('https://api.tvmaze.com/')) {
        return {
          ok: true,
          json: async () => ({
            image: { medium: 'https://static.tvmaze.com/show.jpg' },
            _embedded: {
              episodes: [
                {
                  season: 1,
                  number: 1,
                  name: 'Glorious Purpose',
                  airdate: '2021-06-09',
                  image: { medium: 'https://static.tvmaze.com/ep1.jpg' },
                },
              ],
            },
          }),
        };
      }
      return { ok: false };
    };

    const api = createMediaApi({ fetchFn: mockFetch });
    api.setOmdbApiKey('my key&bad=1');

    const item = {
      id: 'dplus_loki_s1',
      imdbId: 'tt9140554',
      tvShowQuery: 'Loki',
      seasonNum: 1,
    };

    const poster = await api.fetchPosterForItem(item);
    expect(poster).toBe('https://m.media-amazon.com/images/poster.jpg');
    expect(requestedUrls[0]).toContain('apikey=my%20key%26bad%3D1');

    // Aunque OMDb devolvió el póster, fetchEpisodeMetaForItem obtiene episodios de TVMaze
    const epMeta = await api.fetchEpisodeMetaForItem(item);
    expect(epMeta.S1E1.title).toBe('Glorious Purpose');
    expect(epMeta.S1E1.image).toBe('https://static.tvmaze.com/ep1.jpg');
  });

  test('no sobrescribe la portada de OpenLibrary con Wikipedia cuando OpenLibrary responde OK', async () => {
    const requestedUrls = [];
    const mockFetch = async (url, opts) => {
      requestedUrls.push({ url, method: opts?.method || 'GET' });
      if (url.startsWith('https://covers.openlibrary.org/')) {
        return { ok: true };
      }
      if (url.startsWith('https://en.wikipedia.org/')) {
        return {
          ok: true,
          json: async () => ({ thumbnail: { source: 'https://upload.wikimedia.org/wiki.jpg' } }),
        };
      }
      return { ok: false };
    };

    const api = createMediaApi({ fetchFn: mockFetch });
    const comic = {
      id: 'comic_test',
      comicIsbn: '9780785157977',
      wiki: 'Iron_Man',
    };

    const poster = await api.fetchPosterForItem(comic);
    expect(poster).toBe('https://covers.openlibrary.org/b/isbn/9780785157977-M.jpg?default=false');
    expect(requestedUrls.length).toBe(1);
    expect(requestedUrls[0].method).toBe('HEAD');
  });

  test('deduplica peticiones concurrentes en vuelo para el mismo ítem', async () => {
    let fetchCalls = 0;
    const mockFetch = async () => {
      fetchCalls++;
      await new Promise((r) => setTimeout(r, 20));
      return {
        ok: true,
        json: async () => ({ thumbnail: { source: 'https://upload.wikimedia.org/ironman.jpg' } }),
      };
    };

    const api = createMediaApi({ fetchFn: mockFetch });
    const movie = { id: 'mcu_iron_man', wiki: 'Iron_Man_(2008_film)' };

    const [p1, p2, p3] = await Promise.all([
      api.fetchPosterForItem(movie),
      api.fetchPosterForItem(movie),
      api.fetchPosterForItem(movie),
    ]);

    expect(fetchCalls).toBe(1);
    expect(p1).toBe('https://upload.wikimedia.org/ironman.jpg');
    expect(p2).toBe(p1);
    expect(p3).toBe(p1);
  });
});
