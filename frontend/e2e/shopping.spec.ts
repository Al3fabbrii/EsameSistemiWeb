import { test, expect } from '@playwright/test';

/**
 * E2E — Full shopping flow.
 *
 * Covers the most valuable happy path of the application:
 * login → browse products → add to cart → checkout → order confirmation.
 *
 * This single test exercises:
 * - Auth interceptor (JWT propagation across requests)
 * - Cart persistence on the backend
 * - Checkout form validation
 * - Order creation transaction (stock decrement + cart emptying)
 */

test.describe('Shopping flow', () => {
  test('customer can browse, add to cart, and complete a purchase', async ({ page }) => {
    // -----------------------------------------------------------------------
    // 1. Login as the seeded customer
    // -----------------------------------------------------------------------
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.locator('form').getByRole('button', { name: /^Login$/ }).click();
    await expect(page).toHaveURL(/\/products$/);

    // -----------------------------------------------------------------------
    // 2. Add the first product card to the cart
    // -----------------------------------------------------------------------
    const firstCard = page.locator('app-product-card').first();
    await expect(firstCard).toBeVisible();
    await firstCard.getByRole('button', { name: 'Aggiungi al carrello' }).click();

    // -----------------------------------------------------------------------
    // 3. Navigate to /cart and verify there is at least one item
    // -----------------------------------------------------------------------
    await page.locator('mat-toolbar').getByRole('button', { name: 'Carrello', exact: true }).click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.locator('mat-card').first()).toBeVisible();

    // -----------------------------------------------------------------------
    // 4. Proceed to the checkout
    // -----------------------------------------------------------------------
    await page.getByRole('button', { name: /Procedi al Checkout/i }).click();
    await expect(page).toHaveURL(/\/checkout$/);

    // -----------------------------------------------------------------------
    // 5. Fill in the checkout form (formControlName is more stable than labels
    //    when the form has similar adjacent fields like "Nome" / "Cognome")
    // -----------------------------------------------------------------------
    await page.locator('input[formcontrolname=firstName]').fill('Mario');
    await page.locator('input[formcontrolname=lastName]').fill('Rossi');
    await page.locator('input[formcontrolname=email]').fill('mario@example.com');
    await page.locator('input[formcontrolname=street]').fill('Via Roma 1');
    await page.locator('input[formcontrolname=city]').fill('Milano');
    await page.locator('input[formcontrolname=zip]').fill('20100');
    await page.getByRole('checkbox').check();

    // -----------------------------------------------------------------------
    // 6. Submit and verify the success message
    // -----------------------------------------------------------------------
    await page.getByRole('button', { name: /Completa l'ordine/i }).click();
    await expect(page.getByText(/Ordine completato con successo/i)).toBeVisible({
      timeout: 15_000,
    });
  });
});
