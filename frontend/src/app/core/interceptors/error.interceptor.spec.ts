import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth-service';
import { NotificationService } from '../services/notification.service';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: { navigate: ReturnType<typeof vi.fn>; url: string };
  let auth: { logout: ReturnType<typeof vi.fn> };
  let notify: { showError: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    router = { navigate: vi.fn(), url: '/some/page' };
    auth = { logout: vi.fn().mockReturnValue(of(undefined)) };
    notify = { showError: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
        { provide: NotificationService, useValue: notify },
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    // Silenzia i console.error volumetrici dell'interceptor durante i test.
    vi.spyOn(console, 'error').mockImplementation(vi.fn());
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 0 — network error
  // ---------------------------------------------------------------------------

  // Verifica che status 0 produca un messaggio "Impossibile connettersi al server".
  it('shows a network error notification on status 0', () => {
    let captured: { message: string } | null = null;
    http.get('/x').subscribe({ error: e => (captured = e) });

    httpMock.expectOne('/x').error(new ProgressEvent('Network'), { status: 0 });

    expect(notify.showError).toHaveBeenCalled();
    expect(captured!.message).toMatch(/server/);
  });

  // ---------------------------------------------------------------------------
  // 401 — unauthorized
  // ---------------------------------------------------------------------------

  // Verifica che 401 su una rotta non-auth chiami logout e navighi a /login.
  it('on 401 outside auth routes logs out and redirects to /login', () => {
    http.get('/api/orders').subscribe({ error: vi.fn() });

    httpMock.expectOne('/api/orders').flush('unauth', { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(
      ['/login'],
      expect.objectContaining({
        queryParams: expect.objectContaining({ sessionExpired: 'true' }),
      }),
    );
  });

  // Verifica che 401 NON mostri una notifica (gestisce solo il redirect).
  it('on 401 does not show an error notification', () => {
    http.get('/api/orders').subscribe({ error: vi.fn() });

    httpMock.expectOne('/api/orders').flush('', { status: 401, statusText: 'Unauthorized' });

    expect(notify.showError).not.toHaveBeenCalled();
  });

  // Verifica che 401 su /auth/login NON forzi il logout (evita loop).
  it('on 401 from /auth/login does NOT logout or redirect', () => {
    http.post('/api/auth/login', {}).subscribe({ error: vi.fn() });

    httpMock
      .expectOne('/api/auth/login')
      .flush('', { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // 403 — forbidden
  // ---------------------------------------------------------------------------

  // Verifica che 403 mostri un messaggio di permessi insufficienti.
  it('on 403 shows a forbidden notification', () => {
    let captured: { message: string } | null = null;
    http.get('/x').subscribe({ error: e => (captured = e) });

    httpMock.expectOne('/x').flush('', { status: 403, statusText: 'Forbidden' });

    expect(notify.showError).toHaveBeenCalled();
    expect(captured!.message).toMatch(/permessi/);
  });

  // ---------------------------------------------------------------------------
  // 404 — not found
  // ---------------------------------------------------------------------------

  // Verifica che 404 mostri il messaggio custom dal backend quando presente.
  it('on 404 uses the backend-provided error message when present', () => {
    let captured: { message: string } | null = null;
    http.get('/x').subscribe({ error: e => (captured = e) });

    httpMock
      .expectOne('/x')
      .flush({ error: 'Resource X missing' }, { status: 404, statusText: 'Not Found' });

    expect(captured!.message).toBe('Resource X missing');
  });

  // Verifica che 404 senza body usi il messaggio di default.
  it('on 404 falls back to default message when no backend error is provided', () => {
    let captured: { message: string } | null = null;
    http.get('/x').subscribe({ error: e => (captured = e) });

    httpMock.expectOne('/x').flush(null, { status: 404, statusText: 'Not Found' });

    expect(captured!.message).toMatch(/Risorsa non trovata/);
  });

  // ---------------------------------------------------------------------------
  // 422 — validation
  // ---------------------------------------------------------------------------

  // Verifica che 422 con campo 'error' usi quel messaggio.
  it('on 422 uses the backend error string when present', () => {
    let captured: { message: string } | null = null;
    http.get('/x').subscribe({ error: e => (captured = e) });

    httpMock
      .expectOne('/x')
      .flush({ error: 'Stock insufficiente' }, { status: 422, statusText: 'Unprocessable' });

    expect(captured!.message).toBe('Stock insufficiente');
  });

  // Verifica che 422 con campo 'errors' (oggetto) concateni i messaggi.
  it('on 422 joins the errors object values', () => {
    let captured: { message: string } | null = null;
    http.get('/x').subscribe({ error: e => (captured = e) });

    httpMock
      .expectOne('/x')
      .flush(
        { errors: { email: ['is invalid'], password: ['too short'] } },
        { status: 422, statusText: 'Unprocessable' },
      );

    expect(captured!.message).toContain('is invalid');
    expect(captured!.message).toContain('too short');
  });

  // Verifica che 422 senza dettagli usi messaggio generico.
  it('on 422 falls back to generic message when no details are provided', () => {
    let captured: { message: string } | null = null;
    http.get('/x').subscribe({ error: e => (captured = e) });

    httpMock.expectOne('/x').flush(null, { status: 422, statusText: 'Unprocessable' });

    expect(captured!.message).toMatch(/non sono validi/);
  });

  // ---------------------------------------------------------------------------
  // 5xx — server errors
  // ---------------------------------------------------------------------------

  // Verifica che 500 mostri il messaggio generico server error.
  it('on 500 shows a server error notification', () => {
    let captured: { message: string } | null = null;
    http.get('/x').subscribe({ error: e => (captured = e) });

    httpMock.expectOne('/x').flush('', { status: 500, statusText: 'Server Error' });

    expect(captured!.message).toMatch(/server/);
  });

  // Verifica che 503 ricada nello stesso branch 5xx.
  it('on 503 shows a server error notification', () => {
    let captured: { message: string } | null = null;
    http.get('/x').subscribe({ error: e => (captured = e) });

    httpMock.expectOne('/x').flush('', { status: 503, statusText: 'Unavailable' });

    expect(captured!.message).toMatch(/server/);
  });

  // ---------------------------------------------------------------------------
  // Pass-through
  // ---------------------------------------------------------------------------

  // Verifica che le risposte di successo non triggherino notifiche.
  it('does not notify on a successful response', () => {
    http.get('/x').subscribe();

    httpMock.expectOne('/x').flush({});

    expect(notify.showError).not.toHaveBeenCalled();
  });
});
