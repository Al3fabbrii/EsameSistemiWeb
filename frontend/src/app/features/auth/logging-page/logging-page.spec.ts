import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoggingPage } from './logging-page';

describe('LoggingPage', () => {
  let component: LoggingPage;
  let fixture: ComponentFixture<LoggingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoggingPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoggingPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
