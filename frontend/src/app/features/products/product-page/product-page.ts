import { Component, inject } from '@angular/core';
import { ProductCard } from '../product-card/product-card';
import { Product } from '../../../core/models/product';
import { ProductApi, ProductFilters } from '../../../core/services/product-api';
import { CartService } from '../../../core/services/cart';
import { NotificationService } from '../../../core/services/notification.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { AsyncPipe } from '@angular/common';
import { BehaviorSubject, combineLatest, map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';

type Sort = 'priceAsc' | 'priceDesc' | 'dateAsc' | 'dateDesc';

// Mappa i valori frontend ai valori backend
const sortMap: Record<Sort, 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc'> = {
  priceAsc: 'price_asc',
  priceDesc: 'price_desc',
  dateAsc: 'date_asc',
  dateDesc: 'date_desc'
};

@Component({
  selector: 'app-product-page',
  imports: [ProductCard, FormsModule, MatPaginatorModule, MatFormFieldModule, MatInput, MatLabel, MatSelectModule, AsyncPipe],
  templateUrl: './product-page.html',
  styleUrl: './product-page.scss',
})
export class ProductPage {
  private service = inject(ProductApi);
  private cartService = inject(CartService);
  private notify = inject(NotificationService);

  private filters$ = new BehaviorSubject({
    title: '',
    sort: 'dateDesc' as Sort,
    priceMin: '0',
    priceMax: '10000',
  });

  // Filtra i prodotti usando il backend
  protected readonly products$ = this.filters$.pipe(
    debounceTime(300), // Attendi 300ms dopo l'ultimo cambio prima di chiamare il backend
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    switchMap(filters => {
      const backendFilters: ProductFilters = {
        search: filters.title || undefined,
        priceMin: filters.priceMin ? Number(filters.priceMin) : undefined,
        priceMax: filters.priceMax ? Number(filters.priceMax) : undefined,
        sort: sortMap[filters.sort]
      };
      return this.service.list(backendFilters);
    })
  );

  page$ = new BehaviorSubject(1);
  pageSize = 10;
  paged$ = combineLatest([this.products$, this.page$]).pipe(
    map(([items, page]) => {
      const start = (page - 1) * this.pageSize;
      const end = start + this.pageSize;
      return items.slice(start, end);
    })
  );
  updateTitle(title: string) {
    console.log('Filtri applicati:');
    this.filters$.next({ ...this.filters$.value, title: title });
  }

  updateMin(min: string) {
    console.log('Filtri applicati:');
    this.filters$.next({ ...this.filters$.value, priceMin: min });
  }

  updateMax(max: string) {
    console.log('Filtri applicati:');
    this.filters$.next({ ...this.filters$.value, priceMax: max });
  }

  onAddToCart(product: Product) {
    this.cartService.addItem(product.id, 1).subscribe({
      next: () => {
        this.notify.showSuccess(`✓ ${product.title} aggiunto al carrello`);
      },
      error: (err) => {
        console.error('Error adding to cart:', err);
        this.notify.showError('Errore durante l\'aggiunta al carrello. Assicurati di essere loggato.');
      }
    });
  }
  updateSort(sort: Sort) {
    this.filters$.next({ ...this.filters$.value, sort: sort });
  }
  onPage(e: PageEvent) {
    this.page$.next(e.pageIndex + 1);
  }

}

