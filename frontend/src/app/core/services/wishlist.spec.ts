import { TestBed } from '@angular/core/testing';

import { WishlistTs } from './wishlist.ts';

describe('WishlistTs', () => {
  let service: WishlistTs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WishlistTs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
