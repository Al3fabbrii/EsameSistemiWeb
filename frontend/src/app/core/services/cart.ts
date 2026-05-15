import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Cart, CartItem } from '../models/cart';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly baseUrl = 'http://localhost:3000/api/cart';
  private http = inject(HttpClient);

  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  // Carica il carrello dal backend
  loadCart(): Observable<Cart> {
    return this.http.get<Cart>(this.baseUrl).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  // Aggiungi prodotto al carrello
  addItem(productId: string, quantity: number = 1): Observable<Cart> {
    return this.http.post<Cart>(`${this.baseUrl}/items`, {
      product_id: productId,
      quantity
    }).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  // Aggiorna quantità item
  updateItem(itemId: number, quantity: number): Observable<Cart> {
    return this.http.patch<Cart>(`${this.baseUrl}/items/${itemId}`, {
      quantity
    }).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  // Rimuovi item dal carrello
  removeItem(itemId: number): Observable<Cart> {
    return this.http.delete<Cart>(`${this.baseUrl}/items/${itemId}`).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  // Helper per ottenere numero totale items
  get itemCount(): number {
    const cart = this.cartSubject.value;
    return cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  // Helper per ottenere totale carrello
  get total(): number {
    return this.cartSubject.value?.total || 0;
  }
}
