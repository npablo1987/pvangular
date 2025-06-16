import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoggerService } from '../services/logger/logger.service';

/**
 * Interceptor that logs all outgoing HTTP requests and their responses.
 */
@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  constructor(private logger: LoggerService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const started = Date.now();
    this.logger.info(`[HTTP] ${req.method} ${req.url}`);
    return next.handle(req).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            const elapsed = Date.now() - started;
            this.logger.info(`[HTTP] ${req.method} ${req.url} \u2713 (${elapsed} ms)`);
          }
        },
        error: (error: HttpErrorResponse) => {
          const elapsed = Date.now() - started;
          this.logger.error(`[HTTP] ${req.method} ${req.url} \u2717 (${elapsed} ms)`, error.message);
        }
      })
    );
  }
}
