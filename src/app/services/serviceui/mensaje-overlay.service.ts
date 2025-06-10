import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface MensajeOverlayData {
  text: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class MensajeOverlayService {
  private msgSubject = new BehaviorSubject<MensajeOverlayData | null>(null);
  message$ = this.msgSubject.asObservable();

  show(
    msg: string,
    type: 'success' | 'error' | 'info' = 'info',
    durationMs = 5000
  ) {
    this.msgSubject.next({ text: msg, type });
    if (durationMs > 0) {
      setTimeout(() => this.hide(), durationMs);
    }
  }

  /**
   * Muestra un mensaje con cuenta regresiva en segundos. La cuenta se
   * actualiza cada segundo y, al finalizar, ejecuta el callback opcional.
   */
  showCountdown(msg: string, seconds: number, onFinish?: () => void) {
    let restante = seconds;
    const actualizar = () => {
      this.show(`${msg} Redirigiendo en ${restante} s…`, 'info', 0);
    };

    actualizar();
    const timer = setInterval(() => {
      restante--;
      if (restante <= 0) {
        clearInterval(timer);
        this.hide();
        if (onFinish) { onFinish(); }
      } else {
        actualizar();
      }
    }, 1000);
  }

  hide() {
    this.msgSubject.next(null);
  }
}
