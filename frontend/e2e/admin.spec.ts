import { test, expect } from '@playwright/test';

/**
 * E2E — Admin product management.
 *
 * One rich test that exercises the full CRUD lifecycle as the admin user:
 * create → verify → edit → verify → delete → verify.
 *
 * Why a single test (not 4 separate ones):
 *   - The admin actions share state (a product created in step 1 is the
 *     subject of steps 2, 3, 4). Splitting them would require persisting state
 *     across tests, which conflicts with the serial+isolated philosophy.
 */

test.describe('Admin product CRUD', () => {
  test('admin can create, update and delete a product', async ({ page }) => {
    // -----------------------------------------------------------------------
    // Login as admin
    // -----------------------------------------------------------------------
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password', { exact: true }).fill('admin123');
    await page.locator('form').getByRole('button', { name: /^Login$/ }).click();
    await expect(page).toHaveURL(/\/products$/);

    // -----------------------------------------------------------------------
    // Open the admin panel
    // -----------------------------------------------------------------------
    await page.getByRole('button', { name: 'Pannello Admin' }).click();
    await expect(page).toHaveURL(/\/admin\/products$/);
    await expect(page.getByRole('heading', { name: 'Gestione Prodotti' })).toBeVisible();

    // -----------------------------------------------------------------------
    // CREATE — open the dialog and submit a new product
    // -----------------------------------------------------------------------
    const productTitle = `E2E Product ${Date.now()}`;

    await page.getByRole('button', { name: /Nuovo prodotto/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Use formControlName selectors — more stable than label text with currency
    // symbols, which can be HTML-encoded by Material's mat-form-field.
    await dialog.locator('input[formcontrolname=title]').fill(productTitle);
    await dialog.locator('textarea[formcontrolname=description]').fill('Created by Playwright E2E');
    await dialog.locator('input[formcontrolname=price]').fill('99.99');
    await dialog.locator('input[formcontrolname=original_price]').fill('120.00');
    await dialog.locator('input[formcontrolname=stock]').fill('50');

    // Submit, then wait both for the POST (create) and the GET (list refresh)
    // that the parent component fires in its .next() handler.
    const createResponse = page.waitForResponse(
      r => r.url().endsWith('/api/admin/products') && r.request().method() === 'POST',
    );
    const listResponse = page.waitForResponse(
      r => r.url().endsWith('/api/admin/products') && r.request().method() === 'GET',
    );
    await dialog.getByRole('button', { name: 'Crea prodotto' }).click();

    expect((await createResponse).status()).toBe(201);
    expect((await listResponse).status()).toBe(200);
    await expect(dialog).toBeHidden({ timeout: 10_000 });

    // The new product must appear in the table (MatTable renderRows() in
    // loadProducts() should have triggered the re-render).
    await expect(page.getByRole('cell', { name: productTitle })).toBeVisible({
      timeout: 10_000,
    });

    // -----------------------------------------------------------------------
    // UPDATE — click "Modifica" on the new row, change the price
    // -----------------------------------------------------------------------
    const productRow = page.getByRole('row', { name: new RegExp(productTitle) });
    await productRow.getByRole('button', { name: 'Modifica' }).click();
    const editDialog = page.getByRole('dialog');
    await expect(editDialog).toBeVisible();

    await editDialog.locator('input[formcontrolname=price]').fill('49.99');
    const updateResponse = page.waitForResponse(
      r => r.url().includes('/api/admin/products/') && r.request().method() === 'PATCH',
    );
    const listAfterUpdate = page.waitForResponse(
      r => r.url().endsWith('/api/admin/products') && r.request().method() === 'GET',
    );
    await editDialog.getByRole('button', { name: 'Salva modifiche' }).click();
    expect((await updateResponse).status()).toBe(200);
    expect((await listAfterUpdate).status()).toBe(200);
    await expect(editDialog).toBeHidden({ timeout: 10_000 });

    // The price cell of the row must show the new value.
    const updatedRow = page.getByRole('row', { name: new RegExp(productTitle) });
    await expect(updatedRow.getByText(/49,99|49\.99/)).toBeVisible({
      timeout: 10_000,
    });

    // -----------------------------------------------------------------------
    // DELETE — click "Elimina", confirm the native confirm() dialog
    // -----------------------------------------------------------------------
    // The component uses window.confirm() — intercept it before clicking.
    page.once('dialog', d => d.accept());
    const deleteResponse = page.waitForResponse(
      r => r.url().includes('/api/admin/products/') && r.request().method() === 'DELETE',
    );
    const listAfterDelete = page.waitForResponse(
      r => r.url().endsWith('/api/admin/products') && r.request().method() === 'GET',
    );
    await updatedRow.getByRole('button', { name: 'Elimina' }).click();
    expect((await deleteResponse).status()).toBe(204);
    expect((await listAfterDelete).status()).toBe(200);

    // The product must disappear from the table.
    await expect(page.getByRole('cell', { name: productTitle })).toHaveCount(0, {
      timeout: 10_000,
    });
  });
});
