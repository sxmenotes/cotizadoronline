import { test, expect } from '@playwright/test';
import { setAuthenticatedState } from './helpers';

test.describe('Animaciones y UI', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthenticatedState(page);
  });

  test('Las transiciones de botones no deben bloquear el hilo', async ({ page }) => {
    await page.goto('/');

    const newBtn = page.locator('text=Nuevo Documento');
    await expect(newBtn).toBeVisible();

    // Hover para gatillar animación
    await newBtn.hover();
    
    // Verificamos que el botón sigue siendo clickable y responde
    await newBtn.click();
    
    await expect(page.locator('text=Presupuesto de Desarrollo')).toBeVisible();
  });
});
