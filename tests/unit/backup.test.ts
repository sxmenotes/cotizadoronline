import { describe, it, expect } from 'vitest';
import {
  parseAndValidateBackup,
  mergeItemsById,
  type FullBackupData,
} from '../../src/domain/backup';
import { catalogSeed, termsSeed, issuerSeed } from '../../src/data/seeds';

describe('Respaldo, Restauración y Combinación (Sección 5.2)', () => {
  const validBackup: FullBackupData = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    quotes: [],
    skeletons: [],
    settings: {
      catalog: catalogSeed,
      terms: termsSeed,
      issuer: issuerSeed,
      defaultExchangeRate: 950,
      defaultExchangeNote: 'Ref',
    },
  };

  it('Valida un archivo de respaldo correcto', () => {
    const json = JSON.stringify(validBackup);
    const parsed = parseAndValidateBackup(json);
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.settings.catalog.plans.length).toBeGreaterThan(0);
  });

  it('Rechaza JSON corrupto o esquema incompatible', () => {
    expect(() => parseAndValidateBackup('json-invalido{')).toThrow(
      'no es un JSON válido'
    );

    const invalid = { schemaVersion: 2 };
    expect(() => parseAndValidateBackup(JSON.stringify(invalid))).toThrow(
      'no es válido'
    );
  });

  it('Combina colecciones por ID conservando el updatedAt más reciente', () => {
    const itemA_old = {
      id: '1',
      title: 'Versión antigua',
      updatedAt: '2026-09-01T10:00:00.000Z',
    };
    const itemA_new = {
      id: '1',
      title: 'Versión nueva',
      updatedAt: '2026-09-20T10:00:00.000Z',
    };
    const itemB = {
      id: '2',
      title: 'Solo en existentes',
      updatedAt: '2026-09-10T10:00:00.000Z',
    };
    const itemC = {
      id: '3',
      title: 'Solo en entrantes',
      updatedAt: '2026-09-15T10:00:00.000Z',
    };

    // Caso 1: Entrante más nuevo reemplaza
    const res1 = mergeItemsById([itemA_old, itemB], [itemA_new, itemC]);
    expect(res1.length).toBe(3);
    const item1 = res1.find((x) => x.id === '1');
    expect(item1?.title).toBe('Versión nueva');

    // Caso 2: Existente más nuevo no es sobreescrito por entrante viejo
    const res2 = mergeItemsById([itemA_new, itemB], [itemA_old]);
    const item2 = res2.find((x) => x.id === '1');
    expect(item2?.title).toBe('Versión nueva');
  });
});
