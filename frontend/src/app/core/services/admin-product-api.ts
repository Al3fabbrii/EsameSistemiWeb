import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product';

export interface ProductPayload {
  id?: string;
  title: string;
  description: string;
  price: number;
  original_price: number;
  sale: boolean;
  thumbnail: string;
  stock: number;
  tags: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AdminProductApi {
  private readonly baseUrl = 'http://localhost:3000/api/admin';

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products`);
  }

  create(payload: ProductPayload): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/products`, { product: payload });
  }

  update(id: string, payload: Partial<ProductPayload>): Observable<Product> {
    return this.http.patch<Product>(`${this.baseUrl}/products/${id}`, { product: payload });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${id}`);
  }
}
