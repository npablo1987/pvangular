import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MensajeOverlayService {
  private msgSubject = new BehaviorSubject<string | null>(null);
  message$ = this.msgSubject.asObservable();

  show(msg: string, durationMs = 5000) {
    this.msgSubject.next(msg);
    if (durationMs > 0) {
      setTimeout(() => this.hide(), durationMs);
    }
  }

  hide() {
    this.msgSubject.next(null);
  }
}
