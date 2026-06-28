import { test, expect } from '@playwright/test';

/**
 * E2E — Authentication flows.
 *
 * Covers:
 * 1. Existing customer logs in and lands on /products with the auth icons visible
 * 2. A new visitor registers with a fresh email and lands on /products logged in
 *
 * Backend seed provides the customer at `user@example.com / password123`.
 */

test.describe('Authentication', () => {
  test('seeded customer can log in and reach the products page', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');

    await page.locator('form').getByRole('button', { name: /^Login$/ }).click();

    await expect(page).toHaveURL(/\/products$/);
    // Carrello icon is rendered only when authService.isLoggedIn is true.
    await expect(page.getByRole('button', { name: 'Carrello' })).toBeVisible();
  });

  test('new visitor can register and is redirected to products as a logged in user', async ({ page }) => {
    const uniqueEmail = `e2e-${Date.now()}@example.com`;

    await page.goto('/register');

    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password', { exact: true }).fill('password123');

    await page.locator('form').getByRole('button', { name: 'Registrati' }).click();

    await expect(page).toHaveURL(/\/products$/);
    // After register the header switches to the "logged in" set of icons.
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });
});
