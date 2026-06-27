import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { AuthService } from './auth-service';
import { User } from '../models/user';

const BASE_URL = 'http://localhost:3000/api/auth';
const TOKEN_KEY = 'auth_token';

const fakeUser: User = {
  id: 1,
  email: 'user@example.com',
  role: 'customer',
  createdAt: '2026-01-01T00:00:00Z',
};

const fakeAdmin: User = { ...fakeUser, id: 2, email: 'admin@example.com', role: 'admin' };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  // ---------------------------------------------------------------------------
  // isLoggedIn / isAdmin (branch coverage)
  // ---------------------------------------------------------------------------

  // Verifica che isLoggedIn sia false quando non c'è alcun token salvato.
  it('isLoggedIn returns false when no token is in localStorage', () => {
    expect(service.isLoggedIn).toBe(false);
  });

  // Verifica che isLoggedIn sia true quando un token è presente.
  it('isLoggedIn returns true when token exists in localStorage', () => {
    localStorage.setItem(TOKEN_KEY, 'jwt-token');
    expect(service.isLoggedIn).toBe(true);
  });

  // Verifica che isAdmin sia false quando non c'è utente caricato.
  it('isAdmin returns false when current user is null', () => {
    expect(service.isAdmin).toBe(false);
  });

  // Verifica che isAdmin sia false per utente di ruolo customer.
  it('isAdmin returns false for a customer user', () => {
    service.login('a@b.it', 'pwd').subscribe();
    http.expectOne(`${BASE_URL}/login`).flush({ token: 'jwt', user: fakeUser });

    expect(service.isAdmin).toBe(false);
  });

  // Verifica che isAdmin sia true solo per utenti con role 'admin'.
  it('isAdmin returns true when current user role is admin', () => {
    service.login('a@b.it', 'pwd').subscribe();
    http.expectOne(`${BASE_URL}/login`).flush({ token: 'jwt', user: fakeAdmin });

    expect(service.isAdmin).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------------

  // Verifica che login invii una POST a /api/auth/login con email e password.
  it('login POSTs credentials to /api/auth/login', () => {
    service.login('user@example.com', 'secret').subscribe();

    const req = http.expectOne(`${BASE_URL}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'user@example.com', password: 'secret' });
    req.flush({ token: 'jwt', user: fakeUser });
  });

  // Verifica che il token ricevuto venga persistito in localStorage.
  it('login persists the received token in localStorage', () => {
    service.login('a@b.it', 'pwd').subscribe();
    http.expectOne(`${BASE_URL}/login`).flush({ token: 'jwt-from-server', user: fakeUser });

    expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt-from-server');
  });

  // Verifica che dopo il login currentUser$ emetta l'utente ricevuto.
  it('login emits the received user via currentUser$', () => {
    let emitted: User | null = null;
    service.currentUser$.subscribe(u => (emitted = u));

    service.login('a@b.it', 'pwd').subscribe();
    http.expectOne(`${BASE_URL}/login`).flush({ token: 'jwt', user: fakeUser });

    expect(emitted).toEqual(fakeUser);
  });

  // ---------------------------------------------------------------------------
  // register
  // ---------------------------------------------------------------------------

  // Verifica che register invii una POST a /api/auth/register.
  it('register POSTs credentials to /api/auth/register', () => {
    service.register('new@example.com', 'newpass').subscribe();

    const req = http.expectOne(`${BASE_URL}/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'new@example.com', password: 'newpass' });
    req.flush({ token: 'jwt', user: fakeUser });
  });

  // Verifica che register persista il token e segni l'utente come loggato.
  it('register persists token and marks user as logged in', () => {
    service.register('a@b.it', 'pwd').subscribe();
    http.expectOne(`${BASE_URL}/register`).flush({ token: 'jwt', user: fakeUser });

    expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt');
    expect(service.isLoggedIn).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // logout
  // ---------------------------------------------------------------------------

  // Verifica che logout invii una POST a /api/auth/logout.
  it('logout POSTs to /api/auth/logout', () => {
    localStorage.setItem(TOKEN_KEY, 'jwt');
    service.logout().subscribe();

    const req = http.expectOne(`${BASE_URL}/logout`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  // Verifica che logout cancelli il token e ripulisca currentUser$.
  it('logout clears token and current user on success', () => {
    localStorage.setItem(TOKEN_KEY, 'jwt');

    service.logout().subscribe();
    http.expectOne(`${BASE_URL}/logout`).flush(null);

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(service.isLoggedIn).toBe(false);
  });

  // Verifica che anche se la chiamata di logout fallisce, il client esegue cleanup locale.
  it('logout clears token even when the HTTP call fails', () => {
    localStorage.setItem(TOKEN_KEY, 'jwt');

    service.logout().subscribe();
    http.expectOne(`${BASE_URL}/logout`).error(new ProgressEvent('Network error'));

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(service.isLoggedIn).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // getToken
  // ---------------------------------------------------------------------------

  // Verifica che getToken legga il valore corrente da localStorage.
  it('getToken returns the value currently stored in localStorage', () => {
    localStorage.setItem(TOKEN_KEY, 'abc.def.ghi');
    expect(service.getToken()).toBe('abc.def.ghi');
  });

  // Verifica che getToken restituisca null quando non c'è nulla.
  it('getToken returns null when nothing is stored', () => {
    expect(service.getToken()).toBeNull();
  });
});
