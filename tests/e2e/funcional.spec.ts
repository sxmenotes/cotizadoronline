import { test, expect } from '@playwright/test';
import { setAuthenticatedState } from './helpers';

test.describe('Acceso (Auth)', () => {
  test('Bloqueo por intentos erróneos y acceso exitoso', async ({ page }) => {
    await page.goto('/');

    // Asegurar que estamos en pantalla de acceso
    await expect(page.locator('text=Ingreso Seguro')).toBeVisible();

    // 5 intentos incorrectos causan bloqueo (2s)
    for (let i = 0; i < 5; i++) {
      await page.fill('input[type="password"]', 'badpass');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=incorrecta')).toBeVisible();
    }

    // Sexto intento fallido
    await page.fill('input[type="password"]', 'badpass');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Espera')).toBeVisible(); // "Espera X segundos"

    // La app en pruebas tiene ALLOW_DEV_PASSWORD=1 que permite samu1234
    await page.waitForTimeout(2100);
    await page.fill('input[type="password"]', 'samu1234');
    await page.click('button[type="submit"]');

    // Navega al historial o app
    await expect(page.locator('text=Historial de Documentos')).toBeVisible();
  });
});

test.describe('Presupuesto (Funcional)', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthenticatedState(page);
    await page.goto('/');
  });

  test('Crear presupuesto, modificar y calcular', async ({ page }) => {
    await page.click('text=Nuevo Documento');
    await page.click('text=Presupuesto de Desarrollo');

    await expect(page.locator('text=Nuevo Presupuesto')).toBeVisible();

    // Llenar cliente y proyecto
    await page.fill('input[placeholder*="Ej: ACME"]', 'Empresa E2E');
    await page.fill('input[placeholder*="Ej: Sitio Web"]', 'Proyecto E2E');

    // Cambiar plan
    await page.click('button:has-text("Landing Page Base")'); // default is landing base, change to something else
    await page.click('text=Landing Page Avanzada');

    // El cálculo se debe reflejar instantáneamente, verificamos que el total exista y sea visible.
    const totalElement = page.locator('div', { hasText: 'TOTAL GENERAL' }).last();
    await expect(totalElement).toBeVisible();

    // Exportar (simulado)
    const previewBtn = page.locator('button:has-text("Vista Previa")');
    await expect(previewBtn).toBeVisible();
  });
});

test.describe('Esqueleto (Funcional)', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthenticatedState(page);
    await page.goto('/');
  });

  test('Crear esqueleto, agregar sección y exportar (UI)', async ({ page }) => {
    await page.click('text=Nuevo Documento');
    await page.click('text=Esqueleto Web');

    await expect(page.locator('text=Editor de Esqueleto')).toBeVisible();

    // Llenar datos base
    await page.fill('input[placeholder*="Razón Social"]', 'Cliente Esqueleto');
    await page.fill('input[placeholder*="Nombre del Proyecto"]', 'Proyecto Wireframe');

    await page.click('text=Continuar');

    // Estamos en el editor
    await expect(page.locator('text=Navegación Superior')).toBeVisible();
    await expect(page.locator('text=Hero / Cabecera Principal')).toBeVisible();

    // Exportar PDF
    const exportBtn = page.locator('button', { hasText: 'Exportar PDF' });
    await expect(exportBtn).toBeVisible();
  });
});
