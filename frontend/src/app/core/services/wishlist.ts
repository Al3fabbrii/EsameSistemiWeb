import { Injectable } from '@angular/core';
import { tap } from 'rxjs/internal/operators/tap';
import { Observable } from 'rxjs/internal/Observable';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Wishlist, WishlistItem } from '../models/wishlist';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private readonly baseUrl = 'http://localhost:3000/api/wishlist';
  private http = inject(HttpClient);

  private wishlistSubject = new BehaviorSubject<Wishlist | null>(null);
  public wishlist$ = this.wishlistSubject.asObservable();

  loadWishlist(): Observable<Wishlist> {
    return this.http.get<Wishlist>(this.baseUrl).pipe(
      tap(wishlist => this.wishlistSubject.next(wishlist))
    );
  }
  //aggiungi prodotto alla lista dei preferiti
  addItem(productId: string): Observable<Wishlist> {
    return this.http.post<Wishlist>(`${this.baseUrl}/items`, {
      product_id: productId
    }).pipe(
      tap(wishlist => this.wishlistSubject.next(wishlist))
    );
  }
  //rimuovi prodotto dalla lista dei preferiti
  removeItem(itemId: string): Observable<Wishlist> {
    return this.http.delete<Wishlist>(`${this.baseUrl}/items/${itemId}`).pipe(
      tap(wishlist => this.wishlistSubject.next(wishlist))
    );
  }

}
