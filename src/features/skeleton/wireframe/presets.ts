import type { PalettePreset, FontPairPreset } from './types';
import type { SkeletonDesign, SectionType } from '../../../domain/types';

export const PALETTE_PRESETS: (PalettePreset & { presetId: string })[] = [
  {
    id: 'elegante-oscuro',
    presetId: 'elegante-oscuro',
    name: 'Elegante oscuro',
    primary: '#C9A96E',
    secondary: '#2A2F3A',
    background: '#14161C',
    text: '#F3F4F6',
    accent: '#E5C98B',
  },
  {
    id: 'joyeria-dorada',
    presetId: 'joyeria-dorada',
    name: 'Joyería dorada',
    primary: '#B8860B',
    secondary: '#F5EFE6',
    background: '#FFFFFF',
    text: '#2B2B2B',
    accent: '#D4AF37',
  },
  {
    id: 'natural-fresco',
    presetId: 'natural-fresco',
    name: 'Natural fresco',
    primary: '#2F855A',
    secondary: '#E6F4EA',
    background: '#FAFCF9',
    text: '#1F2D24',
    accent: '#F6AD55',
  },
  {
    id: 'bodas-pastel',
    presetId: 'bodas-pastel',
    name: 'Bodas pastel',
    primary: '#D98BA5',
    secondary: '#FCE8EE',
    background: '#FFFBFC',
    text: '#4A3B40',
    accent: '#B8A1D9',
  },
  {
    id: 'tech-azul',
    presetId: 'tech-azul',
    name: 'Tech azul',
    primary: '#2563EB',
    secondary: '#E0E7FF',
    background: '#F9FAFB',
    text: '#1F2937',
    accent: '#F59E0B',
  },
  {
    id: 'gastro-calido',
    presetId: 'gastro-calido',
    name: 'Gastro cálido',
    primary: '#C2410C',
    secondary: '#FEF3E2',
    background: '#FFFAF3',
    text: '#3B2A1E',
    accent: '#F59E0B',
  },
  {
    id: 'minimal-bn',
    presetId: 'minimal-bn',
    name: 'Minimal blanco y negro',
    primary: '#111111',
    secondary: '#F2F2F2',
    background: '#FFFFFF',
    text: '#111111',
    accent: '#6B7280',
  },
  {
    id: 'vivo-moderno',
    presetId: 'vivo-moderno',
    name: 'Vivo moderno',
    primary: '#7C3AED',
    secondary: '#FCE7F3',
    background: '#FFFFFF',
    text: '#1E1B2E',
    accent: '#06B6D4',
  },
];

export const FONT_PAIR_PRESETS: FontPairPreset[] = [
  { id: 'elegante', name: 'Elegante', headingFont: 'Playfair Display', bodyFont: 'Lato' },
  { id: 'lujo', name: 'Lujo', headingFont: 'Cormorant Garamond', bodyFont: 'Montserrat' },
  { id: 'moderno', name: 'Moderno', headingFont: 'Poppins', bodyFont: 'Inter' },
  { id: 'clasico-limpio', name: 'Clásico limpio', headingFont: 'Montserrat', bodyFont: 'Open Sans' },
  { id: 'editorial', name: 'Editorial', headingFont: 'DM Serif Display', bodyFont: 'DM Sans' },
  { id: 'calido', name: 'Cálido', headingFont: 'Lora', bodyFont: 'Source Sans 3' },
  { id: 'fuerte', name: 'Fuerte', headingFont: 'Oswald', bodyFont: 'Roboto' },
  { id: 'tech', name: 'Tech', headingFont: 'Space Grotesk', bodyFont: 'Inter' },
  { id: 'amigable', name: 'Amigable', headingFont: 'Quicksand', bodyFont: 'Nunito' },
  { id: 'contemporaneo', name: 'Contemporáneo', headingFont: 'Fraunces', bodyFont: 'Manrope' },
];

export const CURATED_FONTS = [
  'Playfair Display',
  'Cormorant Garamond',
  'Montserrat',
  'Poppins',
  'Inter',
  'DM Serif Display',
  'DM Sans',
  'Lora',
  'Source Sans 3',
  'Oswald',
  'Roboto',
  'Space Grotesk',
  'Quicksand',
  'Nunito',
  'Josefin Sans',
  'Fraunces',
  'Manrope',
  'Lato',
  'Open Sans',
];

// Cálculo de Luminancia y Contraste WCAG 2.1
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const intVal = parseInt(cleaned, 16);
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255,
  };
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (rs ?? 0) + 0.7152 * (gs ?? 0) + 0.0722 * (bs ?? 0);
}

export function calculateContrastRatio(hex1: string, hex2: string): number {
  try {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    const ratio = (brightest + 0.05) / (darkest + 0.05);
    return Math.round(ratio * 100) / 100;
  } catch {
    return 1;
  }
}

export function getWcagEvaluation(ratio: number, isLargeText = false): {
  passes: boolean;
  level: 'AAA' | 'AA' | 'Falla';
  description: string;
} {
  const thresholdAA = isLargeText ? 3.0 : 4.5;
  const thresholdAAA = isLargeText ? 4.5 : 7.0;

  if (ratio >= thresholdAAA) {
    return { passes: true, level: 'AAA', description: `Excelente (${ratio.toFixed(1)}:1)` };
  }
  if (ratio >= thresholdAA) {
    return { passes: true, level: 'AA', description: `Conforme (${ratio.toFixed(1)}:1)` };
  }
  return { passes: false, level: 'Falla', description: `Insuficiente (${ratio.toFixed(1)}:1)` };
}

// Selector automático de texto contrastado sobre un fondo
export function getContrastingTextColor(bgHex: string): '#FFFFFF' | '#111111' {
  const ratioWhite = calculateContrastRatio(bgHex, '#FFFFFF');
  const ratioBlack = calculateContrastRatio(bgHex, '#111111');
  return ratioWhite >= ratioBlack ? '#FFFFFF' : '#111111';
}

// Plantillas de estructuras iniciales
export function getInitialStructure(
  type: 'landing' | 'catalog' | 'services',
  client: string,
  project: string,
  limit: number
): SkeletonDesign {
  const now = new Date().toISOString();

  let sections: { id: string; type: SectionType; variant: number; label: string }[] = [];

  if (type === 'landing') {
    sections = [
      { id: crypto.randomUUID(), type: 'hero', variant: 0, label: 'Hero Principal' },
      { id: crypto.randomUUID(), type: 'services', variant: 0, label: 'Nuestros Servicios' },
      { id: crypto.randomUUID(), type: 'about', variant: 0, label: 'Acerca de Nosotros' },
      { id: crypto.randomUUID(), type: 'testimonials', variant: 0, label: 'Opiniones de Clientes' },
      { id: crypto.randomUUID(), type: 'cta', variant: 0, label: 'Llamado a la Acción' },
      { id: crypto.randomUUID(), type: 'contact', variant: 0, label: 'Contacto y Ubicación' },
    ];
  } else if (type === 'catalog') {
    sections = [
      { id: crypto.randomUUID(), type: 'hero', variant: 1, label: 'Banner de Temporada' },
      { id: crypto.randomUUID(), type: 'catalog', variant: 0, label: 'Productos Destacados' },
      { id: crypto.randomUUID(), type: 'process', variant: 0, label: 'Cómo Comprar' },
      { id: crypto.randomUUID(), type: 'faq', variant: 0, label: 'Preguntas Frecuentes' },
      { id: crypto.randomUUID(), type: 'cta', variant: 1, label: 'Suscríbete a Novedades' },
    ];
  } else {
    sections = [
      { id: crypto.randomUUID(), type: 'hero', variant: 0, label: 'Propuesta de Valor' },
      { id: crypto.randomUUID(), type: 'services', variant: 1, label: 'Planes y Servicios' },
      { id: crypto.randomUUID(), type: 'stats', variant: 0, label: 'Nuestras Cifras' },
      { id: crypto.randomUUID(), type: 'team', variant: 0, label: 'Equipo Profesional' },
      { id: crypto.randomUUID(), type: 'pricing', variant: 0, label: 'Tabla de Tarifas' },
      { id: crypto.randomUUID(), type: 'contact', variant: 0, label: 'Agenda tu Cita' },
    ];
  }

  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    name: `Maqueta - ${project || 'Nuevo Sitio'}`,
    createdAt: now,
    updatedAt: now,
    project: {
      client: client || 'Cliente',
      project: project || 'Sitio Web',
      manualPageLimit: limit || 3,
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
        sections,
      },
    ],
    notes: 'Esquema interactivo referencial para acordar la estructura antes del desarrollo.',
  };
}
