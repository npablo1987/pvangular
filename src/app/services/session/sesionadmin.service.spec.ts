import { TestBed } from '@angular/core/testing';

import { SesionadminService } from './sesionadmin.service';

describe('SesionadminService', () => {
  let service: SesionadminService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SesionadminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
