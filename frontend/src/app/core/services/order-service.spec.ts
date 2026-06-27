import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { vi } from 'vitest';

import { OrderService, OrderFilters } from './order-service';
import { Order } from '../models/order';

const BASE_URL = 'http://localhost:3000/api/orders';

const fakeOrder: Order = {
  id: 1,
  userId: 1,
  customer: { firstName: 'Mario', lastName: 'Rossi', email: 'mario@example.com' },
  address: { street: 'Via Roma 1', city: 'Milano', zip: '20100' },
  items: [],
  total: 100,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('OrderService', () => {
  let service: OrderService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrderService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ---------------------------------------------------------------------------
  // getOrders — request shape and filters
  // ---------------------------------------------------------------------------

  // Verifica che getOrders senza filtri invii GET a /api/orders senza parametri.
  it('getOrders without filters issues GET /api/orders with no query params', () => {
    service.getOrders().subscribe();

    const req = http.expectOne(r => r.url === BASE_URL);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([fakeOrder]);
  });

  // Verifica che dateFrom venga mappato sul query param 'date_from'.
  it('getOrders maps dateFrom filter to query param date_from', () => {
    const filters: OrderFilters = { dateFrom: '2026-01-01' };
    service.getOrders(filters).subscribe();

    const req = http.expectOne(r => r.url === BASE_URL);
    expect(req.request.params.get('date_from')).toBe('2026-01-01');
    req.flush([]);
  });

  // Verifica che dateTo venga mappato sul query param 'date_to'.
  it('getOrders maps dateTo filter to query param date_to', () => {
    service.getOrders({ dateTo: '2026-12-31' }).subscribe();

    const req = http.expectOne(r => r.url === BASE_URL);
    expect(req.request.params.get('date_to')).toBe('2026-12-31');
    req.flush([]);
  });

  // Verifica che totalMin venga mappato sul query param 'total_min'.
  it('getOrders maps totalMin filter to query param total_min', () => {
    service.getOrders({ totalMin: 50 }).subscribe();

    const req = http.expectOne(r => r.url === BASE_URL);
    expect(req.request.params.get('total_min')).toBe('50');
    req.flush([]);
  });

  // Verifica che totalMax venga mappato sul query param 'total_max'.
  it('getOrders maps totalMax filter to query param total_max', () => {
    service.getOrders({ totalMax: 200 }).subscribe();

    const req = http.expectOne(r => r.url === BASE_URL);
    expect(req.request.params.get('total_max')).toBe('200');
    req.flush([]);
  });

  // Verifica che sort venga mappato sul query param 'sort'.
  it('getOrders maps sort filter to query param sort', () => {
    service.getOrders({ sort: 'total_desc' }).subscribe();

    const req = http.expectOne(r => r.url === BASE_URL);
    expect(req.request.params.get('sort')).toBe('total_desc');
    req.flush([]);
  });

  // Verifica che più filtri combinati siano tutti propagati.
  it('getOrders propagates all filters when combined', () => {
    const filters: OrderFilters = {
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
      totalMin: 10,
      totalMax: 100,
      sort: 'date_asc',
    };
    service.getOrders(filters).subscribe();

    const req = http.expectOne(r => r.url === BASE_URL);
    expect(req.request.params.get('date_from')).toBe('2026-01-01');
    expect(req.request.params.get('date_to')).toBe('2026-12-31');
    expect(req.request.params.get('total_min')).toBe('10');
    expect(req.request.params.get('total_max')).toBe('100');
    expect(req.request.params.get('sort')).toBe('date_asc');
    req.flush([]);
  });

  // ---------------------------------------------------------------------------
  // getOrders — caching behaviour
  // ---------------------------------------------------------------------------

  // Verifica che la seconda chiamata identica non rifaccia l'HTTP (cache hit).
  it('getOrders does not issue a second HTTP call when result is cached', () => {
    vi.useFakeTimers();
    try {
      service.getOrders().subscribe();
      http.expectOne(BASE_URL).flush([fakeOrder]);

      let cached: Order[] = [];
      service.getOrders().subscribe(orders => (cached = orders));
      vi.advanceTimersByTime(1);

      expect(cached).toEqual([fakeOrder]);
      http.expectNone(BASE_URL);
    } finally {
      vi.useRealTimers();
    }
  });

  // Verifica che forceRefresh=true forzi una nuova chiamata HTTP.
  it('getOrders bypasses cache when forceRefresh is true', () => {
    service.getOrders().subscribe();
    http.expectOne(BASE_URL).flush([fakeOrder]);

    service.getOrders(undefined, true).subscribe();
    http.expectOne(BASE_URL).flush([fakeOrder]);
  });

  // Verifica che filtri diversi generino chiavi di cache diverse.
  it('getOrders uses different cache keys for different filters', () => {
    service.getOrders({ totalMin: 10 }).subscribe();
    http.expectOne(r => r.url === BASE_URL).flush([]);

    service.getOrders({ totalMin: 20 }).subscribe();
    http.expectOne(r => r.url === BASE_URL).flush([]);
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------

  // Verifica che create POSTi l'ordine wrappato in { order }.
  it('create POSTs the order wrapped in { order } to /api/orders', () => {
    service.create(fakeOrder).subscribe();

    const req = http.expectOne(BASE_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ order: fakeOrder });
    req.flush(fakeOrder);
  });

  // Verifica che dopo create la cache venga invalidata.
  it('create clears the cache so subsequent getOrders refetches', () => {
    service.getOrders().subscribe();
    http.expectOne(BASE_URL).flush([fakeOrder]);

    service.create(fakeOrder).subscribe();
    http.expectOne(BASE_URL).flush(fakeOrder);

    service.getOrders().subscribe();
    http.expectOne(BASE_URL).flush([fakeOrder]);
  });

  // ---------------------------------------------------------------------------
  // clearCache
  // ---------------------------------------------------------------------------

  // Verifica che clearCache forzi una nuova fetch alla successiva getOrders.
  it('clearCache forces the next getOrders to fetch again', () => {
    service.getOrders().subscribe();
    http.expectOne(BASE_URL).flush([fakeOrder]);

    service.clearCache();

    service.getOrders().subscribe();
    http.expectOne(BASE_URL).flush([fakeOrder]);
  });
});
