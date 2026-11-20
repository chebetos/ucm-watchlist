import { describe, expect, test } from 'bun:test';
import { MCU_CATALOG } from '../src/catalog.js';
import { loadAllEpisodeSynopses, getEpisodeSynopsis } from '../src/data/episodes/index.js';

describe('Integridad de MCU_CATALOG', () => {
  test('contiene más de 100 entradas con IDs únicos', () => {
    expect(MCU_CATALOG.length).toBeGreaterThan(100);
    const ids = MCU_CATALOG.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('asigna releaseOrder y chronoOrder consecutivos del 1 al N', () => {
    const n = MCU_CATALOG.length;
    const releaseOrders = MCU_CATALOG.map((i) => i.releaseOrder).toSorted((a, b) => a - b);
    const chronoOrders = MCU_CATALOG.map((i) => i.chronoOrder).toSorted((a, b) => a - b);

    expect(releaseOrders[0]).toBe(1);
    expect(releaseOrders[n - 1]).toBe(n);
    expect(chronoOrders[0]).toBe(1);
    expect(chronoOrders[n - 1]).toBe(n);
  });

  test('no contiene las erratas corregidas del code review', () => {
    const serialized = JSON.stringify(MCU_CATALOG);
    expect(serialized).not.toContain('TheSacred Metal');
    expect(serialized).not.toContain('fa-fire-flame-Simple');
    expect(serialized).toContain('The Sacred Metal');
    expect(serialized).toContain('fa-fire-flame-simple');
  });

  test('todos los episodios de todas las series tienen sinopsis en español no vacía', async () => {
    await loadAllEpisodeSynopses();
    const missing = [];
    let totalEpisodes = 0;

    for (const item of MCU_CATALOG) {
      if (!Array.isArray(item.seasons)) continue;
      for (const season of item.seasons) {
        for (const ep of season.episodes) {
          totalEpisodes += 1;
          const synopsis = getEpisodeSynopsis(item.id, ep.code);
          if (typeof synopsis !== 'string' || synopsis.trim().length < 20) {
            missing.push(`${item.id}:${ep.code}`);
          }
        }
      }
    }

    expect(totalEpisodes).toBe(543);
    expect(missing).toEqual([]);
  });
});
