import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth-service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: { getToken: () => string | null };

  beforeEach(() => {
    auth = { getToken: () => null };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // Verifica che se il token esiste l'header Authorization Bearer venga aggiunto.
  it('adds Authorization Bearer header when token exists', () => {
    auth.getToken = () => 'fake-jwt';

    http.get('/test').subscribe();

    const req = httpMock.expectOne('/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-jwt');
    req.flush({});
  });

  // Verifica che senza token la richiesta non venga modificata.
  it('does not add Authorization header when token is missing', () => {
    auth.getToken = () => null;

    http.get('/test').subscribe();

    const req = httpMock.expectOne('/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  // Verifica che gli header preesistenti vengano conservati.
  it('preserves existing headers when token exists', () => {
    auth.getToken = () => 'tok';

    http.get('/test', { headers: { 'X-Custom': '1' } }).subscribe();

    const req = httpMock.expectOne('/test');
    expect(req.request.headers.get('X-Custom')).toBe('1');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    req.flush({});
  });
});
