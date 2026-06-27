import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { PageEvent } from '@angular/material/paginator';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ProductPage } from './product-page';
import { ProductApi } from '../../../core/services/product-api';
import { CartService } from '../../../core/services/cart';
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

describe('ProductPage', () => {
  let fixture: ComponentFixture<ProductPage>;
  let component: ProductPage;
  let api: { list: ReturnType<typeof vi.fn> };
  let cart: { addItem: ReturnType<typeof vi.fn> };
  let notify: {
    showSuccess: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    api = { list: vi.fn().mockReturnValue(of([fakeProduct])) };
    cart = { addItem: vi.fn().mockReturnValue(of({})) };
    notify = { showSuccess: vi.fn(), showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ProductPage],
      providers: [
        { provide: ProductApi, useValue: api },
        { provide: CartService, useValue: cart },
        { provide: NotificationService, useValue: notify },
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductPage);
    component = fixture.componentInstance;
  });

  // Verifica che il componente possa essere creato.
  it('creates', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // onAddToCart
  // ---------------------------------------------------------------------------

  // Verifica che onAddToCart chiami CartService.addItem con id e quantity 1.
  it('calls CartService.addItem with product id and quantity 1', () => {
    component.onAddToCart(fakeProduct);
    expect(cart.addItem).toHaveBeenCalledWith('p1', 1);
  });

  // Verifica che onAddToCart con successo mostri una notifica.
  it('shows success notification on successful add to cart', () => {
    component.onAddToCart(fakeProduct);
    expect(notify.showSuccess).toHaveBeenCalled();
  });

  // Verifica che onAddToCart con errore mostri una notifica di errore.
  it('shows error notification when add to cart fails', () => {
    cart.addItem.mockReturnValue(throwError(() => new Error('boom')));
    component.onAddToCart(fakeProduct);
    expect(notify.showError).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // onPage
  // ---------------------------------------------------------------------------

  // Verifica che onPage aggiorni la pagina corrente (1-based).
  it('updates current page (1-based) when onPage receives an event', () => {
    const evt = { pageIndex: 2 } as PageEvent;
    component.onPage(evt);

    let page = 0;
    component.page$.subscribe(p => (page = p));
    expect(page).toBe(3);
  });
});
