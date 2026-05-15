import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../core/services/auth-service';
import { LocaleService } from '../../core/services/locale.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, MatIcon, MatToolbar, MatMenuModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private router = inject(Router);
  authService = inject(AuthService);
  localeService = inject(LocaleService);

  goToCheckout(): void {
    // Logic to navigate to the checkout page
    this.router.navigate(['/checkout']);
  }

  goToHome(): void {
    // Logic to navigate to the home page
    this.router.navigate(['/']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/products']);
      }
    });
  }
  goToRegister(): void {
    this.router.navigate(['/register']);
  }
  goToCart(): void {
    this.router.navigate(['/cart']);
  }
  goToWishlist(): void {
    this.router.navigate(['/wishlist']);
  }

  goToUserArea(): void {
    this.router.navigate(['/user-area']);
  }

  changeLanguage(languageCode: string): void {
    this.localeService.switchLanguage(languageCode);
  }
}
