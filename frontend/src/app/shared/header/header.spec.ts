import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Header } from './header';
import { AuthService } from '../../core/services/auth-service';
import { LocaleService } from '../../core/services/locale.service';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let component: Header;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let auth: { logout: ReturnType<typeof vi.fn> };
  let locale: { switchLanguage: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    router = { navigate: vi.fn() };
    auth = { logout: vi.fn().mockReturnValue(of(undefined)) };
    locale = { switchLanguage: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
        { provide: LocaleService, useValue: locale },
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
  });

  // ---------------------------------------------------------------------------
  // Navigation helpers
  // ---------------------------------------------------------------------------

  // Verifica che goToHome navighi alla root.
  it('navigates to / on goToHome', () => {
    component.goToHome();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  // Verifica che goToLogin navighi a /login.
  it('navigates to /login on goToLogin', () => {
    component.goToLogin();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  // Verifica che goToRegister navighi a /register.
  it('navigates to /register on goToRegister', () => {
    component.goToRegister();
    expect(router.navigate).toHaveBeenCalledWith(['/register']);
  });

  // Verifica che goToCart navighi a /cart.
  it('navigates to /cart on goToCart', () => {
    component.goToCart();
    expect(router.navigate).toHaveBeenCalledWith(['/cart']);
  });

  // Verifica che goToWishlist navighi a /wishlist.
  it('navigates to /wishlist on goToWishlist', () => {
    component.goToWishlist();
    expect(router.navigate).toHaveBeenCalledWith(['/wishlist']);
  });

  // Verifica che goToCheckout navighi a /checkout.
  it('navigates to /checkout on goToCheckout', () => {
    component.goToCheckout();
    expect(router.navigate).toHaveBeenCalledWith(['/checkout']);
  });

  // Verifica che goToUserArea navighi a /user-area.
  it('navigates to /user-area on goToUserArea', () => {
    component.goToUserArea();
    expect(router.navigate).toHaveBeenCalledWith(['/user-area']);
  });

  // Verifica che goToAdminProducts navighi a /admin/products.
  it('navigates to /admin/products on goToAdminProducts', () => {
    component.goToAdminProducts();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/products']);
  });

  // ---------------------------------------------------------------------------
  // logout
  // ---------------------------------------------------------------------------

  // Verifica che logout chiami AuthService.logout.
  it('calls AuthService.logout when logout is invoked', () => {
    component.logout();
    expect(auth.logout).toHaveBeenCalled();
  });

  // Verifica che dopo logout l'utente venga reindirizzato a /products.
  it('navigates to /products after successful logout', () => {
    component.logout();
    expect(router.navigate).toHaveBeenCalledWith(['/products']);
  });

  // ---------------------------------------------------------------------------
  // changeLanguage
  // ---------------------------------------------------------------------------

  // Verifica che changeLanguage deleghi a LocaleService.switchLanguage.
  it('delegates language change to LocaleService.switchLanguage', () => {
    component.changeLanguage('en');
    expect(locale.switchLanguage).toHaveBeenCalledWith('en');
  });
});
