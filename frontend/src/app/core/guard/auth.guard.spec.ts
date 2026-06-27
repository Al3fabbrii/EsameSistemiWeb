import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth-service';

describe('authGuard', () => {
  let auth: { isLoggedIn: boolean };
  let router: { createUrlTree: (cmds: unknown[]) => UrlTree };
  let urlTree: UrlTree;

  beforeEach(() => {
    urlTree = {} as UrlTree;
    auth = { isLoggedIn: false };
    router = { createUrlTree: () => urlTree };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
  });

  // Verifica che il guard ritorni true quando l'utente è loggato.
  it('allows navigation when user is logged in', () => {
    auth.isLoggedIn = true;

    const result = TestBed.runInInjectionContext(() => authGuard());

    expect(result).toBe(true);
  });

  // Verifica che il guard ritorni un UrlTree verso /login quando l'utente non è loggato.
  it('redirects to /login when user is not logged in', () => {
    auth.isLoggedIn = false;
    let calledWith: unknown[] | null = null;
    router.createUrlTree = (cmds: unknown[]) => {
      calledWith = cmds;
      return urlTree;
    };

    const result = TestBed.runInInjectionContext(() => authGuard());

    expect(result).toBe(urlTree);
    expect(calledWith).toEqual(['/login']);
  });
});
