import { create } from 'zustand';
import { get, set } from 'idb-keyval';
import type { Quote } from '../domain/types';

const QUOTES_KEY = 'sv:quotes';
const QUOTE_DRAFT_KEY = 'sv:quote_draft';

export interface QuotesState {
  quotes: Quote[];
  draft: Partial<Quote> | null;
  lastDeletedQuote: Quote | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  saveQuote: (quote: Quote) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  undoDeleteQuote: () => Promise<void>;
  duplicateQuote: (id: string) => Promise<Quote>;
  createRevision: (id: string, note?: string) => Promise<Quote>;
  getQuoteById: (id: string) => Quote | undefined;
  setDraft: (draft: Partial<Quote> | null) => Promise<void>;
  clearDraft: () => Promise<void>;
}

export const useQuotesStore = create<QuotesState>((setStore, getStore) => ({
  quotes: [],
  draft: null,
  lastDeletedQuote: null,
  isHydrated: false,

  hydrate: async () => {
    try {
      const storedQuotes = (await get<Quote[]>(QUOTES_KEY)) || [];
      const storedDraft = (await get<Partial<Quote>>(QUOTE_DRAFT_KEY)) || null;
      setStore({
        quotes: storedQuotes,
        draft: storedDraft,
        isHydrated: true,
      });
    } catch (e) {
      console.error('Error hidratando presupuestos desde IndexedDB:', e);
      setStore({ isHydrated: true });
    }
  },

  saveQuote: async (quote: Quote) => {
    const quotes = getStore().quotes;
    const existingIndex = quotes.findIndex((q) => q.id === quote.id);
    let updated: Quote[];
    if (existingIndex >= 0) {
      updated = [...quotes];
      updated[existingIndex] = quote;
    } else {
      updated = [quote, ...quotes];
    }
    setStore({ quotes: updated });
    await set(QUOTES_KEY, updated);
  },

  deleteQuote: async (id: string) => {
    const quotes = getStore().quotes;
    const target = quotes.find((q) => q.id === id);
    if (!target) return;

    const filtered = quotes.filter((q) => q.id !== id);
    setStore({ quotes: filtered, lastDeletedQuote: target });
    await set(QUOTES_KEY, filtered);
  },

  undoDeleteQuote: async () => {
    const last = getStore().lastDeletedQuote;
    if (!last) return;

    const quotes = [last, ...getStore().quotes];
    setStore({ quotes, lastDeletedQuote: null });
    await set(QUOTES_KEY, quotes);
  },

  duplicateQuote: async (id: string) => {
    const original = getStore().getQuoteById(id);
    if (!original) throw new Error(`Presupuesto ${id} no encontrado`);

    const now = new Date().toISOString();
    const duplicated: Quote = {
      ...original,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      project: `${original.project} (Copia)`,
      versionType: 'first',
      versionNote: undefined,
    };

    await getStore().saveQuote(duplicated);
    return duplicated;
  },

  createRevision: async (id: string, note?: string) => {
    const original = getStore().getQuoteById(id);
    if (!original) throw new Error(`Presupuesto ${id} no encontrado`);

    const now = new Date().toISOString();
    const revision: Quote = {
      ...original,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      versionType: 'revision',
      versionNote: note || 'Revisión con ajustes',
    };

    await getStore().saveQuote(revision);
    return revision;
  },

  getQuoteById: (id: string) => {
    return getStore().quotes.find((q) => q.id === id);
  },

  setDraft: async (draft) => {
    setStore({ draft });
    if (draft) {
      await set(QUOTE_DRAFT_KEY, draft);
    } else {
      await set(QUOTE_DRAFT_KEY, null);
    }
  },

  clearDraft: async () => {
    setStore({ draft: null });
    await set(QUOTE_DRAFT_KEY, null);
  },
}));
