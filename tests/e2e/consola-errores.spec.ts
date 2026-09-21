import { test, expect } from '@playwright/test';
import { setAuthenticatedState } from './helpers';

test.describe('Cero Errores en Consola', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthenticatedState(page);
  });

  test('Recorre páginas principales sin emitir warnings ni errores', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const httpErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
      if (msg.type() === 'warning') {
        // Ignorar warnings propios de Vite/React en dev si aplican, 
        // pero la instrucción es estricta: cero warnings.
        warnings.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    page.on('response', (res) => {
      if (res.status() >= 400) {
        httpErrors.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.click('text=Ajustes');
    await page.waitForLoadState('networkidle');

    await page.goto('/history');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
    expect(warnings).toHaveLength(0);
    expect(httpErrors).toHaveLength(0);
  });
});
