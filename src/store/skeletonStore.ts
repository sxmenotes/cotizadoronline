import { create } from 'zustand';
import { temporal } from 'zundo';
import { get, set } from 'idb-keyval';
import type { SkeletonDesign, SkeletonPage, SkeletonSection } from '../domain/types';

const SKELETONS_KEY = 'sv:skeletons';

export const createDefaultSkeleton = (
  client = 'Cliente',
  project = 'Proyecto Web',
  limit = 3
): SkeletonDesign => {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    name: `Esqueleto - ${project}`,
    createdAt: now,
    updatedAt: now,
    project: {
      client,
      project,
      manualPageLimit: limit,
    },
    palette: {
      primary: '#2563EB',
      secondary: '#E0E7FF',
      background: '#F9FAFB',
      text: '#1F2937',
      accent: '#F59E0B',
      presetId: 'tech-azul',
    },
    typography: {
      headingFont: 'Poppins',
      bodyFont: 'Inter',
      scale: 'normal',
    },
    style: {
      radius: 'soft',
      density: 'normal',
    },
    global: {
      navbar: { enabled: true, variant: 0 },
      footer: { enabled: true, variant: 0 },
    },
    pages: [
      {
        id: crypto.randomUUID(),
        name: 'Inicio',
        sections: [
          { id: crypto.randomUUID(), type: 'hero', variant: 0, label: 'Hero Principal' },
          { id: crypto.randomUUID(), type: 'services', variant: 0, label: 'Servicios Destacados' },
          { id: crypto.randomUUID(), type: 'cta', variant: 0, label: 'Llamado a la Acción' },
        ],
      },
    ],
    notes: '',
  };
};

export interface SkeletonStoreState {
  skeletons: SkeletonDesign[];
  current: SkeletonDesign;
  activePageIndex: number;
  selectedSectionId: string | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  saveCurrent: () => Promise<void>;
  loadSkeleton: (id: string) => void;
  setCurrent: (design: SkeletonDesign) => void;
  updateCurrent: (partial: Partial<SkeletonDesign>) => void;
  setActivePageIndex: (index: number) => void;
  setSelectedSectionId: (id: string | null) => void;

  // Acciones de páginas y secciones
  addPage: (name: string) => boolean;
  removePage: (index: number) => void;
  renamePage: (index: number, name: string) => void;
  addSection: (pageIndex: number, section: SkeletonSection, afterId?: string) => boolean;
  removeSection: (pageIndex: number, sectionId: string) => void;
  reorderSections: (pageIndex: number, newSections: SkeletonSection[]) => void;
  updateSection: (pageIndex: number, sectionId: string, partial: Partial<SkeletonSection>) => void;
  duplicateSection: (pageIndex: number, sectionId: string) => boolean;
  deleteSkeleton: (id: string) => Promise<void>;
}

export const useSkeletonStore = create<SkeletonStoreState>()(
  temporal(
    (setStore, getStore) => ({
      skeletons: [],
      current: createDefaultSkeleton(),
      activePageIndex: 0,
      selectedSectionId: null,
      isHydrated: false,

      hydrate: async () => {
        try {
          const stored = (await get<SkeletonDesign[]>(SKELETONS_KEY)) || [];
          setStore({ skeletons: stored, isHydrated: true });
        } catch (e) {
          console.error('Error hidratando esqueletos desde IndexedDB:', e);
          setStore({ isHydrated: true });
        }
      },

      saveCurrent: async () => {
        const state = getStore();
        const updatedCurrent = {
          ...state.current,
          updatedAt: new Date().toISOString(),
        };
        const list = state.skeletons;
        const index = list.findIndex((s) => s.id === updatedCurrent.id);
        let updatedList: SkeletonDesign[];
        if (index >= 0) {
          updatedList = [...list];
          updatedList[index] = updatedCurrent;
        } else {
          updatedList = [updatedCurrent, ...list];
        }
        setStore({ current: updatedCurrent, skeletons: updatedList });
        await set(SKELETONS_KEY, updatedList);
      },

      loadSkeleton: (id: string) => {
        const target = getStore().skeletons.find((s) => s.id === id);
        if (target) {
          setStore({
            current: target,
            activePageIndex: 0,
            selectedSectionId: target.pages[0]?.sections[0]?.id || null,
          });
        }
      },

      setCurrent: (design: SkeletonDesign) => {
        setStore({
          current: design,
          activePageIndex: 0,
          selectedSectionId: design.pages[0]?.sections[0]?.id || null,
        });
      },

      updateCurrent: (partial: Partial<SkeletonDesign>) => {
        setStore((state) => ({
          current: { ...state.current, ...partial },
        }));
      },

      setActivePageIndex: (index: number) => {
        setStore({ activePageIndex: index, selectedSectionId: null });
      },

      setSelectedSectionId: (id: string | null) => {
        setStore({ selectedSectionId: id });
      },

      addPage: (name: string) => {
        const state = getStore();
        const limit = state.current.project.manualPageLimit;
        if (state.current.pages.length >= limit) {
          return false;
        }
        const newPage: SkeletonPage = {
          id: crypto.randomUUID(),
          name: name.slice(0, 24) || `Página ${state.current.pages.length + 1}`,
          sections: [
            { id: crypto.randomUUID(), type: 'hero', variant: 0, label: 'Hero' },
          ],
        };
        setStore({
          current: {
            ...state.current,
            pages: [...state.current.pages, newPage],
          },
          activePageIndex: state.current.pages.length,
        });
        return true;
      },

      removePage: (index: number) => {
        const state = getStore();
        if (state.current.pages.length <= 1) return;
        const filtered = state.current.pages.filter((_, idx) => idx !== index);
        setStore({
          current: { ...state.current, pages: filtered },
          activePageIndex: Math.max(0, Math.min(index, filtered.length - 1)),
        });
      },

      renamePage: (index: number, name: string) => {
        const state = getStore();
        const pages = [...state.current.pages];
        const target = pages[index];
        if (target) {
          pages[index] = { ...target, name: name.slice(0, 24) };
          setStore({ current: { ...state.current, pages } });
        }
      },

      addSection: (pageIndex: number, section: SkeletonSection, afterId?: string) => {
        const state = getStore();
        const page = state.current.pages[pageIndex];
        if (!page || page.sections.length >= 10) return false;

        const sections = [...page.sections];
        if (afterId) {
          const idx = sections.findIndex((s) => s.id === afterId);
          if (idx >= 0) {
            sections.splice(idx + 1, 0, section);
          } else {
            sections.push(section);
          }
        } else {
          sections.push(section);
        }

        const pages = [...state.current.pages];
        pages[pageIndex] = { ...page, sections };
        setStore({
          current: { ...state.current, pages },
          selectedSectionId: section.id,
        });
        return true;
      },

      removeSection: (pageIndex: number, sectionId: string) => {
        const state = getStore();
        const page = state.current.pages[pageIndex];
        if (!page) return;

        const sections = page.sections.filter((s) => s.id !== sectionId);
        const pages = [...state.current.pages];
        pages[pageIndex] = { ...page, sections };
        setStore({
          current: { ...state.current, pages },
          selectedSectionId:
            state.selectedSectionId === sectionId ? null : state.selectedSectionId,
        });
      },

      reorderSections: (pageIndex: number, newSections: SkeletonSection[]) => {
        const state = getStore();
        const page = state.current.pages[pageIndex];
        if (!page) return;

        const pages = [...state.current.pages];
        pages[pageIndex] = { ...page, sections: newSections };
        setStore({ current: { ...state.current, pages } });
      },

      updateSection: (pageIndex: number, sectionId: string, partial: Partial<SkeletonSection>) => {
        const state = getStore();
        const page = state.current.pages[pageIndex];
        if (!page) return;

        const sections = page.sections.map((s) =>
          s.id === sectionId ? { ...s, ...partial } : s
        );
        const pages = [...state.current.pages];
        pages[pageIndex] = { ...page, sections };
        setStore({ current: { ...state.current, pages } });
      },

      duplicateSection: (pageIndex: number, sectionId: string) => {
        const state = getStore();
        const page = state.current.pages[pageIndex];
        if (!page || page.sections.length >= 10) return false;

        const target = page.sections.find((s) => s.id === sectionId);
        if (!target) return false;

        const duplicate: SkeletonSection = {
          ...target,
          id: crypto.randomUUID(),
          label: `${target.label} (Copia)`.slice(0, 40),
        };

        return getStore().addSection(pageIndex, duplicate, sectionId);
      },

      deleteSkeleton: async (id: string) => {
        const filtered = getStore().skeletons.filter((s) => s.id !== id);
        setStore({ skeletons: filtered });
        await set(SKELETONS_KEY, filtered);
      },
    }),
    {
      limit: 100,
      equality: (pastState, currentState) =>
        JSON.stringify(pastState.current) === JSON.stringify(currentState.current),
      partialize: (state) => ({ current: state.current }) as unknown as SkeletonStoreState,
    }
  )
);
