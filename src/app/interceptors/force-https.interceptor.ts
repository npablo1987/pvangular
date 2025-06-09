import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

/**
 * Interceptor que asegura que todas las solicitudes HTTP utilicen HTTPS.
 */
@Injectable()
export class ForceHttpsInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (environment.production && req.url.startsWith('http://')) {
      const secureUrl = 'https://' + req.url.substring('http://'.length);
      const secureReq = req.clone({ url: secureUrl });
      return next.handle(secureReq);
    }
    return next.handle(req);
  }
}
