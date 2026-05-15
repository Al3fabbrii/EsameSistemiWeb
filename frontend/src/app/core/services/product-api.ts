import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from '../models/product';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface ProductFilters {
  search?: string;
  priceMin?: number;
  priceMax?: number;
  sort?: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc';
}

@Injectable({
  providedIn: 'root',
})
export class ProductApi {
  private readonly baseUrl = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) { }

  list(filters?: ProductFilters): Observable<Product[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.search) {
        params = params.set('search', filters.search);
      }
      if (filters.priceMin !== undefined && filters.priceMin !== null) {
        params = params.set('price_min', filters.priceMin.toString());
      }
      if (filters.priceMax !== undefined && filters.priceMax !== null) {
        params = params.set('price_max', filters.priceMax.toString());
      }
      if (filters.sort) {
        params = params.set('sort', filters.sort);
      }
    }

    return this.http.get<Product[]>(`${this.baseUrl}/products`, { params });
  }

  getById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/products/${id}`);
  }
}