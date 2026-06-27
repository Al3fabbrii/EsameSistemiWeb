import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { UserAreaPage } from './user-area-page';
import { OrderService } from '../../../core/services/order-service';
import { AuthService } from '../../../core/services/auth-service';
import { Order, OrderItem } from '../../../core/models/order';
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

const fakeOrder: Order = {
  id: 1,
  userId: 1,
  customer: { firstName: 'Mario', lastName: 'Rossi', email: 'm@r.it' },
  address: { street: 'Via Roma 1', city: 'Milano', zip: '20100' },
  items: [],
  total: 100,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('UserAreaPage', () => {
  let fixture: ComponentFixture<UserAreaPage>;
  let component: UserAreaPage;
  let order: { getOrders: ReturnType<typeof vi.fn> };
  let auth: { currentUser$: BehaviorSubject<unknown> };

  beforeEach(async () => {
    order = { getOrders: vi.fn().mockReturnValue(of([fakeOrder])) };
    auth = { currentUser$: new BehaviorSubject<unknown>(null) };

    await TestBed.configureTestingModule({
      imports: [UserAreaPage],
      providers: [
        { provide: OrderService, useValue: order },
        { provide: AuthService, useValue: auth },
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserAreaPage);
    component = fixture.componentInstance;
    // Silenzia i console.log della pagina durante i test.
    vi.spyOn(console, 'log').mockImplementation(vi.fn());
    vi.spyOn(console, 'error').mockImplementation(vi.fn());
  });

  afterEach(() => vi.restoreAllMocks());

  // ---------------------------------------------------------------------------
  // ngOnInit / loadOrders
  // ---------------------------------------------------------------------------

  // Verifica che ngOnInit carichi gli ordini.
  it('loads orders on init', () => {
    component.ngOnInit();
    expect(order.getOrders).toHaveBeenCalled();
    expect(component.orders).toEqual([fakeOrder]);
    expect(component.loading).toBe(false);
    expect(component.error).toBe(false);
  });

  // Verifica che in caso di errore venga impostato error=true e loading=false.
  it('sets error flag when loadOrders fails', () => {
    order.getOrders.mockReturnValue(throwError(() => new Error('boom')));

    component.loadOrders();

    expect(component.error).toBe(true);
    expect(component.loading).toBe(false);
  });

  // Verifica che dateFrom venga incluso nei filtri quando impostato.
  it('includes dateFrom in filters when set', () => {
    component.dateFrom = new Date('2026-01-01T00:00:00Z');
    component.loadOrders();

    const filters = order.getOrders.mock.calls.at(-1)![0];
    expect(filters.dateFrom).toBeDefined();
  });

  // Verifica che totalMin venga incluso nei filtri quando impostato.
  it('includes totalMin in filters when set', () => {
    component.totalMin = 50;
    component.loadOrders();

    const filters = order.getOrders.mock.calls.at(-1)![0];
    expect(filters.totalMin).toBe(50);
  });

  // Verifica che totalMin null non venga incluso (branch coverage).
  it('does not include totalMin when null', () => {
    component.totalMin = null;
    component.loadOrders();

    const filters = order.getOrders.mock.calls.at(-1)![0];
    expect(filters.totalMin).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // applyFilters
  // ---------------------------------------------------------------------------

  // Verifica che applyFilters chiami loadOrders.
  it('applyFilters triggers loadOrders', () => {
    order.getOrders.mockClear();
    component.applyFilters();
    expect(order.getOrders).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // clearFilters
  // ---------------------------------------------------------------------------

  // Verifica che clearFilters azzeri i filtri e ricarichi.
  it('clearFilters resets filter fields and reloads', () => {
    component.dateFrom = new Date();
    component.dateTo = new Date();
    component.totalMin = 100;
    component.totalMax = 200;
    component.filters.sort = 'total_asc';
    order.getOrders.mockClear();

    component.clearFilters();

    expect(component.dateFrom).toBeNull();
    expect(component.dateTo).toBeNull();
    expect(component.totalMin).toBeNull();
    expect(component.totalMax).toBeNull();
    expect(component.filters.sort).toBe('date_desc');
    expect(order.getOrders).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // isOrderItem type guard (branch coverage)
  // ---------------------------------------------------------------------------

  // Verifica che isOrderItem ritorni true quando l'item ha .product.
  it('isOrderItem returns true for OrderItem with product field', () => {
    const item: OrderItem = {
      id: 1,
      productId: 'p1',
      quantity: 1,
      unitPrice: 10,
      product: fakeProduct,
    };
    expect(component.isOrderItem(item)).toBe(true);
  });

  // Verifica che isOrderItem ritorni false per un Product nudo.
  it('isOrderItem returns false for plain Product', () => {
    expect(component.isOrderItem(fakeProduct)).toBe(false);
  });
});
