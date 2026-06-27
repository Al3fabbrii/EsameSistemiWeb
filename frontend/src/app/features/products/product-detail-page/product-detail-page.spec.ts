import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ProductDetailPage } from './product-detail-page';
import { ProductApi } from '../../../core/services/product-api';
import { CartService } from '../../../core/services/cart';
import { WishlistService } from '../../../core/services/wishlist';
import { NotificationService } from '../../../core/services/notification.service';
import { Product } from '../../../core/models/product';

class FakeParamMap implements ParamMap {
  constructor(private data: Record<string, string>) {}
  get keys(): string[] {
    return Object.keys(this.data);
  }
  has(name: string): boolean {
    return name in this.data;
  }
  get(name: string): string | null {
    return this.data[name] ?? null;
  }
  getAll(name: string): string[] {
    const v = this.data[name];
    return v ? [v] : [];
  }
}

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

describe('ProductDetailPage', () => {
  let fixture: ComponentFixture<ProductDetailPage>;
  let component: ProductDetailPage;
  let api: { getById: ReturnType<typeof vi.fn> };
  let cart: { addItem: ReturnType<typeof vi.fn> };
  let wishlist: { addItem: ReturnType<typeof vi.fn> };
  let notify: {
    showSuccess: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    api = { getById: vi.fn().mockReturnValue(of(fakeProduct)) };
    cart = { addItem: vi.fn().mockReturnValue(of({})) };
    wishlist = { addItem: vi.fn().mockReturnValue(of({})) };
    notify = { showSuccess: vi.fn(), showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ProductDetailPage],
      providers: [
        { provide: ProductApi, useValue: api },
        { provide: CartService, useValue: cart },
        { provide: WishlistService, useValue: wishlist },
        { provide: NotificationService, useValue: notify },
        provideRouter([]),
        provideNoopAnimations(),
        // Mock di ActivatedRoute dopo provideRouter per vincere sull'override del router.
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(new FakeParamMap({ id: 'p1' })) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailPage);
    component = fixture.componentInstance;
  });

  // ---------------------------------------------------------------------------
  // product$ stream
  // ---------------------------------------------------------------------------

  // Verifica che product$ legga l'id dalla route e chiami ProductApi.getById.
  it('fetches product by id from the route parameters', () => {
    let result: Product | undefined;
    component.product$.subscribe(p => (result = p));

    expect(api.getById).toHaveBeenCalledWith('p1');
    expect(result).toEqual(fakeProduct);
  });

  // ---------------------------------------------------------------------------
  // addToCart
  // ---------------------------------------------------------------------------

  // Verifica che addToCart chiami CartService.addItem con id e quantity 1.
  it('calls CartService.addItem with product id and quantity 1', () => {
    component.addToCart(fakeProduct);
    expect(cart.addItem).toHaveBeenCalledWith('p1', 1);
  });

  // Verifica che con successo venga mostrata una notifica positiva.
  it('shows success notification on successful add to cart', () => {
    component.addToCart(fakeProduct);
    expect(notify.showSuccess).toHaveBeenCalled();
  });

  // Verifica che con errore venga usato il messaggio del backend se presente.
  it('shows backend error message when add to cart fails', () => {
    cart.addItem.mockReturnValue(throwError(() => ({ error: { error: 'No stock' } })));
    component.addToCart(fakeProduct);
    expect(notify.showError).toHaveBeenCalledWith('No stock');
  });

  // ---------------------------------------------------------------------------
  // addToWishlist
  // ---------------------------------------------------------------------------

  // Verifica che addToWishlist chiami WishlistService.addItem con l'id.
  it('calls WishlistService.addItem with the product id as string', () => {
    component.addToWishlist(fakeProduct);
    expect(wishlist.addItem).toHaveBeenCalledWith('p1');
  });

  // Verifica che con errore venga mostrata una notifica di errore.
  it('shows error notification when wishlist add fails', () => {
    wishlist.addItem.mockReturnValue(throwError(() => new Error('boom')));
    component.addToWishlist(fakeProduct);
    expect(notify.showError).toHaveBeenCalled();
  });
});
