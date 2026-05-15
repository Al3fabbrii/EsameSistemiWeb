import { Routes } from '@angular/router';
import { CheckoutPage } from './features/checkout/checkout-page/checkout-page';
import { ProductDetailPage } from './features/products/product-detail-page/product-detail-page';
import { authGuard } from './core/guard/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'products', pathMatch: 'full' },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/logging-page/logging-page').then(m => m.LoggingPage)
    },
    {
        path: 'products',
        loadComponent: () => import('./features/products/product-page/product-page').then(m => m.ProductPage),
    },
    { path: 'product/:id', component: ProductDetailPage },
    { path: 'cart', loadComponent: () => import('./features/cart/cart-page/cart-page').then(m => m.CartPage), canActivate: [authGuard] },
    { path: 'checkout', component: CheckoutPage, canActivate: [authGuard] },
    {
        path: 'register',
        loadComponent: () => import('./features/auth/register-page/register-page').then(m => m.RegisterPage)
    },
    { path: 'wishlist', loadComponent: () => import('./features/wishlist/wishlist-page/wishlist-page').then(m => m.WishlistPage), canActivate: [authGuard] },
    { path: 'user-area', loadComponent: () => import('./features/user-area/user-area-page/user-area-page').then(m => m.UserAreaPage), canActivate: [authGuard] },
];
