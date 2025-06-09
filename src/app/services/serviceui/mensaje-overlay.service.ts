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

  /**
   * Muestra un mensaje con cuenta regresiva en segundos. La cuenta se
   * actualiza cada segundo y, al finalizar, ejecuta el callback opcional.
   */
  showCountdown(msg: string, seconds: number, onFinish?: () => void) {
    let restante = seconds;
    const actualizar = () => {
      this.show(`${msg} Redirigiendo en ${restante} s…`, 0);
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
