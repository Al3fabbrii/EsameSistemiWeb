import { CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../../../core/models/product';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { inject } from '@angular/core';
import { WishlistService } from '../../../core/services/wishlist';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, MatCardModule, MatButtonModule, RouterModule, MatIconModule],
  standalone: true,
  templateUrl: `./product-card.html`,
  styleUrls: [`./product-card.scss`],
})

export class ProductCard {
  private wishlistService = inject(WishlistService);
  private notify = inject(NotificationService);
  @Input({ required: true }) product!: Product;
  @Output() add = new EventEmitter<Product>();
  addToCart(p: Product) {
    this.add.emit(p);
  }

  addToWishlist(p: Product) {
    this.wishlistService.addItem(p.id.toString()).subscribe({
      next: () => {
        this.notify.showSuccess(`✓ ${p.title} aggiunto ai preferiti`);
      },
      error: (err) => {
        console.error('Error adding to wishlist:', err);
        this.notify.showError('Errore durante l\'aggiunta ai preferiti. Assicurati di essere loggato.');
      }
    });


  }
}
