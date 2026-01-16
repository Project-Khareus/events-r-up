import { test, expect } from '@playwright/test';

test('should accept cookie consent', async ({ page }) => {
  // Clear localStorage first
  await page.goto('/');
  await page.evaluate(() => localStorage.removeItem('cookie_consent'));
  
  // Reload to show banner
  await page.reload();
  
  // Wait for banner
  await page.waitForSelector('text=We value your privacy', { timeout: 3000 });
  
  // Click Accept
  await page.getByRole('button', { name: /accept all/i }).click();
  
  // Verify localStorage is set
  await page.waitForFunction(
    () => localStorage.getItem('cookie_consent') === 'accepted',
    { timeout: 2000 }
  );
  
  const consent = await page.evaluate(() => localStorage.getItem('cookie_consent'));
  expect(consent).toBe('accepted');
});