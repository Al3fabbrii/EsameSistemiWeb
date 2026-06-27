import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { WishlistPage } from './wishlist-page';
import { WishlistService } from '../../../core/services/wishlist';
import { CartService } from '../../../core/services/cart';
import { NotificationService } from '../../../core/services/notification.service';
import { Wishlist } from '../../../core/models/wishlist';
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

describe('WishlistPage', () => {
  let fixture: ComponentFixture<WishlistPage>;
  let component: WishlistPage;
  let wishlist: {
    loadWishlist: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    wishlist$: BehaviorSubject<Wishlist | null>;
  };
  let cart: { addItem: ReturnType<typeof vi.fn> };
  let notify: {
    showSuccess: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
    showInfo: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    wishlist = {
      loadWishlist: vi.fn().mockReturnValue(of({} as Wishlist)),
      removeItem: vi.fn().mockReturnValue(of({} as Wishlist)),
      wishlist$: new BehaviorSubject<Wishlist | null>(null),
    };
    cart = { addItem: vi.fn().mockReturnValue(of({})) };
    notify = { showSuccess: vi.fn(), showError: vi.fn(), showInfo: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [WishlistPage],
      providers: [
        { provide: WishlistService, useValue: wishlist },
        { provide: CartService, useValue: cart },
        { provide: NotificationService, useValue: notify },
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WishlistPage);
    component = fixture.componentInstance;
  });

  // ---------------------------------------------------------------------------
  // ngOnInit
  // ---------------------------------------------------------------------------

  // Verifica che ngOnInit carichi la wishlist.
  it('loads the wishlist on init', () => {
    component.ngOnInit();
    expect(wishlist.loadWishlist).toHaveBeenCalled();
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
  // removeItem
  // ---------------------------------------------------------------------------

  // Verifica che removeItem chiami WishlistService.removeItem con id come stringa.
  it('calls WishlistService.removeItem with id as string', () => {
    component.removeItem(42);
    expect(wishlist.removeItem).toHaveBeenCalledWith('42');
  });

  // Verifica che con successo venga mostrata una notifica info.
  it('shows info notification on successful remove', () => {
    component.removeItem(42);
    expect(notify.showInfo).toHaveBeenCalled();
  });

  // Verifica che con errore venga mostrata una notifica di errore.
  it('shows error notification when remove fails', () => {
    wishlist.removeItem.mockReturnValue(throwError(() => new Error('boom')));
    component.removeItem(42);
    expect(notify.showError).toHaveBeenCalled();
  });
});
