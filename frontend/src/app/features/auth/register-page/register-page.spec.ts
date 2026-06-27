import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { RegisterPage } from './register-page';
import { AuthService } from '../../../core/services/auth-service';

describe('RegisterPage', () => {
  let fixture: ComponentFixture<RegisterPage>;
  let component: RegisterPage;
  let auth: { register: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    auth = { register: vi.fn().mockReturnValue(of({ token: 't', user: {} })) };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // ---------------------------------------------------------------------------
  // Form validation
  // ---------------------------------------------------------------------------

  // Verifica che il form sia inizialmente non valido.
  it('initializes with an invalid form', () => {
    expect(component.registerForm.invalid).toBe(true);
  });

  // Verifica che con email malformata il form sia non valido.
  it('marks form invalid for malformed email', () => {
    component.registerForm.setValue({ email: 'not-email', password: 'pass' });
    expect(component.registerForm.invalid).toBe(true);
  });

  // Verifica che con email e password valide il form sia valido.
  it('marks form valid for well-formed email and password', () => {
    component.registerForm.setValue({ email: 'a@b.it', password: 'pass' });
    expect(component.registerForm.valid).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // onSubmit — invalid form
  // ---------------------------------------------------------------------------

  // Verifica che onSubmit non chiami register se il form è invalido.
  it('does not call AuthService.register when form is invalid', () => {
    component.onSubmit();
    expect(auth.register).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // onSubmit — success path
  // ---------------------------------------------------------------------------

  // Verifica che onSubmit chiami register con email e password.
  it('calls AuthService.register with the form values', () => {
    component.registerForm.setValue({ email: 'a@b.it', password: 'secret' });
    component.onSubmit();
    expect(auth.register).toHaveBeenCalledWith('a@b.it', 'secret');
  });

  // Verifica che dopo register con successo l'utente venga reindirizzato a /products.
  it('navigates to /products on successful registration', () => {
    component.registerForm.setValue({ email: 'a@b.it', password: 'secret' });
    component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/products']);
  });

  // ---------------------------------------------------------------------------
  // onSubmit — error path
  // ---------------------------------------------------------------------------

  // Verifica che in caso di errore venga impostato un errorMessage dal backend.
  it('sets backend error message when registration fails', () => {
    auth.register.mockReturnValue(throwError(() => ({ error: { error: 'Email taken' } })));
    component.registerForm.setValue({ email: 'a@b.it', password: 'secret' });
    component.onSubmit();

    expect(component.errorMessage).toBe('Email taken');
    expect(component.isLoading).toBe(false);
  });

  // Verifica che in caso di errore generico venga usato il messaggio di default.
  it('uses default error message when backend does not provide one', () => {
    auth.register.mockReturnValue(throwError(() => ({})));
    component.registerForm.setValue({ email: 'a@b.it', password: 'secret' });
    component.onSubmit();

    expect(component.errorMessage).toBe('Registrazione fallita');
  });
});
