import { TestBed } from '@angular/core/testing';

import { FichaselecionadaService } from './fichaselecionada.service';

describe('FichaselecionadaService', () => {
  let service: FichaselecionadaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FichaselecionadaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
