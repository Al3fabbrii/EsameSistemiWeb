import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { CartPage } from './cart-page';
import { CartService } from '../../../core/services/cart';
import { NotificationService } from '../../../core/services/notification.service';
import { Cart, CartItem } from '../../../core/models/cart';

describe('CartPage', () => {
  let fixture: ComponentFixture<CartPage>;
  let component: CartPage;
  let cart: {
    loadCart: ReturnType<typeof vi.fn>;
    updateItem: ReturnType<typeof vi.fn>;
    removeItem: ReturnType<typeof vi.fn>;
    cart$: BehaviorSubject<Cart | null>;
  };
  let notify: { showError: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    cart = {
      loadCart: vi.fn().mockReturnValue(of({} as Cart)),
      updateItem: vi.fn().mockReturnValue(of({} as Cart)),
      removeItem: vi.fn().mockReturnValue(of({} as Cart)),
      cart$: new BehaviorSubject<Cart | null>(null),
    };
    notify = { showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CartPage],
      providers: [
        { provide: CartService, useValue: cart },
        { provide: NotificationService, useValue: notify },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CartPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  // ---------------------------------------------------------------------------
  // ngOnInit
  // ---------------------------------------------------------------------------

  // Verifica che ngOnInit chiami loadCart per inizializzare il carrello.
  it('loads the cart on init', () => {
    component.ngOnInit();
    expect(cart.loadCart).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // goToCheckout
  // ---------------------------------------------------------------------------

  // Verifica che goToCheckout navighi a /checkout.
  it('navigates to /checkout when goToCheckout is called', () => {
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.goToCheckout();
    expect(navSpy).toHaveBeenCalledWith(['/checkout']);
  });

  // ---------------------------------------------------------------------------
  // increaseQuantity
  // ---------------------------------------------------------------------------

  // Verifica che increaseQuantity incrementi la quantity di 1.
  it('increases item quantity by 1', () => {
    component.increaseQuantity({ id: 5, quantity: 2 } as CartItem);
    expect(cart.updateItem).toHaveBeenCalledWith(5, 3);
  });

  // Verifica che in caso di errore venga mostrata una notifica e ricaricato il carrello.
  it('shows error notification and reloads cart on increase failure', () => {
    cart.updateItem.mockReturnValue(throwError(() => ({ error: { error: 'Stock limit' } })));

    component.increaseQuantity({ id: 5, quantity: 2 } as CartItem);

    expect(notify.showError).toHaveBeenCalledWith('Stock limit');
    expect(cart.loadCart).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // decreaseQuantity (branch coverage)
  // ---------------------------------------------------------------------------

  // Verifica che decreaseQuantity non chiami updateItem se quantity = 1.
  it('does not decrease quantity below 1', () => {
    component.decreaseQuantity({ id: 5, quantity: 1 } as CartItem);
    expect(cart.updateItem).not.toHaveBeenCalled();
  });

  // Verifica che decreaseQuantity decrementi quando quantity > 1.
  it('decreases item quantity by 1 when above 1', () => {
    component.decreaseQuantity({ id: 5, quantity: 3 } as CartItem);
    expect(cart.updateItem).toHaveBeenCalledWith(5, 2);
  });

  // Verifica che in caso di errore decreaseQuantity notifichi e ricarichi.
  it('shows error notification and reloads cart on decrease failure', () => {
    cart.updateItem.mockReturnValue(throwError(() => ({})));

    component.decreaseQuantity({ id: 5, quantity: 3 } as CartItem);

    expect(notify.showError).toHaveBeenCalled();
    expect(cart.loadCart).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // removeItem
  // ---------------------------------------------------------------------------

  // Verifica che removeItem chiami CartService.removeItem con l'id dell'item.
  it('removes the item by id', () => {
    component.removeItem({ id: 42 } as CartItem);
    expect(cart.removeItem).toHaveBeenCalledWith(42);
  });
});
