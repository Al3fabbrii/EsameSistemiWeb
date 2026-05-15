import { Component, OnInit } from '@angular/core';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../core/services/cart';
import { NotificationService } from '../../../core/services/notification.service';
import { MatCardImage, MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { CommonModule } from "@angular/common";
import { CurrencyPipe } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, CommonModule, CurrencyPipe, MatIconModule, RouterLink],
  templateUrl: './cart-page.html',
  styleUrls: ['./cart-page.scss'],
})
export class CartPage implements OnInit {
  cartService = inject(CartService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  ngOnInit() {
    this.cartService.loadCart().subscribe();
  }

  goToCheckout() {
    this.router.navigate(['/checkout']);
  }

  increaseQuantity(item: any) {
    this.cartService.updateItem(item.id, item.quantity + 1).subscribe({
      error: (err) => {
        console.error('Error updating quantity:', err);
        const errorMsg = err.error?.error || 'Errore durante l\'aggiornamento della quantità';
        this.notify.showError(errorMsg);
        // Ricarica il carrello per ripristinare lo stato corretto
        this.cartService.loadCart().subscribe();
      }
    });
  }
  decreaseQuantity(item: any) {
    if (item.quantity > 1) {
      this.cartService.updateItem(item.id, item.quantity - 1).subscribe({
        error: (err) => {
          console.error('Error updating quantity:', err);
          const errorMsg = err.error?.error || 'Errore durante l\'aggiornamento della quantità';
          this.notify.showError(errorMsg);
          // Ricarica il carrello per ripristinare lo stato corretto
          this.cartService.loadCart().subscribe();
        }
      });
    }
  }

  removeItem(item: any) {
    this.cartService.removeItem(item.id).subscribe();
  }

}
