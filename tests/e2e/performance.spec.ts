import { test, expect } from '@playwright/test';
import { setAuthenticatedState } from './helpers';

test.describe('Performance LCP', () => {
  test.beforeEach(async ({ page }) => {
    await setAuthenticatedState(page);
  });

  test('LCP debe ser menor a 2.5s', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as Record<string, number>)['lcp'] = 0;
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        (window as unknown as Record<string, number>)['lcp'] = lastEntry.startTime;
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    });

    await page.goto('/');
    
    // Esperar a que la página esté interactiva
    await page.waitForLoadState('networkidle');

    const lcpValue = await page.evaluate(() => {
      return (window as unknown as Record<string, number>)['lcp'];
    });

    // Validar (LCP < 2500ms)
    // El timeout es 2.5s
    expect(Number(lcpValue)).toBeLessThan(2500);
  });
});
