import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { LoggingPage } from './logging-page';
import { AuthService } from '../../../core/services/auth-service';

describe('LoggingPage', () => {
  let fixture: ComponentFixture<LoggingPage>;
  let component: LoggingPage;
  let auth: { login: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    auth = { login: vi.fn().mockReturnValue(of({ token: 't', user: {} })) };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [LoggingPage],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoggingPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // ---------------------------------------------------------------------------
  // Form validation (branch coverage)
  // ---------------------------------------------------------------------------

  // Verifica che il form sia inizialmente non valido (campi vuoti).
  it('initializes with an invalid form', () => {
    expect(component.loginForm.invalid).toBe(true);
  });

  // Verifica che con email malformata il form sia non valido.
  it('marks form as invalid when email format is wrong', () => {
    component.loginForm.setValue({ email: 'not-an-email', password: 'pass' });
    expect(component.loginForm.invalid).toBe(true);
  });

  // Verifica che con email e password valide il form sia valido.
  it('marks form as valid when email and password are well-formed', () => {
    component.loginForm.setValue({ email: 'a@b.it', password: 'pass' });
    expect(component.loginForm.valid).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // onSubmit — invalid form
  // ---------------------------------------------------------------------------

  // Verifica che onSubmit non chiami login se il form non è valido.
  it('does not call AuthService.login when form is invalid', () => {
    component.loginForm.setValue({ email: '', password: '' });
    component.onSubmit();
    expect(auth.login).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // onSubmit — success path
  // ---------------------------------------------------------------------------

  // Verifica che con form valido onSubmit chiami AuthService.login con i valori.
  it('calls AuthService.login with the form email and password', () => {
    component.loginForm.setValue({ email: 'a@b.it', password: 'secret' });
    component.onSubmit();
    expect(auth.login).toHaveBeenCalledWith('a@b.it', 'secret');
  });

  // Verifica che dopo login con successo l'utente venga reindirizzato a /products.
  it('navigates to /products on successful login', () => {
    component.loginForm.setValue({ email: 'a@b.it', password: 'secret' });
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/products']);
  });

  // ---------------------------------------------------------------------------
  // onSubmit — error path
  // ---------------------------------------------------------------------------

  // Verifica che in caso di errore venga impostato un errorMessage e isLoading false.
  it('sets errorMessage and stops loading on login error', () => {
    auth.login.mockReturnValue(
      throwError(() => ({ error: { error: 'Wrong credentials' } })),
    );
    component.loginForm.setValue({ email: 'a@b.it', password: 'bad' });
    component.onSubmit();

    expect(component.errorMessage).toBe('Wrong credentials');
    expect(component.isLoading).toBe(false);
  });

  // Verifica che in caso di errore senza dettagli backend usi un messaggio di default.
  it('uses default error message when backend does not provide one', () => {
    auth.login.mockReturnValue(throwError(() => ({})));
    component.loginForm.setValue({ email: 'a@b.it', password: 'bad' });
    component.onSubmit();

    expect(component.errorMessage).toBe('Login fallito');
  });
});
