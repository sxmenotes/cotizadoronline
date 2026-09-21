import type { Page } from '@playwright/test';

export async function setAuthenticatedState(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('sv_auth_session', 'authenticated');
  });
}
