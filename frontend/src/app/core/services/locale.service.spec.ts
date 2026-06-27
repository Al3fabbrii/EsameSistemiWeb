import { TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { vi } from 'vitest';

import { LocaleService } from './locale.service';
import { NotificationService } from './notification.service';

describe('LocaleService', () => {
  let notify: { showInfo: ReturnType<typeof vi.fn> };

  function setup(localeId: string): LocaleService {
    notify = { showInfo: vi.fn() };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: LOCALE_ID, useValue: localeId },
        { provide: NotificationService, useValue: notify },
      ],
    });
    return TestBed.inject(LocaleService);
  }

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // languages
  // ---------------------------------------------------------------------------

  // Verifica che siano disponibili i locale 'it' ed 'en'.
  it('exposes both it and en as supported languages', () => {
    const service = setup('it');
    const codes = service.languages.map(l => l.code);

    expect(codes).toContain('it');
    expect(codes).toContain('en');
  });

  // ---------------------------------------------------------------------------
  // currentLanguage (branch coverage)
  // ---------------------------------------------------------------------------

  // Verifica che currentLanguage sia 'it' quando LOCALE_ID è 'it'.
  it('currentLanguage returns the language matching LOCALE_ID', () => {
    const service = setup('it');
    expect(service.currentLanguage.code).toBe('it');
  });

  // Verifica che currentLanguage sia 'en' quando LOCALE_ID è 'en'.
  it('currentLanguage returns en when LOCALE_ID is en', () => {
    const service = setup('en');
    expect(service.currentLanguage.code).toBe('en');
  });

  // Verifica che currentLanguage faccia fallback alla prima lingua se LOCALE_ID è sconosciuto.
  it('currentLanguage falls back to the first language for unknown LOCALE_ID', () => {
    const service = setup('xx');
    expect(service.currentLanguage.code).toBe('it');
  });

  // ---------------------------------------------------------------------------
  // switchLanguage
  // ---------------------------------------------------------------------------

  // Verifica che switchLanguage non faccia nulla se la lingua è già selezionata.
  it('switchLanguage does nothing when the requested language is current', () => {
    const service = setup('it');
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    service.switchLanguage('it');

    expect(setItemSpy).not.toHaveBeenCalled();
    expect(notify.showInfo).not.toHaveBeenCalled();
  });

  // Verifica che switchLanguage salvi la preferenza in localStorage.
  it('switchLanguage persists the new language in localStorage', () => {
    const service = setup('it');

    service.switchLanguage('en');

    expect(localStorage.getItem('preferredLanguage')).toBe('en');
  });

  // Verifica che in dev mode (localhost) venga mostrato un info notify.
  it('switchLanguage shows an info notification in dev mode', () => {
    const service = setup('it');

    service.switchLanguage('en');

    expect(notify.showInfo).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // preferredLanguage
  // ---------------------------------------------------------------------------

  // Verifica che preferredLanguage legga il valore da localStorage.
  it('preferredLanguage returns the value stored in localStorage', () => {
    localStorage.setItem('preferredLanguage', 'en');

    const service = setup('it');

    expect(service.preferredLanguage).toBe('en');
  });

  // Verifica che preferredLanguage sia null se non è stato salvato nulla.
  it('preferredLanguage returns null when nothing is stored', () => {
    const service = setup('it');
    expect(service.preferredLanguage).toBeNull();
  });
});
