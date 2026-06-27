import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let snackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    snackBar = { open: vi.fn() };

    TestBed.configureTestingModule({
      providers: [{ provide: MatSnackBar, useValue: snackBar }],
    });
    service = TestBed.inject(NotificationService);
  });

  // ---------------------------------------------------------------------------
  // showError
  // ---------------------------------------------------------------------------

  // Verifica che showError apra una snackbar con la classe error-snackbar.
  it('showError opens snackbar with error-snackbar class', () => {
    service.showError('boom');

    expect(snackBar.open).toHaveBeenCalledWith(
      'boom',
      'Chiudi',
      expect.objectContaining({ panelClass: ['error-snackbar'] }),
    );
  });

  // Verifica che showError usi 5000ms di durata di default.
  it('showError uses 5000ms duration by default', () => {
    service.showError('boom');

    expect(snackBar.open).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ duration: 5000 }),
    );
  });

  // Verifica che showError accetti una durata custom.
  it('showError accepts a custom duration', () => {
    service.showError('boom', 1000);

    expect(snackBar.open).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ duration: 1000 }),
    );
  });

  // ---------------------------------------------------------------------------
  // showSuccess
  // ---------------------------------------------------------------------------

  // Verifica che showSuccess apra una snackbar con la classe success-snackbar.
  it('showSuccess opens snackbar with success-snackbar class', () => {
    service.showSuccess('done');

    expect(snackBar.open).toHaveBeenCalledWith(
      'done',
      'Chiudi',
      expect.objectContaining({ panelClass: ['success-snackbar'] }),
    );
  });

  // Verifica che showSuccess usi 3000ms di durata di default.
  it('showSuccess uses 3000ms duration by default', () => {
    service.showSuccess('done');

    expect(snackBar.open).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ duration: 3000 }),
    );
  });

  // ---------------------------------------------------------------------------
  // showInfo
  // ---------------------------------------------------------------------------

  // Verifica che showInfo apra una snackbar con la classe info-snackbar.
  it('showInfo opens snackbar with info-snackbar class', () => {
    service.showInfo('hello');

    expect(snackBar.open).toHaveBeenCalledWith(
      'hello',
      'Chiudi',
      expect.objectContaining({ panelClass: ['info-snackbar'] }),
    );
  });

  // ---------------------------------------------------------------------------
  // showWarning
  // ---------------------------------------------------------------------------

  // Verifica che showWarning apra una snackbar con la classe warning-snackbar.
  it('showWarning opens snackbar with warning-snackbar class', () => {
    service.showWarning('careful');

    expect(snackBar.open).toHaveBeenCalledWith(
      'careful',
      'Chiudi',
      expect.objectContaining({ panelClass: ['warning-snackbar'] }),
    );
  });

  // Verifica che showWarning usi 4000ms di durata di default.
  it('showWarning uses 4000ms duration by default', () => {
    service.showWarning('careful');

    expect(snackBar.open).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ duration: 4000 }),
    );
  });
});
