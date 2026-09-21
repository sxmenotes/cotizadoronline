import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza una cadena para búsquedas: sin acentos, minúsculas, sin espacios sobrantes.
 */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Comprueba si todos los términos de una búsqueda (separados por espacio)
 * están contenidos en al menos uno de los campos provistos (búsqueda AND).
 */
export function matchesAllWords(query: string, fields: (string | undefined | null)[]): boolean {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  const normalizedFields = fields
    .filter((f): f is string => typeof f === 'string' && f.length > 0)
    .map(normalizeSearch);

  return terms.every((term) => normalizedFields.some((field) => field.includes(term)));
}

/**
 * Sanea un nombre para ser usado en archivos: sin acentos, caracteres especiales reemplazados por _
 */
export function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Genera el nombre de archivo estandarizado para un presupuesto PDF:
 * Presupuesto_<Cliente>_<Proyecto>_<YYYY-MM-DD>.pdf
 */
export function generateQuotePdfFilename(client: string, project: string, dateStr: string): string {
  const cleanClient = sanitizeFilename(client || 'Cliente');
  const cleanProject = sanitizeFilename(project || 'Proyecto');
  const cleanDate = sanitizeFilename(dateStr || new Date().toISOString().slice(0, 10));
  return `Presupuesto_${cleanClient}_${cleanProject}_${cleanDate}.pdf`;
}

/**
 * Descarga un Blob en el navegador con el nombre especificado.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

