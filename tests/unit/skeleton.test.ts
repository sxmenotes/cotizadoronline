// @vitest-environment node
import { describe, it, expect, beforeAll, vi } from 'vitest';

vi.mock('idb-keyval', () => {
  const memoryStore = new Map<string, unknown>();
  return {
    get: vi.fn(async (key: string) => memoryStore.get(key)),
    set: vi.fn(async (key: string, val: unknown) => {
      memoryStore.set(key, val);
    }),
  };
});

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { SkeletonDesignSchema } from '../../src/domain/schemas';
import {
  calculateContrastRatio,
  getWcagEvaluation,
  getContrastingTextColor,
  getInitialStructure,
} from '../../src/features/skeleton/wireframe/presets';
import {
  BLOCK_METAS,
  getWireframeBlockTree,
  getGlobalNavbarTree,
  getGlobalFooterTree,
} from '../../src/features/skeleton/wireframe/blocks';
import { SkeletonDocument } from '../../src/features/skeleton/wireframe/SkeletonDocument';
import { registerPdfFonts } from '../../src/pdf/fonts';
import type { SectionType, SkeletonDesign } from '../../src/domain/types';

beforeAll(() => {
  registerPdfFonts();
});

describe('Modelo y Esquema Zod de Esqueleto Web (Fase 8)', () => {
  it('valida una estructura de esqueleto válida', () => {
    const valid = getInitialStructure('landing', 'Empresa Test', 'Web Corporativa', 3);
    const parsed = SkeletonDesignSchema.parse(valid);
    expect(parsed.id).toBeDefined();
    expect(parsed.pages).toHaveLength(1);
  });

  it('rechaza paleta con colores hexadecimales inválidos', () => {
    const invalid = getInitialStructure('landing', 'Empresa', 'Web', 3);
    (invalid.palette as unknown as Record<string, string>).primary = 'rojo';
    expect(() => SkeletonDesignSchema.parse(invalid)).toThrow('hex inválido');
  });

  it('rechaza páginas con más de 10 secciones según regla estricta', () => {
    const design = getInitialStructure('landing', 'Empresa', 'Web', 3);
    const sections = Array.from({ length: 11 }).map((_, i) => ({
      id: `sec-${i}`,
      type: 'hero' as SectionType,
      variant: 0,
      label: `Bloque ${i}`,
    }));
    design.pages[0] = { id: 'p1', name: 'Inicio', sections };

    expect(() => SkeletonDesignSchema.parse(design)).toThrow(
      'Máximo 10 secciones por página'
    );
  });
});

describe('Verificador de Contraste WCAG y Presets', () => {
  it('calcula ratio de contraste correcto', () => {
    const ratioHigh = calculateContrastRatio('#000000', '#FFFFFF');
    expect(ratioHigh).toBeGreaterThan(15);

    const ratioLow = calculateContrastRatio('#777777', '#666666');
    expect(ratioLow).toBeLessThan(3);
  });

  it('evalúa niveles WCAG para texto normal y grande', () => {
    const evalHigh = getWcagEvaluation(8.5, false);
    expect(evalHigh.passes).toBe(true);
    expect(evalHigh.level).toBe('AAA');

    const evalFail = getWcagEvaluation(2.1, false);
    expect(evalFail.passes).toBe(false);
    expect(evalFail.level).toBe('Falla');
  });

  it('elige automáticamente el mejor color de texto para botones', () => {
    expect(getContrastingTextColor('#0F172A')).toBe('#FFFFFF'); // Fondo oscuro -> texto blanco
    expect(getContrastingTextColor('#F9FAFB')).toBe('#111111'); // Fondo claro -> texto oscuro
  });
});

describe('Biblioteca de Bloques y Metadatos Didácticos', () => {
  const allSectionTypes: SectionType[] = [
    'navbar',
    'footer',
    'hero',
    'about',
    'services',
    'catalog',
    'gallery',
    'process',
    'stats',
    'testimonials',
    'pricing',
    'team',
    'faq',
    'cta',
    'contact',
    'social',
  ];

  it('todos los tipos de sección tienen metadatos con explicaciones didácticas', () => {
    allSectionTypes.forEach((type) => {
      const meta = BLOCK_METAS[type];
      expect(meta).toBeDefined();
      expect(meta.name.length).toBeGreaterThan(0);
      expect(meta.didacticExplanation.length).toBeGreaterThan(20);
      expect(meta.clientPurpose.length).toBeGreaterThan(15);
      expect(meta.variants.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('genera árboles de nodos abstractos válidos para todas las variantes', () => {
    allSectionTypes
      .filter((t) => t !== 'navbar' && t !== 'footer')
      .forEach((type) => {
        const meta = BLOCK_METAS[type];
        meta.variants.forEach((v) => {
          const tree = getWireframeBlockTree(type, v.variantIndex, 'Título Test');
          expect(tree.t).toBe('box');
        });
      });

    expect(getGlobalNavbarTree(0).t).toBe('box');
    expect(getGlobalNavbarTree(1).t).toBe('box');
    expect(getGlobalFooterTree(0).t).toBe('box');
    expect(getGlobalFooterTree(1).t).toBe('box');
  });
});

describe('Exportación a PDF del Esqueleto (SkeletonDocument)', () => {
  it('genera un PDF vectorial no en blanco con página de resumen y páginas del sitio', async () => {
    const design: SkeletonDesign = getInitialStructure(
      'landing',
      'Constructora Horizonte SpA',
      'Sitio Web Corporativo',
      3
    );
    design.pages.push({
      id: 'page-2',
      name: 'Servicios y Portafolio',
      sections: [
        { id: 's1', type: 'services', variant: 0, label: 'Especialidades' },
        { id: 's2', type: 'gallery', variant: 0, label: 'Obras Realizadas' },
        { id: 's3', type: 'cta', variant: 0, label: 'Cotiza tu Proyecto' },
      ],
    });

    const doc = React.createElement(SkeletonDocument, { design }) as unknown as Parameters<typeof pdf>[0];
    const blob = await pdf(doc).toBlob();
    expect(blob.size).toBeGreaterThan(5000);

    // Cargar con pdfjs-dist para verificar que NO esté en blanco y contenga el texto esperado
    const arrayBuffer = await blob.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // 1 página de resumen + 2 páginas del sitio = 3 páginas en total
    expect(pdfDoc.numPages).toBe(3);

    // Página 1: debe contener el cliente, "ESQUELETO DE DISEÑO WEB", y el glosario didáctico
    const page1 = await pdfDoc.getPage(1);
    const content1 = await page1.getTextContent();
    const text1 = content1.items
      .map((item) => ('str' in item ? (item as { str: string }).str : ''))
      .join(' ');

    const compactText1 = text1.replace(/\s+/g, '');
    expect(compactText1).toContain('SAMUELVALENZUELA');
    expect(compactText1).toContain('ESQUELETODEDISEÑOWEB');
    expect(text1).toContain('Constructora Horizonte SpA');
    expect(text1).toContain('Glosario Didáctico de Secciones');
    expect(text1).toContain('Nota Didáctica sobre la Maqueta');

    // Página 2: maqueta de Inicio
    const page2 = await pdfDoc.getPage(2);
    const content2 = await page2.getTextContent();
    const text2 = content2.items
      .map((item) => ('str' in item ? (item as { str: string }).str : ''))
      .join(' ');

    expect(text2).toContain('Inicio');
    expect(text2.toUpperCase()).toContain('VISTA ESCRITORIO');
    expect(text2.toUpperCase()).toContain('MÓVIL');

    // Página 3: maqueta de Servicios
    const page3 = await pdfDoc.getPage(3);
    const content3 = await page3.getTextContent();
    const text3 = content3.items
      .map((item) => ('str' in item ? (item as { str: string }).str : ''))
      .join(' ');

    expect(text3).toContain('Servicios y Portafolio');
  });
});
