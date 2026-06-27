import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AdminProductsPage } from './admin-products-page';
import { AdminProductApi } from '../../../core/services/admin-product-api';
import { NotificationService } from '../../../core/services/notification.service';
import { Product } from '../../../core/models/product';

const fakeProduct: Product = {
  id: 'p1',
  title: 'Test Product',
  description: '',
  price: 10,
  originalPrice: 15,
  sale: false,
  stock: 100,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('AdminProductsPage', () => {
  let fixture: ComponentFixture<AdminProductsPage>;
  let component: AdminProductsPage;
  let api: {
    list: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let notify: {
    showSuccess: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    api = {
      list: vi.fn().mockReturnValue(of([fakeProduct])),
      create: vi.fn().mockReturnValue(of(fakeProduct)),
      update: vi.fn().mockReturnValue(of(fakeProduct)),
      delete: vi.fn().mockReturnValue(of(undefined)),
    };
    dialog = { open: vi.fn() };
    notify = { showSuccess: vi.fn(), showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AdminProductsPage],
      providers: [
        { provide: AdminProductApi, useValue: api },
        { provide: MatDialog, useValue: dialog },
        { provide: NotificationService, useValue: notify },
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProductsPage);
    component = fixture.componentInstance;
  });

  // ---------------------------------------------------------------------------
  // ngOnInit / loadProducts
  // ---------------------------------------------------------------------------

  // Verifica che ngOnInit chiami list e popoli l'array products.
  it('loads products on init', () => {
    component.ngOnInit();
    expect(api.list).toHaveBeenCalled();
    expect(component.products).toEqual([fakeProduct]);
  });

  // Verifica che in caso di errore di list venga mostrata una notifica.
  it('shows error notification when list fails', () => {
    api.list.mockReturnValue(throwError(() => new Error('boom')));
    component.ngOnInit();
    expect(notify.showError).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // openCreateDialog
  // ---------------------------------------------------------------------------

  // Verifica che se il dialog viene chiuso senza payload non venga chiamato create.
  it('does not create product when create dialog is dismissed without payload', () => {
    dialog.open.mockReturnValue({ afterClosed: () => of(undefined) });

    component.openCreateDialog();

    expect(api.create).not.toHaveBeenCalled();
  });

  // Verifica che con payload valido il create venga eseguito e ricaricati i prodotti.
  it('creates the product and reloads list when dialog returns a payload', () => {
    const payload = { title: 'New', description: '', price: 10, original_price: 15, sale: false, thumbnail: '', stock: 1, tags: [] };
    dialog.open.mockReturnValue({ afterClosed: () => of(payload) });
    api.list.mockClear();

    component.openCreateDialog();

    expect(api.create).toHaveBeenCalledWith(payload);
    expect(notify.showSuccess).toHaveBeenCalled();
    expect(api.list).toHaveBeenCalled();
  });

  // Verifica che in caso di errore in create venga mostrata una notifica di errore.
  it('shows error notification when product creation fails', () => {
    dialog.open.mockReturnValue({ afterClosed: () => of({ title: 'X' }) });
    api.create.mockReturnValue(throwError(() => new Error('boom')));

    component.openCreateDialog();

    expect(notify.showError).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // openEditDialog
  // ---------------------------------------------------------------------------

  // Verifica che se il dialog viene chiuso senza payload non venga chiamato update.
  it('does not update product when edit dialog is dismissed without payload', () => {
    dialog.open.mockReturnValue({ afterClosed: () => of(undefined) });

    component.openEditDialog(fakeProduct);

    expect(api.update).not.toHaveBeenCalled();
  });

  // Verifica che con payload valido venga eseguito update con l'id del prodotto.
  it('updates the product with returned payload and reloads list', () => {
    const payload = { price: 99 };
    dialog.open.mockReturnValue({ afterClosed: () => of(payload) });
    api.list.mockClear();

    component.openEditDialog(fakeProduct);

    expect(api.update).toHaveBeenCalledWith('p1', payload);
    expect(notify.showSuccess).toHaveBeenCalled();
    expect(api.list).toHaveBeenCalled();
  });

  // Verifica che in caso di errore in update venga mostrata una notifica di errore.
  it('shows error notification when update fails', () => {
    dialog.open.mockReturnValue({ afterClosed: () => of({ price: 99 }) });
    api.update.mockReturnValue(throwError(() => new Error('boom')));

    component.openEditDialog(fakeProduct);

    expect(notify.showError).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // deleteProduct
  // ---------------------------------------------------------------------------

  // Verifica che se l'utente annulla la conferma non venga chiamata l'API delete.
  it('does not delete product when user cancels the confirm dialog', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.deleteProduct(fakeProduct);

    expect(api.delete).not.toHaveBeenCalled();
  });

  // Verifica che con conferma positiva venga chiamata l'API delete con id.
  it('deletes the product and reloads list when user confirms', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.list.mockClear();

    component.deleteProduct(fakeProduct);

    expect(api.delete).toHaveBeenCalledWith('p1');
    expect(notify.showSuccess).toHaveBeenCalled();
    expect(api.list).toHaveBeenCalled();
  });

  // Verifica che un errore nel delete mostri una notifica di errore.
  it('shows error notification when delete fails', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.delete.mockReturnValue(throwError(() => new Error('boom')));

    component.deleteProduct(fakeProduct);

    expect(notify.showError).toHaveBeenCalled();
  });
});
