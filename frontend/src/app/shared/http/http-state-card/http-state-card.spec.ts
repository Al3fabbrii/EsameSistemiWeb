import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { HttpStateCard } from './http-state-card';

describe('HttpStateCard', () => {
  let fixture: ComponentFixture<HttpStateCard>;
  let component: HttpStateCard;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpStateCard],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(HttpStateCard);
    component = fixture.componentInstance;
  });

  // Verifica che lo stato sia inizialmente null.
  it('initializes with null state', () => {
    expect(component.state).toBeNull();
  });

  // Verifica che accettare uno stato di loading non lo modifichi.
  it('accepts a loading state via input', () => {
    component.state = { status: 'loading' };
    fixture.detectChanges();
    expect(component.state.status).toBe('loading');
  });

  // Verifica che accettare uno stato di errore mantenga il messaggio.
  it('accepts an error state with message via input', () => {
    component.state = { status: 'error', message: 'boom' };
    fixture.detectChanges();
    expect(component.state.status).toBe('error');
    expect(component.state.message).toBe('boom');
  });

  // Verifica che onRetry emetta l'evento retry.
  it('emits retry event when onRetry is called', () => {
    let emitted = false;
    component.retry.subscribe(() => (emitted = true));

    component.onRetry();

    expect(emitted).toBe(true);
  });
});
