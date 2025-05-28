import { TestBed } from '@angular/core/testing';

import { ApiserviceIndapService } from './apiservice-indap.service';

describe('ApiserviceIndapService', () => {
  let service: ApiserviceIndapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiserviceIndapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
