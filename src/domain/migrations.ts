export interface MigrationData {
  schemaVersion?: number;
  [key: string]: unknown;
}

export class MigrationError extends Error {
  public rawData: unknown;
  constructor(message: string, rawData: unknown) {
    super(message);
    this.name = 'MigrationError';
    this.rawData = rawData;
  }
}

export const CURRENT_SCHEMA_VERSION = 1;

export function migrate(data: unknown): MigrationData {
  if (!data || typeof data !== 'object') {
    throw new MigrationError('Los datos a migrar deben ser un objeto válido', data);
  }

  const record = data as Record<string, unknown>;
  const version = typeof record.schemaVersion === 'number' ? record.schemaVersion : 1;

  if (version > CURRENT_SCHEMA_VERSION) {
    throw new MigrationError(
      `Versión de esquema desconocida (${version}). Se esperaba versión ${CURRENT_SCHEMA_VERSION} o anterior. Por favor, respalda tus datos antes de continuar.`,
      data
    );
  }

  // Si en el futuro hay version === 2, se ejecutan migraciones secuenciales aquí.
  return {
    ...record,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}
