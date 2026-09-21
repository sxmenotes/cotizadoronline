import { test, expect } from '@playwright/test';
import { setAuthenticatedState } from './helpers';

test.describe('Regresión Visual', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthenticatedState(page);
  });

  test('Página de inicio (Historial)', async ({ page }) => {
    await page.goto('/');
    // Eliminar animaciones para que el screenshot sea estable
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.innerHTML = `* { animation: none !important; transition: none !important; }`;
      document.head.appendChild(style);
    });
    
    // El navbar y header
    await expect(page).toHaveScreenshot('historial.png', { fullPage: true });
  });

  test('Formulario Presupuesto', async ({ page }) => {
    await page.goto('/editor'); // Asumiendo que /editor lleva directo o forzamos nav
    
    // Eliminar animaciones
    await page.evaluate(() => {
      const style = document.createElement('style');
      style.innerHTML = `* { animation: none !important; transition: none !important; }`;
      document.head.appendChild(style);
    });

    // Validar screenshot
    await expect(page).toHaveScreenshot('editor.png', { fullPage: true });
  });
});
