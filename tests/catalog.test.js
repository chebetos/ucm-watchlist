import { describe, expect, test } from 'bun:test';
import { MCU_CATALOG } from '../src/catalog.js';

describe('Integridad de MCU_CATALOG', () => {
  test('contiene más de 100 entradas con IDs únicos', () => {
    expect(MCU_CATALOG.length).toBeGreaterThan(100);
    const ids = MCU_CATALOG.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('asigna releaseOrder y chronoOrder consecutivos del 1 al N', () => {
    const n = MCU_CATALOG.length;
    const releaseOrders = MCU_CATALOG.map((i) => i.releaseOrder).sort((a, b) => a - b);
    const chronoOrders = MCU_CATALOG.map((i) => i.chronoOrder).sort((a, b) => a - b);

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
});
