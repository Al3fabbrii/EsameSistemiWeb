import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { NotificationService } from './notification.service';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocaleService {
  private localeId = inject(LOCALE_ID);
  private notify = inject(NotificationService);

  // Lingue supportate
  readonly languages: Language[] = [
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
  ];

  // Ottieni la lingua corrente
  get currentLanguage(): Language {
    return this.languages.find(lang => lang.code === this.localeId) || this.languages[0];
  }

  // Cambia lingua (ricarica la pagina con il nuovo locale)
  switchLanguage(languageCode: string): void {
    if (languageCode === this.localeId) {
      return; // Lingua già selezionata
    }

    // Salva la preferenza in localStorage
    localStorage.setItem('preferredLanguage', languageCode);

    // In development, mostra un messaggio informativo
    if (this.isDevMode()) {
      this.notify.showInfo(
        `Per cambiare lingua in ${this.getLanguageName(languageCode)}, riavvia con: ng serve --configuration=${languageCode}. Preferenza salvata.`
      );
      return;
    }

    // In produzione, naviga alla versione localizzata
    window.location.reload();
  }

  // Verifica se siamo in development mode
  private isDevMode(): boolean {
    return !window.location.port ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
  }

  // Ottieni il nome della lingua dal codice
  private getLanguageName(code: string): string {
    return this.languages.find(lang => lang.code === code)?.name || code;
  }

  // Ottieni la lingua preferita dall'utente (da localStorage)
  get preferredLanguage(): string | null {
    return localStorage.getItem('preferredLanguage');
  }
}
