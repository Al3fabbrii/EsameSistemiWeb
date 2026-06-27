import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ProductCard } from './product-card';
import { WishlistService } from '../../../core/services/wishlist';
import { NotificationService } from '../../../core/services/notification.service';
import { Product } from '../../../core/models/product';

const fakeProduct: Product = {
  id: 'p1',
  title: 'Test Product',
  description: 'A test',
  price: 10,
  originalPrice: 15,
  sale: false,
  stock: 100,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('ProductCard', () => {
  let fixture: ComponentFixture<ProductCard>;
  let component: ProductCard;
  let wishlist: { addItem: ReturnType<typeof vi.fn> };
  let notify: {
    showSuccess: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    wishlist = { addItem: vi.fn().mockReturnValue(of({})) };
    notify = { showSuccess: vi.fn(), showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ProductCard],
      providers: [
        { provide: WishlistService, useValue: wishlist },
        { provide: NotificationService, useValue: notify },
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCard);
    component = fixture.componentInstance;
    component.product = fakeProduct;
    fixture.detectChanges();
  });

  // Verifica che il componente possa essere creato.
  it('creates', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // addToCart
  // ---------------------------------------------------------------------------

  // Verifica che addToCart emetta l'evento 'add' con il prodotto.
  it('emits add event with the product when addToCart is called', () => {
    let emitted: Product | undefined;
    component.add.subscribe(p => (emitted = p));

    component.addToCart(fakeProduct);

    expect(emitted).toEqual(fakeProduct);
  });

  // ---------------------------------------------------------------------------
  // addToWishlist (branch coverage)
  // ---------------------------------------------------------------------------

  // Verifica che addToWishlist chiami WishlistService.addItem con l'id.
  it('calls WishlistService.addItem with the product id', () => {
    component.addToWishlist(fakeProduct);
    expect(wishlist.addItem).toHaveBeenCalledWith('p1');
  });

  // Verifica che addToWishlist con successo mostri una notifica di successo.
  it('shows a success notification when item is added to wishlist', () => {
    component.addToWishlist(fakeProduct);
    expect(notify.showSuccess).toHaveBeenCalledWith(expect.stringContaining(fakeProduct.title));
  });

  // Verifica che addToWishlist con errore mostri una notifica di errore.
  it('shows an error notification when wishlist add fails', () => {
    wishlist.addItem.mockReturnValue(throwError(() => new Error('boom')));
    component.addToWishlist(fakeProduct);
    expect(notify.showError).toHaveBeenCalled();
  });
});
