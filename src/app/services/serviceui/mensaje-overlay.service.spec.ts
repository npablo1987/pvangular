import { TestBed } from '@angular/core/testing';
import { MensajeOverlayService } from './mensaje-overlay.service';

describe('MensajeOverlayService', () => {
  let service: MensajeOverlayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MensajeOverlayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
