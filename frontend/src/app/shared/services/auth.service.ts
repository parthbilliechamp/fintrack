import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { User } from '../interfaces/user.interface';
import { LocalStorageService } from './local-storage.service';
import { LoggerService, ContextLogger } from './logger.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly CURRENT_USER_KEY = 'currentUser';
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  private logger: ContextLogger;

  constructor(
    private http: HttpClient,
    private localStorage: LocalStorageService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createContextLogger('AuthService');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      this.localStorage.getItem(this.CURRENT_USER_KEY)
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
    
    if (this.currentUserSubject.value) {
      this.logger.info('User session restored from storage', { userId: this.currentUserSubject.value.id });
    }
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  register(user: Omit<User, 'id'>): Observable<User> {
    this.logger.debug('Registration attempt', { email: user.email, name: user.name });
    return this.http.post<User>(`${this.API_URL}/register`, user).pipe(
      tap(registeredUser => {
        this.logger.info('User registered successfully', { userId: registeredUser.id, email: registeredUser.email });
        this.localStorage.setItem(this.CURRENT_USER_KEY, registeredUser);
        this.currentUserSubject.next(registeredUser);
      }),
      catchError(error => {
        this.logger.error('Registration failed', { email: user.email, error: error.message });
        throw error;
      })
    );
  }

  login(email: string, password: string): Observable<User> {
    this.logger.debug('Login attempt', { email });
    return this.http.post<User>(`${this.API_URL}/login`, { email, password }).pipe(
      tap(user => {
        this.logger.info('User logged in successfully', { userId: user.id, email: user.email });
        this.localStorage.setItem(this.CURRENT_USER_KEY, user);
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        this.logger.error('Login failed', { email, error: error.message });
        throw error;
      })
    );
  }

  logout(): void {
    const user = this.currentUserSubject.value;
    this.logger.info('User logged out', { userId: user?.id });
    this.localStorage.removeItem(this.CURRENT_USER_KEY);
    this.currentUserSubject.next(null);
  }
}
