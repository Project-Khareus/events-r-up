import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  
  // Wait and accept cookie consent
  const acceptButton = page.getByText('Accept All');
  try {
    await acceptButton.click({ timeout: 3000 });
  } catch (e) {
    // Already accepted
  }
});

test('should search vendors', async ({ page }) => {
  const searchInput = page.getByPlaceholder(/search/i);
  await searchInput.fill('DJ');
  await page.waitForTimeout(1000);
  
  // Check if results updated or show relevant content
  const content = await page.textContent('body');
  const hasResults = content.includes('music') || content.includes('DJ') || content.includes('Music');
  expect(hasResults).toBeTruthy();
});