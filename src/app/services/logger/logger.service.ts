import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class LoggerService {

  constructor() { }

  log(message: any, ...optionalParams: any[]) {
    if (!environment.production) {
      console.log('[LOG]', message, ...optionalParams);
    }
  }

  warn(message: any, ...optionalParams: any[]) {
    if (!environment.production) {
      console.warn('[WARN]', message, ...optionalParams);
    }
  }

  error(message: any, ...optionalParams: any[]) {
    if (environment.production) {
      // Aquí podrías enviar el error a un servidor remoto
      // o guardar en algún log centralizado
    } else {
      console.error('[ERROR]', message, ...optionalParams);
    }
  }

  
}
