import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { vi } from 'vitest';

import { AdminProductDialog, AdminProductDialogData } from './admin-product-dialog';
import { Product } from '../../../core/models/product';

const fakeProduct: Product = {
  id: 'p1',
  title: 'Existing',
  description: 'desc',
  price: 10,
  originalPrice: 15,
  sale: false,
  thumbnail: '',
  stock: 5,
  tags: ['a', 'b'],
  createdAt: '2026-01-01T00:00:00Z',
};

function setup(data: AdminProductDialogData) {
  const dialogRef = { close: vi.fn() };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [AdminProductDialog],
    providers: [
      { provide: MatDialogRef, useValue: dialogRef },
      { provide: MAT_DIALOG_DATA, useValue: data },
      provideNoopAnimations(),
    ],
  });

  const fixture = TestBed.createComponent(AdminProductDialog);
  fixture.detectChanges();
  return { fixture, dialogRef, component: fixture.componentInstance };
}

describe('AdminProductDialog', () => {
  // ---------------------------------------------------------------------------
  // isEdit (branch coverage)
  // ---------------------------------------------------------------------------

  // Verifica che isEdit sia false quando data.product è assente.
  it('isEdit is false when no product is passed', () => {
    const { component } = setup({});
    expect(component.isEdit).toBe(false);
  });

  // Verifica che isEdit sia true quando data.product è passato.
  it('isEdit is true when a product is passed', () => {
    const { component } = setup({ product: fakeProduct });
    expect(component.isEdit).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Form prefill
  // ---------------------------------------------------------------------------

  // Verifica che il form sia inizializzato vuoto in modalità create.
  it('initializes empty form in create mode', () => {
    const { component } = setup({});
    expect(component.form.value.title).toBe('');
    expect(component.form.value.price).toBeNull();
  });

  // Verifica che in edit mode i campi vengano precompilati dal prodotto.
  it('prefills form fields from product in edit mode', () => {
    const { component } = setup({ product: fakeProduct });
    expect(component.form.value.title).toBe('Existing');
    expect(component.form.value.price).toBe(10);
    expect(component.form.value.tags).toBe('a, b');
  });

  // ---------------------------------------------------------------------------
  // Form validation
  // ---------------------------------------------------------------------------

  // Verifica che il form sia invalido se title è troppo corto.
  it('marks form invalid when title is shorter than 2 characters', () => {
    const { component } = setup({});
    component.form.patchValue({
      title: 'a',
      description: 'd',
      price: 10,
      original_price: 15,
      stock: 1,
    });
    expect(component.form.invalid).toBe(true);
  });

  // Verifica che il form sia invalido se price è <= 0.
  it('marks form invalid when price is zero or negative', () => {
    const { component } = setup({});
    component.form.patchValue({
      title: 'Valid',
      description: 'd',
      price: 0,
      original_price: 15,
      stock: 1,
    });
    expect(component.form.invalid).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // submit
  // ---------------------------------------------------------------------------

  // Verifica che submit con form invalido NON chiuda il dialog.
  it('does not close dialog when form is invalid', () => {
    const { component, dialogRef } = setup({});
    component.submit();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  // Verifica che submit chiuda il dialog con il payload normalizzato.
  it('closes dialog with normalized payload when form is valid', () => {
    const { component, dialogRef } = setup({});
    component.form.patchValue({
      title: 'New product',
      description: 'desc',
      price: 10,
      original_price: 15,
      stock: 1,
      tags: 'electronics, phone',
    });

    component.submit();

    expect(dialogRef.close).toHaveBeenCalledTimes(1);
    const payload = dialogRef.close.mock.calls[0][0];
    expect(payload.title).toBe('New product');
    expect(payload.tags).toEqual(['electronics', 'phone']);
    expect(payload.price).toBe(10);
  });

  // Verifica che tag vuoti vengano filtrati.
  it('filters out empty tags', () => {
    const { component, dialogRef } = setup({});
    component.form.patchValue({
      title: 'Valid',
      description: 'd',
      price: 1,
      original_price: 1,
      stock: 1,
      tags: 'a, , b, ',
    });

    component.submit();

    const payload = dialogRef.close.mock.calls[0][0];
    expect(payload.tags).toEqual(['a', 'b']);
  });

  // ---------------------------------------------------------------------------
  // cancel
  // ---------------------------------------------------------------------------

  // Verifica che cancel chiuda il dialog senza payload.
  it('closes dialog with no payload when cancel is called', () => {
    const { component, dialogRef } = setup({});
    component.cancel();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
