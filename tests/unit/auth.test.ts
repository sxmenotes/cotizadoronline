import { describe, it, expect, beforeEach } from 'vitest';
import {
  verifyPassword,
  timingSafeEqual,
  checkAuthStatus,
  saveAuthSession,
  clearAuthSession,
} from '../../src/domain/auth';

describe('Autenticación y Criptografía Web Crypto (Sección 11)', () => {
  beforeEach(() => {
    clearAuthSession();
  });

  it('timingSafeEqual compara arrays de bytes de forma exacta', () => {
    const a = new Uint8Array([1, 2, 3]);
    const b = new Uint8Array([1, 2, 3]);
    const c = new Uint8Array([1, 2, 4]);
    const d = new Uint8Array([1, 2]);

    expect(timingSafeEqual(a, b)).toBe(true);
    expect(timingSafeEqual(a, c)).toBe(false);
    expect(timingSafeEqual(a, d)).toBe(false);
  });

  it('Verifica la contraseña correcta (desarrollo-cambiar) con PBKDF2', async () => {
    const isValid = await verifyPassword('desarrollo-cambiar');
    expect(isValid).toBe(true);
  });

  it('Rechaza contraseñas incorrectas', async () => {
    const isValid = await verifyPassword('clave-erronea-123');
    expect(isValid).toBe(false);
  });

  it('Gestiona ciclo de sesión en pestaña y almacenamiento persistente', () => {
    expect(checkAuthStatus()).toBe(false);

    // Guardar sesión temporal
    saveAuthSession(false);
    expect(checkAuthStatus()).toBe(true);

    clearAuthSession();
    expect(checkAuthStatus()).toBe(false);

    // Guardar sesión 7 días
    saveAuthSession(true);
    expect(checkAuthStatus()).toBe(true);

    clearAuthSession();
    expect(checkAuthStatus()).toBe(false);
  });
});
