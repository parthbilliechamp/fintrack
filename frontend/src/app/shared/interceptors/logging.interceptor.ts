import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { LoggerService } from '../services/logger.service';

/**
 * HTTP Interceptor for logging all HTTP requests and responses.
 * Captures timing information and logs request/response details.
 */
@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  private contextLogger;

  constructor(private logger: LoggerService) {
    this.contextLogger = this.logger.createContextLogger('HTTP');
  }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // Log outgoing request
    this.contextLogger.debug(`Request [${requestId}]: ${request.method} ${request.urlWithParams}`, {
      headers: this.getHeadersObject(request),
      body: this.sanitizeBody(request.body)
    });

    return next.handle(request).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            const duration = Date.now() - startTime;
            this.contextLogger.http(
              request.method,
              request.urlWithParams,
              event.status,
              duration
            );
            
            this.contextLogger.debug(`Response [${requestId}]: ${event.status}`, {
              duration: `${duration}ms`,
              bodySize: JSON.stringify(event.body)?.length || 0
            });
          }
        },
        error: (error: HttpErrorResponse) => {
          const duration = Date.now() - startTime;
          this.contextLogger.error(`Request failed [${requestId}]: ${request.method} ${request.urlWithParams}`, {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            duration: `${duration}ms`,
            error: error.error
          });
        }
      }),
      finalize(() => {
        // Log when request completes (success or error)
        this.contextLogger.debug(`Request completed [${requestId}]`);
      })
    );
  }

  /**
   * Generate a unique request ID for tracking
   */
  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  /**
   * Convert headers to a plain object for logging
   */
  private getHeadersObject(request: HttpRequest<any>): Record<string, string> {
    const headers: Record<string, string> = {};
    request.headers.keys().forEach(key => {
      // Don't log sensitive headers
      if (!['authorization', 'cookie'].includes(key.toLowerCase())) {
        headers[key] = request.headers.get(key) || '';
      }
    });
    return headers;
  }

  /**
   * Sanitize request body for logging (remove sensitive data)
   */
  private sanitizeBody(body: any): any {
    if (!body) return undefined;
    
    // Clone the body to avoid modifying the original
    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}
