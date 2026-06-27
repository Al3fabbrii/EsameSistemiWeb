import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { ProductApi, ProductFilters } from './product-api';
import { Product } from '../models/product';

const BASE_URL = 'http://localhost:3000/api/products';

const fakeProduct: Product = {
  id: 'p1',
  title: 'Test Product',
  description: 'A test product',
  price: 10,
  originalPrice: 15,
  sale: false,
  stock: 100,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('ProductApi', () => {
  let service: ProductApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ---------------------------------------------------------------------------
  // list — request shape and filters
  // ---------------------------------------------------------------------------

  // Verifica che list senza filtri invii GET a /api/products senza query.
  it('list without filters issues GET /api/products without params', () => {
    service.list().subscribe();

    const req = http.expectOne(r => r.url === BASE_URL);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([fakeProduct]);
  });

  // Verifica che il filtro search venga mappato sul query param 'search'.
  it('list maps search filter to query param search', () => {
    service.list({ search: 'laptop' }).subscribe();

    const req = http.expectOne(r => r.url === BASE_URL);
    expect(req.request.params.get('search')).toBe('laptop');
    req.flush([]);
  });

  // Verifica che priceMin venga mappato sul query param 'price_min'.
  it('list maps priceMin filter to query param price_min', () => {
    service.list({ priceMin: 10 }).subscribe();

    const req = http.expectOne(r => r.url === BASE_URL);
    expect(req.request.params.get('price_min')).toBe('10');
    req.flush([]);
  });

  // Verifica che priceMax venga mappato sul query param 'price_max'.
  it('list maps priceMax filter to query param price_max', () => {
    service.list({ priceMax: 100 }).subscribe();

    const req = http.expectOne(r => r.url === BASE_URL);
    expect(req.request.params.get('price_max')).toBe('100');
    req.flush([]);
  });

  // Verifica che priceMin uguale a 0 venga comunque propagato (branch coverage).
  it('list propagates priceMin=0 as query param', () => {
    service.list({ priceMin: 0 }).subscribe();

    const req = http.expectOne(r => r.url === BASE_URL);
    expect(req.request.params.get('price_min')).toBe('0');
    req.flush([]);
  });

  // Verifica che priceMin null venga ignorato (branch coverage).
  it('list ignores null priceMin', () => {
    service.list({ priceMin: null as unknown as number }).subscribe();

    const req = http.expectOne(r => r.url === BASE_URL);
    expect(req.request.params.has('price_min')).toBe(false);
    req.flush([]);
  });

  // Verifica che sort venga mappato sul query param 'sort'.
  it('list maps sort filter to query param sort', () => {
    service.list({ sort: 'price_asc' }).subscribe();

    const req = http.expectOne(r => r.url === BASE_URL);
    expect(req.request.params.get('sort')).toBe('price_asc');
    req.flush([]);
  });

  // Verifica che combinando i filtri tutti vengano propagati.
  it('list propagates all filters when combined', () => {
    const filters: ProductFilters = {
      search: 'phone',
      priceMin: 100,
      priceMax: 500,
      sort: 'date_desc',
    };
    service.list(filters).subscribe();

    const req = http.expectOne(r => r.url === BASE_URL);
    expect(req.request.params.get('search')).toBe('phone');
    expect(req.request.params.get('price_min')).toBe('100');
    expect(req.request.params.get('price_max')).toBe('500');
    expect(req.request.params.get('sort')).toBe('date_desc');
    req.flush([]);
  });

  // Verifica che list ritorni il body della risposta.
  it('list returns the products array from the response', () => {
    let result: Product[] = [];
    service.list().subscribe(p => (result = p));

    http.expectOne(r => r.url === BASE_URL).flush([fakeProduct]);

    expect(result).toEqual([fakeProduct]);
  });

  // ---------------------------------------------------------------------------
  // getById
  // ---------------------------------------------------------------------------

  // Verifica che getById invii GET a /api/products/:id.
  it('getById issues GET /api/products/:id with the provided id', () => {
    service.getById('p1').subscribe();

    const req = http.expectOne(`${BASE_URL}/p1`);
    expect(req.request.method).toBe('GET');
    req.flush(fakeProduct);
  });

  // Verifica che getById ritorni il prodotto deserializzato dalla risposta.
  it('getById returns the product from the response', () => {
    let result: Product | undefined;
    service.getById('p1').subscribe(p => (result = p));

    http.expectOne(`${BASE_URL}/p1`).flush(fakeProduct);

    expect(result).toEqual(fakeProduct);
  });
});
