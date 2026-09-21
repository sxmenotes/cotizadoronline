import { create } from 'zustand';
import { get, set } from 'idb-keyval';
import type { Catalog, Issuer, TermsContent } from '../domain/types';
import { catalogSeed, issuerSeed, termsSeed } from '../data/seeds';

const SETTINGS_KEY = 'sv:settings';

export interface SettingsState {
  catalog: Catalog;
  terms: TermsContent;
  issuer: Issuer;
  defaultExchangeRate: number;
  defaultExchangeNote: string;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  updateCatalog: (catalog: Catalog) => Promise<void>;
  updateTerms: (terms: TermsContent) => Promise<void>;
  updateIssuer: (issuer: Issuer) => Promise<void>;
  setExchangeRate: (rate: number, note?: string) => Promise<void>;
  resetToSeeds: (section: 'catalog' | 'terms' | 'issuer' | 'all') => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((setStore, getStore) => ({
  catalog: catalogSeed,
  terms: termsSeed,
  issuer: issuerSeed,
  defaultExchangeRate: 950,
  defaultExchangeNote: 'Tipo de cambio referencial mercado informal',
  isHydrated: false,

  hydrate: async () => {
    try {
      const stored = await get<Partial<SettingsState>>(SETTINGS_KEY);
      if (stored) {
        setStore((state) => ({
          ...state,
          catalog: stored.catalog || state.catalog,
          terms: stored.terms || state.terms,
          issuer: stored.issuer || state.issuer,
          defaultExchangeRate: stored.defaultExchangeRate ?? state.defaultExchangeRate,
          defaultExchangeNote: stored.defaultExchangeNote ?? state.defaultExchangeNote,
          isHydrated: true,
        }));
      } else {
        setStore({ isHydrated: true });
      }
    } catch {
      setStore({ isHydrated: true });
    }
  },

  updateCatalog: async (catalog: Catalog) => {
    setStore({ catalog });
    const current = getStore();
    await set(SETTINGS_KEY, {
      catalog: current.catalog,
      terms: current.terms,
      issuer: current.issuer,
      defaultExchangeRate: current.defaultExchangeRate,
      defaultExchangeNote: current.defaultExchangeNote,
    });
  },

  updateTerms: async (terms: TermsContent) => {
    setStore({ terms });
    const current = getStore();
    await set(SETTINGS_KEY, {
      catalog: current.catalog,
      terms: current.terms,
      issuer: current.issuer,
      defaultExchangeRate: current.defaultExchangeRate,
      defaultExchangeNote: current.defaultExchangeNote,
    });
  },

  updateIssuer: async (issuer: Issuer) => {
    setStore({ issuer });
    const current = getStore();
    await set(SETTINGS_KEY, {
      catalog: current.catalog,
      terms: current.terms,
      issuer: current.issuer,
      defaultExchangeRate: current.defaultExchangeRate,
      defaultExchangeNote: current.defaultExchangeNote,
    });
  },

  setExchangeRate: async (rate: number, note?: string) => {
    setStore((state) => ({
      defaultExchangeRate: rate,
      defaultExchangeNote: note !== undefined ? note : state.defaultExchangeNote,
    }));
    const current = getStore();
    await set(SETTINGS_KEY, {
      catalog: current.catalog,
      terms: current.terms,
      issuer: current.issuer,
      defaultExchangeRate: current.defaultExchangeRate,
      defaultExchangeNote: current.defaultExchangeNote,
    });
  },

  resetToSeeds: async (section) => {
    setStore((state) => ({
      catalog: section === 'catalog' || section === 'all' ? catalogSeed : state.catalog,
      terms: section === 'terms' || section === 'all' ? termsSeed : state.terms,
      issuer: section === 'issuer' || section === 'all' ? issuerSeed : state.issuer,
    }));
    const current = getStore();
    await set(SETTINGS_KEY, {
      catalog: current.catalog,
      terms: current.terms,
      issuer: current.issuer,
      defaultExchangeRate: current.defaultExchangeRate,
      defaultExchangeNote: current.defaultExchangeNote,
    });
  },
}));
