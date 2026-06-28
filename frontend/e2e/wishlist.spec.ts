import { test, expect } from '@playwright/test';

/**
 * E2E — Wishlist flows.
 *
 * Covers:
 * 1. A logged in customer can add a product to the wishlist from the catalogue
 *    and find it in /wishlist
 * 2. The same customer can remove the item, leaving the empty-state visible
 */

test.describe('Wishlist', () => {
  test.beforeEach(async ({ page }) => {
    // Each test starts with a fresh login. Cookies/localStorage are isolated per
    // browser context by default, so this keeps tests independent.
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.locator('form').getByRole('button', { name: /^Login$/ }).click();
    await expect(page).toHaveURL(/\/products$/);
  });

  test('customer can add a product to the wishlist', async ({ page }) => {
    const firstCard = page.locator('app-product-card').first();
    const productTitle = await firstCard.locator('.title').textContent();

    await firstCard.getByRole('button', { name: 'Aggiungi ai preferiti' }).click();

    await page.getByRole('button', { name: 'Lista desideri' }).click();
    await expect(page).toHaveURL(/\/wishlist$/);

    // The product just added must appear in the wishlist page.
    await expect(page.getByRole('heading', { name: productTitle!.trim() })).toBeVisible();
  });

  test('customer can remove a product from the wishlist', async ({ page }) => {
    // Prepare: add one item so we have something to remove.
    const firstCard = page.locator('app-product-card').first();
    await firstCard.getByRole('button', { name: 'Aggiungi ai preferiti' }).click();

    await page.getByRole('button', { name: 'Lista desideri' }).click();
    await expect(page).toHaveURL(/\/wishlist$/);

    // Act: remove the first wishlist card.
    await page.getByRole('button', { name: 'Rimuovi' }).first().click();

    // Assert: the empty-state copy is shown.
    await expect(page.getByText(/Non ci sono prodotti salvati/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
