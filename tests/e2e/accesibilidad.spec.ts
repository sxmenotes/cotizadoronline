import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { setAuthenticatedState } from './helpers';

test.describe('Accesibilidad (A11y)', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthenticatedState(page);
  });

  test('La página principal cumple WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/');
    const accessibilityScanResults = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('El editor de presupuesto cumple WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/editor'); // Asumiendo manejo de default router o pasamos a nuevo documento
    
    // Forzamos clic en nuevo documento si falla
    if (await page.locator('text=Ingreso Seguro').isVisible()) {
        // failed auth? 
    }
    await page.goto('/');
    await page.click('text=Nuevo Documento');
    await page.click('text=Presupuesto de Desarrollo');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
