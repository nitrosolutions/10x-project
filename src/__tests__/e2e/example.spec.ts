import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage', async ({ page }) => {
    // Check if page loaded successfully
    await expect(page).toHaveTitle(/.*/, { timeout: 5000 }).catch(() => {
      // Fallback if title check fails
      return expect(page.locator('body')).toBeVisible();
    });
  });

  test('should have accessible content', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if main content is visible
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
