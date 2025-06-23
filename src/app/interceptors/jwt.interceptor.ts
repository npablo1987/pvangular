import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SesionAdminService } from '../services/session/sesionadmin.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private session: SesionAdminService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.session.getToken();
    if (token) {
      const authReq = req.clone({ setHeaders: { token } });
      return next.handle(authReq);
    }
    return next.handle(req);
  }
}
