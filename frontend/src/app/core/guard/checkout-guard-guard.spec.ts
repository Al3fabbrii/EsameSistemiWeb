import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';

import { checkoutGuardGuard } from './checkout-guard-guard';
import { AuthService } from '../services/auth-service';

describe('checkoutGuardGuard', () => {
  let auth: { isLoggedIn: boolean };
  let createUrlTreeCalls: unknown[][];
  let urlTree: UrlTree;

  const fakeRoute = {} as ActivatedRouteSnapshot;
  const fakeState = {} as RouterStateSnapshot;

  beforeEach(() => {
    urlTree = {} as UrlTree;
    auth = { isLoggedIn: false };
    createUrlTreeCalls = [];

    const router = {
      createUrlTree: (cmds: unknown[]) => {
        createUrlTreeCalls.push(cmds);
        return urlTree;
      },
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
  });

  // Verifica che un utente loggato possa procedere al checkout.
  it('allows navigation when user is logged in', () => {
    auth.isLoggedIn = true;

    const result = TestBed.runInInjectionContext(() =>
      checkoutGuardGuard(fakeRoute, fakeState),
    );

    expect(result).toBe(true);
  });

  // Verifica che un utente non loggato venga reindirizzato a /login.
  it('redirects to /login when user is not logged in', () => {
    auth.isLoggedIn = false;

    const result = TestBed.runInInjectionContext(() =>
      checkoutGuardGuard(fakeRoute, fakeState),
    );

    expect(result).toBe(urlTree);
    expect(createUrlTreeCalls[0]).toEqual(['/login']);
  });
});
