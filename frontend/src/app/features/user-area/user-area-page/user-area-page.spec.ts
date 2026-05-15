import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAreaPage } from './user-area-page';

describe('UserAreaPage', () => {
  let component: UserAreaPage;
  let fixture: ComponentFixture<UserAreaPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAreaPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserAreaPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
