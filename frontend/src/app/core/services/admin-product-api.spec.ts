import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { AdminProductApi, ProductPayload } from './admin-product-api';
import { Product } from '../models/product';

const BASE_URL = 'http://localhost:3000/api/admin/products';

const fakePayload: ProductPayload = {
  title: 'New Product',
  description: 'A new product',
  price: 50,
  original_price: 75,
  sale: false,
  thumbnail: '',
  stock: 100,
  tags: ['new'],
};

const fakeProduct: Product = {
  id: 'p1',
  title: 'New Product',
  description: 'A new product',
  price: 50,
  originalPrice: 75,
  sale: false,
  stock: 100,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('AdminProductApi', () => {
  let service: AdminProductApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminProductApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ---------------------------------------------------------------------------
  // list
  // ---------------------------------------------------------------------------

  // Verifica che list invii GET a /api/admin/products.
  it('list issues GET /api/admin/products', () => {
    service.list().subscribe();

    const req = http.expectOne(BASE_URL);
    expect(req.request.method).toBe('GET');
    req.flush([fakeProduct]);
  });

  // Verifica che list ritorni l'array di prodotti dalla risposta.
  it('list returns the products array from the response', () => {
    let result: Product[] = [];
    service.list().subscribe(p => (result = p));

    http.expectOne(BASE_URL).flush([fakeProduct]);

    expect(result).toEqual([fakeProduct]);
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------

  // Verifica che create POSTi il payload wrappato in { product }.
  it('create POSTs payload wrapped in { product } to /api/admin/products', () => {
    service.create(fakePayload).subscribe();

    const req = http.expectOne(BASE_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ product: fakePayload });
    req.flush(fakeProduct);
  });

  // Verifica che create ritorni il prodotto creato.
  it('create returns the created product', () => {
    let result: Product | undefined;
    service.create(fakePayload).subscribe(p => (result = p));

    http.expectOne(BASE_URL).flush(fakeProduct);

    expect(result).toEqual(fakeProduct);
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------

  // Verifica che update invii PATCH a /api/admin/products/:id.
  it('update PATCHes /api/admin/products/:id with partial payload', () => {
    service.update('p1', { price: 60 }).subscribe();

    const req = http.expectOne(`${BASE_URL}/p1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ product: { price: 60 } });
    req.flush(fakeProduct);
  });

  // Verifica che update ritorni il prodotto aggiornato.
  it('update returns the updated product', () => {
    let result: Product | undefined;
    service.update('p1', { price: 60 }).subscribe(p => (result = p));

    http.expectOne(`${BASE_URL}/p1`).flush(fakeProduct);

    expect(result).toEqual(fakeProduct);
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------

  // Verifica che delete invii DELETE a /api/admin/products/:id.
  it('delete issues DELETE /api/admin/products/:id', () => {
    service.delete('p1').subscribe();

    const req = http.expectOne(`${BASE_URL}/p1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
