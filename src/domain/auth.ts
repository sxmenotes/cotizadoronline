import authConfig from '../config/auth.json';

const SESSION_KEY = 'sv_auth_session';
const PERSIST_KEY = 'sv_auth_persist';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface PersistedSession {
  token: string;
  expiresAt: number;
}

// Comparación en tiempo constante para evitar ataques de temporización
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < a.byteLength; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

// Convertir base64 a Uint8Array
export function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Convertir ArrayBuffer a base64
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Verifica la contraseña usando Web Crypto API con PBKDF2-SHA256
 */
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBytes = base64ToBytes(authConfig.salt);

    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: authConfig.iterations,
        hash: 'SHA-256',
      },
      baseKey,
      256
    );

    const derivedBytes = new Uint8Array(derivedBits);
    const targetBytes = base64ToBytes(authConfig.hash);

    return timingSafeEqual(derivedBytes, targetBytes);
  } catch {
    return false;
  }
}

/**
 * Comprueba si existe una sesión activa y válida
 */
export function checkAuthStatus(): boolean {
  // 1. Revisar sesión en pestaña actual
  if (typeof sessionStorage !== 'undefined') {
    const sessionToken = sessionStorage.getItem(SESSION_KEY);
    if (sessionToken === 'authenticated') return true;
  }

  // 2. Revisar sesión persistente de 7 días
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw) as PersistedSession;
        if (data.token === 'authenticated' && data.expiresAt > Date.now()) {
          return true;
        }
        localStorage.removeItem(PERSIST_KEY);
      } catch {
        localStorage.removeItem(PERSIST_KEY);
      }
    }
  }

  return false;
}

/**
 * Inicia la sesión
 */
export function saveAuthSession(remember7Days: boolean): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, 'authenticated');
  }

  if (remember7Days && typeof localStorage !== 'undefined') {
    const sessionData: PersistedSession = {
      token: 'authenticated',
      expiresAt: Date.now() + SEVEN_DAYS_MS,
    };
    localStorage.setItem(PERSIST_KEY, JSON.stringify(sessionData));
  }
}

/**
 * Cierra la sesión activa
 */
export function clearAuthSession(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(PERSIST_KEY);
  }
}
