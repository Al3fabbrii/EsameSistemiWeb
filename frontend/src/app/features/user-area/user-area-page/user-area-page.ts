import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { OrderService, OrderFilters } from '../../../core/services/order-service';
import { AuthService } from '../../../core/services/auth-service';
import { Order, OrderItem } from '../../../core/models/order';
import { Product } from '../../../core/models/product';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-area-page',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CurrencyPipe,
    RouterLink,
    FormsModule
  ],
  templateUrl: './user-area-page.html',
  styleUrl: './user-area-page.scss',
})
export class UserAreaPage implements OnInit {
  private orderService = inject(OrderService);
  private cdr = inject(ChangeDetectorRef);
  authService = inject(AuthService);

  orders: Order[] = [];
  loading = true;
  error = false;

  // Filtri
  filters: OrderFilters = {
    sort: 'date_desc'
  };
  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  totalMin: number | null = null;
  totalMax: number | null = null;

  ngOnInit() {
    console.log('[UserAreaPage] ngOnInit - Loading orders...');
    this.loadOrders();
  }

  loadOrders() {
    console.log('[UserAreaPage] loadOrders called');
    this.loading = true;
    this.error = false;

    // Costruisci i filtri
    const filters: OrderFilters = {
      sort: this.filters.sort
    };

    if (this.dateFrom) {
      filters.dateFrom = this.dateFrom.toISOString();
    }
    if (this.dateTo) {
      filters.dateTo = this.dateTo.toISOString();
    }
    if (this.totalMin !== null && this.totalMin !== undefined) {
      filters.totalMin = this.totalMin;
    }
    if (this.totalMax !== null && this.totalMax !== undefined) {
      filters.totalMax = this.totalMax;
    }

    console.log('[UserAreaPage] Fetching orders with filters:', filters);

    this.orderService.getOrders(filters, true).subscribe({
      next: (orders) => {
        console.log('[UserAreaPage] Orders loaded:', orders.length);
        this.orders = orders;
        this.loading = false;
        console.log('[UserAreaPage] loading set to false:', this.loading);
        // Forza il change detection
        this.cdr.detectChanges();
        console.log('[UserAreaPage] Change detection triggered');
      },
      error: (err) => {
        console.error('[UserAreaPage] Error loading orders:', err);
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters() {
    this.loadOrders();
  }

  clearFilters() {
    this.dateFrom = null;
    this.dateTo = null;
    this.totalMin = null;
    this.totalMax = null;
    this.filters.sort = 'date_desc';
    this.loadOrders();
  }

  // Type guard per distinguere OrderItem da Product
  isOrderItem(item: Product | OrderItem): item is OrderItem {
    return (item as OrderItem).product !== undefined;
  }
}
