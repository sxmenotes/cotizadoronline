import { z } from 'zod';
import type { Catalog, Issuer, Quote, SkeletonDesign, TermsContent } from './types';
import {
  CatalogSchema,
  IssuerSchema,
  QuoteSchema,
  SkeletonDesignSchema,
  TermsContentSchema,
} from './schemas';

export interface FullBackupData {
  schemaVersion: 1;
  exportedAt: string;
  quotes: Quote[];
  skeletons: SkeletonDesign[];
  settings: {
    catalog: Catalog;
    terms: TermsContent;
    issuer: Issuer;
    defaultExchangeRate: number;
    defaultExchangeNote: string;
  };
}

export const FullBackupSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  quotes: z.array(QuoteSchema),
  skeletons: z.array(SkeletonDesignSchema),
  settings: z.object({
    catalog: CatalogSchema,
    terms: TermsContentSchema,
    issuer: IssuerSchema,
    defaultExchangeRate: z.number().positive(),
    defaultExchangeNote: z.string(),
  }),
});

/**
 * Genera el archivo de respaldo completo en formato JSON y dispara la descarga
 */
export function exportBackupFile(data: FullBackupData): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const link = document.createElement('a');
  link.href = url;
  link.download = `respaldo-sv-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Valida un JSON importado contra el esquema de respaldo
 */
export function parseAndValidateBackup(jsonString: string): FullBackupData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('El archivo seleccionado no es un JSON válido');
  }

  const result = FullBackupSchema.safeParse(parsed);
  if (!result.success) {
    const firstError = result.error.errors[0];
    const msg = firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Estructura inválida';
    throw new Error(`El archivo de respaldo no es válido: ${msg}`);
  }

  return result.data;
}

/**
 * Estrategia de combinación (merge):
 * Por cada elemento (por id), si existe en ambos, gana el que tenga updatedAt más reciente.
 */
export function mergeItemsById<T extends { id: string; updatedAt: string }>(
  existingList: T[],
  incomingList: T[]
): T[] {
  const map = new Map<string, T>();

  // Cargar existentes
  for (const item of existingList) {
    map.set(item.id, item);
  }

  // Combinar entrantes
  for (const item of incomingList) {
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
    } else {
      const existingDate = new Date(existing.updatedAt).getTime();
      const incomingDate = new Date(item.updatedAt).getTime();
      if (incomingDate >= existingDate) {
        map.set(item.id, item);
      }
    }
  }

  return Array.from(map.values());
}
