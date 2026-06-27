import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { CheckoutPage } from './checkout-page';
import { CartService } from '../../../core/services/cart';
import { OrderService } from '../../../core/services/order-service';
import { NotificationService } from '../../../core/services/notification.service';
import { Cart, CartItem } from '../../../core/models/cart';
import { Product } from '../../../core/models/product';

const fakeProduct: Product = {
  id: 'p1',
  title: 'Laptop',
  description: '',
  price: 100,
  originalPrice: 120,
  sale: false,
  stock: 5,
  createdAt: '2026-01-01T00:00:00Z',
};

const fakeItem: CartItem = {
  id: 1,
  cartId: 1,
  productId: 'p1',
  product: fakeProduct,
  quantity: 2,
  unitPrice: 100,
  subtotal: 200,
};

const fakeCart: Cart = {
  id: 1,
  userId: 1,
  items: [fakeItem],
  total: 200,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const validForm = {
  customer: { firstName: 'Mario', lastName: 'Rossi', email: 'm@r.it' },
  address: { street: 'Via Roma 1', city: 'Milano', zip: '20100' },
  shippingMethod: 'standard',
  privacy: true,
};

describe('CheckoutPage', () => {
  let fixture: ComponentFixture<CheckoutPage>;
  let component: CheckoutPage;
  let cart$: BehaviorSubject<Cart | null>;
  let cart: { loadCart: ReturnType<typeof vi.fn>; cart$: BehaviorSubject<Cart | null> };
  let order: { create: ReturnType<typeof vi.fn> };
  let notify: { showError: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    cart$ = new BehaviorSubject<Cart | null>(fakeCart);
    cart = {
      loadCart: vi.fn().mockReturnValue(of(fakeCart)),
      cart$,
    };
    order = { create: vi.fn().mockReturnValue(of({ ...fakeCart })) };
    notify = { showError: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CheckoutPage],
      providers: [
        { provide: CartService, useValue: cart },
        { provide: OrderService, useValue: order },
        { provide: NotificationService, useValue: notify },
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ---------------------------------------------------------------------------
  // ngOnInit
  // ---------------------------------------------------------------------------

  // Verifica che ngOnInit carichi il carrello.
  it('loads the cart on init', () => {
    expect(cart.loadCart).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Form validation
  // ---------------------------------------------------------------------------

  // Verifica che il form sia inizialmente invalido.
  it('initializes with an invalid form', () => {
    expect(component.form.invalid).toBe(true);
  });

  // Verifica che CAP a 4 cifre non passi la validazione del pattern.
  it('marks form invalid when zip is not 5 digits', () => {
    component.form.patchValue({ ...validForm, address: { ...validForm.address, zip: '1234' } });
    expect(component.form.invalid).toBe(true);
  });

  // Verifica che privacy=false renda il form non valido.
  it('marks form invalid when privacy checkbox is not accepted', () => {
    component.form.patchValue({ ...validForm, privacy: false });
    expect(component.form.invalid).toBe(true);
  });

  // Verifica che con tutti i campi corretti il form sia valido.
  it('marks form valid when all fields are correctly filled', () => {
    component.form.patchValue(validForm);
    expect(component.form.valid).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // hasError helper
  // ---------------------------------------------------------------------------

  // Verifica che hasError ritorni true quando un campo touched ha un errore.
  it('hasError returns true when control is touched and has the specified error', () => {
    const email = component.form.get('customer.email')!;
    email.setValue('not-an-email');
    email.markAsTouched();

    expect(component.hasError('customer.email', 'email')).toBe(true);
  });

  // Verifica che hasError sia false su campo non touched.
  it('hasError returns false when control has the error but is not touched', () => {
    const email = component.form.get('customer.email')!;
    email.setValue('not-an-email');

    expect(component.hasError('customer.email', 'email')).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // onSubmit — invalid form
  // ---------------------------------------------------------------------------

  // Verifica che onSubmit su form invalido NON chiami orderService.create.
  it('does not create order when form is invalid', () => {
    component.onSubmit();
    expect(order.create).not.toHaveBeenCalled();
  });

  // Verifica che onSubmit su form invalido marchi i campi come touched.
  it('marks all controls as touched when submitting an invalid form', () => {
    component.onSubmit();
    expect(component.form.get('customer.email')!.touched).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // onSubmit — success path
  // ---------------------------------------------------------------------------

  // Verifica che onSubmit con form valido chiami orderService.create con i dati.
  it('creates an order with form values when valid', () => {
    component.form.patchValue(validForm);
    component.onSubmit();

    expect(order.create).toHaveBeenCalled();
    const payload = order.create.mock.calls[0][0];
    expect(payload.customer.firstName).toBe('Mario');
    expect(payload.address.zip).toBe('20100');
    expect(payload.total).toBe(200);
  });

  // Verifica che dopo creazione con successo orderSuccess sia true e form resettato.
  it('sets orderSuccess and resets form on successful order creation', () => {
    component.form.patchValue(validForm);
    component.onSubmit();

    expect(component.orderSuccess).toBe(true);
    expect(component.loading).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // onSubmit — error path
  // ---------------------------------------------------------------------------

  // Verifica che in caso di errore venga impostato orderError e mostrata una notifica.
  it('sets orderError and shows notification on order creation failure', () => {
    order.create.mockReturnValue(throwError(() => ({ error: { error: 'Stock insufficient' } })));
    component.form.patchValue(validForm);
    component.onSubmit();

    expect(component.orderError).toBe(true);
    expect(component.loading).toBe(false);
    expect(notify.showError).toHaveBeenCalledWith('Stock insufficient');
  });
});
