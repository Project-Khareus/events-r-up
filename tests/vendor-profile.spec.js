import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  
  // Accept cookies using the same approach that works
  await page.waitForSelector('text=We value your privacy', { timeout: 3000 });
  await page.getByRole('button', { name: /accept all/i }).click();
  await page.waitForFunction(
    () => localStorage.getItem('cookie_consent') === 'accepted',
    { timeout: 2000 }
  );
});

test('should navigate to vendor profile', async ({ page }) => {
  // Check if vendors exist
  const vendorCards = page.locator('a[href*="VendorDetail"]');
  const count = await vendorCards.count();
  
  if (count === 0) {
    test.skip();
  }
  
  // Click first vendor
  await vendorCards.first().click();
  await expect(page).toHaveURL(/VendorDetail/);
  
  // Verify profile loaded
  const hasContent = await page.getByText(/contact|book|reviews/i).first().isVisible().catch(() => false);
  expect(hasContent).toBeTruthy();
});