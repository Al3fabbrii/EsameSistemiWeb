import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { CartService } from './cart';
import { Cart } from '../models/cart';
import { Product } from '../models/product';

const BASE_URL = 'http://localhost:3000/api/cart';

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

const fakeCart: Cart = {
  id: 1,
  userId: 1,
  items: [
    {
      id: 1,
      cartId: 1,
      productId: 'p1',
      product: fakeProduct,
      quantity: 2,
      unitPrice: 10,
      subtotal: 20,
    },
  ],
  total: 20,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const emptyCart: Cart = { ...fakeCart, items: [], total: 0 };

describe('CartService', () => {
  let service: CartService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CartService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ---------------------------------------------------------------------------
  // loadCart
  // ---------------------------------------------------------------------------

  // Verifica che loadCart invii una GET a /api/cart.
  it('loadCart issues GET /api/cart', () => {
    service.loadCart().subscribe();

    const req = http.expectOne(BASE_URL);
    expect(req.request.method).toBe('GET');
    req.flush(fakeCart);
  });

  // Verifica che il risultato di loadCart venga emesso da cart$.
  it('loadCart emits the fetched cart via cart$', () => {
    let emitted: Cart | null = null;
    service.cart$.subscribe(c => (emitted = c));

    service.loadCart().subscribe();
    http.expectOne(BASE_URL).flush(fakeCart);

    expect(emitted).toEqual(fakeCart);
  });

  // ---------------------------------------------------------------------------
  // addItem
  // ---------------------------------------------------------------------------

  // Verifica che addItem POSTi product_id e quantity di default.
  it('addItem POSTs product_id with default quantity 1', () => {
    service.addItem('p1').subscribe();

    const req = http.expectOne(`${BASE_URL}/items`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ product_id: 'p1', quantity: 1 });
    req.flush(fakeCart);
  });

  // Verifica che addItem usi la quantity passata in input.
  it('addItem POSTs the given quantity when provided', () => {
    service.addItem('p1', 5).subscribe();

    const req = http.expectOne(`${BASE_URL}/items`);
    expect(req.request.body).toEqual({ product_id: 'p1', quantity: 5 });
    req.flush(fakeCart);
  });

  // Verifica che addItem emetta il carrello aggiornato via cart$.
  it('addItem emits the updated cart via cart$', () => {
    let emitted: Cart | null = null;
    service.cart$.subscribe(c => (emitted = c));

    service.addItem('p1').subscribe();
    http.expectOne(`${BASE_URL}/items`).flush(fakeCart);

    expect(emitted).toEqual(fakeCart);
  });

  // ---------------------------------------------------------------------------
  // updateItem
  // ---------------------------------------------------------------------------

  // Verifica che updateItem PATCHi la quantity all'item indicato.
  it('updateItem PATCHes /api/cart/items/:id with new quantity', () => {
    service.updateItem(42, 7).subscribe();

    const req = http.expectOne(`${BASE_URL}/items/42`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ quantity: 7 });
    req.flush(fakeCart);
  });

  // Verifica che updateItem emetta il carrello aggiornato.
  it('updateItem emits the updated cart via cart$', () => {
    let emitted: Cart | null = null;
    service.cart$.subscribe(c => (emitted = c));

    service.updateItem(1, 3).subscribe();
    http.expectOne(`${BASE_URL}/items/1`).flush(fakeCart);

    expect(emitted).toEqual(fakeCart);
  });

  // ---------------------------------------------------------------------------
  // removeItem
  // ---------------------------------------------------------------------------

  // Verifica che removeItem invii DELETE /api/cart/items/:id.
  it('removeItem issues DELETE /api/cart/items/:id', () => {
    service.removeItem(99).subscribe();

    const req = http.expectOne(`${BASE_URL}/items/99`);
    expect(req.request.method).toBe('DELETE');
    req.flush(emptyCart);
  });

  // Verifica che removeItem emetta il carrello aggiornato.
  it('removeItem emits the updated cart via cart$', () => {
    let emitted: Cart | null = null;
    service.cart$.subscribe(c => (emitted = c));

    service.removeItem(1).subscribe();
    http.expectOne(`${BASE_URL}/items/1`).flush(emptyCart);

    expect(emitted).toEqual(emptyCart);
  });

  // ---------------------------------------------------------------------------
  // itemCount getter (branch coverage)
  // ---------------------------------------------------------------------------

  // Verifica che itemCount sia 0 quando il carrello non è ancora caricato.
  it('itemCount returns 0 when cart is not loaded', () => {
    expect(service.itemCount).toBe(0);
  });

  // Verifica che itemCount sia 0 quando il carrello è vuoto.
  it('itemCount returns 0 when cart has no items', () => {
    service.loadCart().subscribe();
    http.expectOne(BASE_URL).flush(emptyCart);

    expect(service.itemCount).toBe(0);
  });

  // Verifica che itemCount somma le quantity di tutti gli item.
  it('itemCount returns the sum of all item quantities', () => {
    const multiItemCart: Cart = {
      ...fakeCart,
      items: [
        { ...fakeCart.items[0], id: 1, quantity: 2 },
        { ...fakeCart.items[0], id: 2, quantity: 3 },
      ],
    };

    service.loadCart().subscribe();
    http.expectOne(BASE_URL).flush(multiItemCart);

    expect(service.itemCount).toBe(5);
  });

  // ---------------------------------------------------------------------------
  // total getter (branch coverage)
  // ---------------------------------------------------------------------------

  // Verifica che total sia 0 quando il carrello non è caricato.
  it('total returns 0 when cart is not loaded', () => {
    expect(service.total).toBe(0);
  });

  // Verifica che total restituisca il campo total del carrello.
  it('total returns the cart.total when cart is loaded', () => {
    service.loadCart().subscribe();
    http.expectOne(BASE_URL).flush(fakeCart);

    expect(service.total).toBe(20);
  });
});
