import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { adminGuard } from './admin-guard';
import { AuthService } from '../services/auth-service';

describe('adminGuard', () => {
  let auth: { isLoggedIn: boolean; isAdmin: boolean };
  let createUrlTreeCalls: unknown[][];
  let urlTree: UrlTree;

  beforeEach(() => {
    urlTree = {} as UrlTree;
    auth = { isLoggedIn: false, isAdmin: false };
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

  // Verifica che un utente non loggato venga reindirizzato a /login.
  it('redirects to /login when user is not logged in', () => {
    auth.isLoggedIn = false;
    auth.isAdmin = false;

    const result = TestBed.runInInjectionContext(() => adminGuard());

    expect(result).toBe(urlTree);
    expect(createUrlTreeCalls[0]).toEqual(['/login']);
  });

  // Verifica che un utente loggato ma non admin venga reindirizzato a /products.
  it('redirects to /products when user is logged in but not admin', () => {
    auth.isLoggedIn = true;
    auth.isAdmin = false;

    const result = TestBed.runInInjectionContext(() => adminGuard());

    expect(result).toBe(urlTree);
    expect(createUrlTreeCalls[0]).toEqual(['/products']);
  });

  // Verifica che un utente admin possa accedere (ritorna true).
  it('allows navigation when user is an admin', () => {
    auth.isLoggedIn = true;
    auth.isAdmin = true;

    const result = TestBed.runInInjectionContext(() => adminGuard());

    expect(result).toBe(true);
    expect(createUrlTreeCalls.length).toBe(0);
  });
});
