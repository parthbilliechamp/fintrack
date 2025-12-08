import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private snackBar: MatSnackBar) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unexpected error occurred';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Server-side error
          if (error.status === 0) {
            errorMessage = 'Unable to connect to server. Please check if the backend is running on http://localhost:3000';
          } else if (error.status === 404) {
            errorMessage = error.error?.error || 'Resource not found';
          } else if (error.status === 400) {
            errorMessage = error.error?.error || 'Invalid request';
          } else if (error.status === 401) {
            errorMessage = 'Unauthorized access';
          } else if (error.status === 500) {
            errorMessage = error.error?.error || 'Server error occurred';
          } else {
            errorMessage = error.error?.error || `Error: ${error.message}`;
          }
        }

        // Show error notification
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });

        console.error('HTTP Error:', error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}

