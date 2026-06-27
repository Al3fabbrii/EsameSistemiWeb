import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { WishlistService } from './wishlist';
import { Wishlist } from '../models/wishlist';
import { Product } from '../models/product';

const BASE_URL = 'http://localhost:3000/api/wishlist';

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

const fakeWishlist: Wishlist = {
  id: 1,
  userId: 1,
  items: [{ id: 1, wishlistId: 1, productId: 'p1', product: fakeProduct }],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const emptyWishlist: Wishlist = { ...fakeWishlist, items: [] };

describe('WishlistService', () => {
  let service: WishlistService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WishlistService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ---------------------------------------------------------------------------
  // loadWishlist
  // ---------------------------------------------------------------------------

  // Verifica che loadWishlist invii una GET a /api/wishlist.
  it('loadWishlist issues GET /api/wishlist', () => {
    service.loadWishlist().subscribe();

    const req = http.expectOne(BASE_URL);
    expect(req.request.method).toBe('GET');
    req.flush(fakeWishlist);
  });

  // Verifica che il risultato venga emesso da wishlist$.
  it('loadWishlist emits the fetched wishlist via wishlist$', () => {
    let emitted: Wishlist | null = null;
    service.wishlist$.subscribe(w => (emitted = w));

    service.loadWishlist().subscribe();
    http.expectOne(BASE_URL).flush(fakeWishlist);

    expect(emitted).toEqual(fakeWishlist);
  });

  // ---------------------------------------------------------------------------
  // addItem
  // ---------------------------------------------------------------------------

  // Verifica che addItem POSTi product_id in /api/wishlist/items.
  it('addItem POSTs product_id to /api/wishlist/items', () => {
    service.addItem('p1').subscribe();

    const req = http.expectOne(`${BASE_URL}/items`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ product_id: 'p1' });
    req.flush(fakeWishlist);
  });

  // Verifica che addItem emetta la wishlist aggiornata via wishlist$.
  it('addItem emits the updated wishlist via wishlist$', () => {
    let emitted: Wishlist | null = null;
    service.wishlist$.subscribe(w => (emitted = w));

    service.addItem('p1').subscribe();
    http.expectOne(`${BASE_URL}/items`).flush(fakeWishlist);

    expect(emitted).toEqual(fakeWishlist);
  });

  // ---------------------------------------------------------------------------
  // removeItem
  // ---------------------------------------------------------------------------

  // Verifica che removeItem invii DELETE /api/wishlist/items/:id.
  it('removeItem issues DELETE /api/wishlist/items/:id', () => {
    service.removeItem('42').subscribe();

    const req = http.expectOne(`${BASE_URL}/items/42`);
    expect(req.request.method).toBe('DELETE');
    req.flush(emptyWishlist);
  });

  // Verifica che removeItem emetta la wishlist aggiornata via wishlist$.
  it('removeItem emits the updated wishlist via wishlist$', () => {
    let emitted: Wishlist | null = null;
    service.wishlist$.subscribe(w => (emitted = w));

    service.removeItem('1').subscribe();
    http.expectOne(`${BASE_URL}/items/1`).flush(emptyWishlist);

    expect(emitted).toEqual(emptyWishlist);
  });
});
