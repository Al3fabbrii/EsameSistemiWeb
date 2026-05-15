import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap, delay } from 'rxjs';
import { Order } from '../models/order';

export interface OrderFilters {
  dateFrom?: string;
  dateTo?: string;
  totalMin?: number;
  totalMax?: number;
  sort?: 'date_asc' | 'date_desc' | 'total_asc' | 'total_desc';
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api';
  private cache = new Map<string, { data: Order[], timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 secondi

  // Ottiene tutti gli ordini dell'utente corrente con filtri opzionali
  getOrders(filters?: OrderFilters, forceRefresh = false): Observable<Order[]> {
    const cacheKey = this.getCacheKey(filters);

    // Controlla cache se non è forzato il refresh
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        console.log('[OrderService] Returning cached data');
        // Usa delay(0) per rendere l'observable asincrono e permettere il change detection
        return of(cached.data).pipe(delay(0));
      }
    }

    console.log('[OrderService] Fetching from backend', forceRefresh ? '(forced)' : '');

    let params = new HttpParams();

    if (filters) {
      if (filters.dateFrom) {
        params = params.set('date_from', filters.dateFrom);
      }
      if (filters.dateTo) {
        params = params.set('date_to', filters.dateTo);
      }
      if (filters.totalMin !== undefined) {
        params = params.set('total_min', filters.totalMin.toString());
      }
      if (filters.totalMax !== undefined) {
        params = params.set('total_max', filters.totalMax.toString());
      }
      if (filters.sort) {
        params = params.set('sort', filters.sort);
      }
    }

    return this.http.get<Order[]>(`${this.baseUrl}/orders`, { params }).pipe(
      tap(orders => {
        this.cache.set(cacheKey, { data: orders, timestamp: Date.now() });
      })
    );
  }

  // Crea un nuovo ordine
  create(order: Order): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders`, { order }).pipe(
      tap(() => {
        // Invalida la cache dopo aver creato un nuovo ordine
        this.clearCache();
      })
    );
  }

  // Genera una chiave per la cache basata sui filtri
  private getCacheKey(filters?: OrderFilters): string {
    if (!filters) return 'default';
    return JSON.stringify(filters);
  }

  // Pulisce la cache
  clearCache(): void {
    this.cache.clear();
  }
}
