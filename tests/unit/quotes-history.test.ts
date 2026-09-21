import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('idb-keyval', () => {
  const memoryStore = new Map<string, unknown>();
  return {
    get: vi.fn(async (key: string) => memoryStore.get(key)),
    set: vi.fn(async (key: string, val: unknown) => {
      memoryStore.set(key, val);
    }),
  };
});
import {
  normalizeSearch,
  matchesAllWords,
  sanitizeFilename,
  generateQuotePdfFilename,
} from '../../src/lib/utils';
import { useQuotesStore } from '../../src/store/quotesStore';
import { catalogSeed, termsSeed, issuerSeed } from '../../src/data/seeds';
import type { Quote } from '../../src/domain/types';

describe('Utilidades de Búsqueda y Nombres de Archivo (Fase 7)', () => {
  it('normaliza texto eliminando acentos y pasando a minúsculas', () => {
    expect(normalizeSearch('CLÍNICA San José')).toBe('clinica san jose');
    expect(normalizeSearch('Página WEB & Mantención')).toBe('pagina web & mantencion');
  });

  it('búsqueda AND: comprueba coincidencia de todas las palabras en campos múltiples', () => {
    const fields = [
      'Clínica San José SpA',
      'Sitio Web Corporativo',
      'Plan Landing full',
      'https://figma.com/@diseno',
      'Revisión con ajustes en botones',
    ];

    // Todas las palabras coinciden
    expect(matchesAllWords('clinica jose corporativo', fields)).toBe(true);
    expect(matchesAllWords('SAN landing', fields)).toBe(true);
    expect(matchesAllWords('figma revision', fields)).toBe(true);

    // Si falta una palabra, la búsqueda AND falla
    expect(matchesAllWords('clinica wordpress', fields)).toBe(false);
    expect(matchesAllWords('jose inexistente', fields)).toBe(false);

    // Consulta vacía siempre coincide
    expect(matchesAllWords('', fields)).toBe(true);
    expect(matchesAllWords('   ', fields)).toBe(true);
  });

  it('sanea nombres de archivo para seguridad en filesystem', () => {
    expect(sanitizeFilename('Clínica San José')).toBe('Clinica_San_Jose');
    expect(sanitizeFilename('Proyecto/Web: "2026"*!?')).toBe('Proyecto_Web_2026');
    expect(sanitizeFilename('__test__name__')).toBe('test_name');
  });

  it('genera el nombre de archivo estandarizado para presupuesto PDF', () => {
    const filename = generateQuotePdfFilename(
      'Clínica San José SpA',
      'Rediseño Web 2026',
      '2026-09-20'
    );
    expect(filename).toBe('Presupuesto_Clinica_San_Jose_SpA_Rediseno_Web_2026_2026-09-20.pdf');
  });
});

describe('Store de Presupuestos (useQuotesStore)', () => {
  const dummyQuote: Quote = {
    id: 'test-quote-1',
    createdAt: '2026-09-20T10:00:00.000Z',
    updatedAt: '2026-09-20T10:00:00.000Z',
    issuedOn: '2026-09-20',
    client: 'Acme Corp',
    project: 'Portal B2B',
    prototypeUrl: 'https://figma.com/@acme',
    versionType: 'first',
    versionNote: '',
    projectType: 'construccion',
    planId: 'landingPlus',
    extraPages: 2,
    subscriptionId: 'full',
    hosting: true,
    currency: 'CLP',
    catalog: catalogSeed,
    terms: termsSeed,
    issuer: issuerSeed,
  };

  beforeEach(() => {
    useQuotesStore.setState({
      quotes: [],
      draft: null,
      lastDeletedQuote: null,
      isHydrated: true,
    });
  });

  it('guarda y recupera cotizaciones por ID', async () => {
    const store = useQuotesStore.getState();
    await store.saveQuote(dummyQuote);

    const retrieved = useQuotesStore.getState().getQuoteById('test-quote-1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.client).toBe('Acme Corp');
    expect(useQuotesStore.getState().quotes).toHaveLength(1);
  });

  it('duplica una cotización con nuevo ID, sufijo "(Copia)" y versión "first"', async () => {
    const store = useQuotesStore.getState();
    await store.saveQuote(dummyQuote);

    const duplicated = await store.duplicateQuote('test-quote-1');

    expect(duplicated.id).not.toBe(dummyQuote.id);
    expect(duplicated.project).toBe('Portal B2B (Copia)');
    expect(duplicated.versionType).toBe('first');
    expect(duplicated.versionNote).toBeUndefined();
    expect(useQuotesStore.getState().quotes).toHaveLength(2);
  });

  it('crea una nueva revisión formal con versión "revision" y nota especificada', async () => {
    const store = useQuotesStore.getState();
    await store.saveQuote(dummyQuote);

    const rev = await store.createRevision('test-quote-1', 'Ajuste de alcance');

    expect(rev.id).not.toBe(dummyQuote.id);
    expect(rev.versionType).toBe('revision');
    expect(rev.versionNote).toBe('Ajuste de alcance');
    expect(useQuotesStore.getState().quotes).toHaveLength(2);
  });

  it('elimina cotización y permite deshacer la eliminación (undo)', async () => {
    const store = useQuotesStore.getState();
    await store.saveQuote(dummyQuote);
    expect(useQuotesStore.getState().quotes).toHaveLength(1);

    // Eliminar
    await store.deleteQuote('test-quote-1');
    expect(useQuotesStore.getState().quotes).toHaveLength(0);
    expect(useQuotesStore.getState().lastDeletedQuote?.id).toBe('test-quote-1');

    // Deshacer eliminación
    await store.undoDeleteQuote();
    expect(useQuotesStore.getState().quotes).toHaveLength(1);
    expect(useQuotesStore.getState().getQuoteById('test-quote-1')).toBeDefined();
    expect(useQuotesStore.getState().lastDeletedQuote).toBeNull();
  });
});
