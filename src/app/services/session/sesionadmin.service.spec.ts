import { TestBed } from '@angular/core/testing';

import { SesionAdminService } from './sesionadmin.service';

describe('SesionadminService', () => {
  let service: SesionAdminService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SesionAdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
