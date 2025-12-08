import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { User } from '../interfaces/user.interface';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly CURRENT_USER_KEY = 'currentUser';
  private readonly API_URL = 'http://localhost:3000/api/auth';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private localStorage: LocalStorageService
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      this.localStorage.getItem(this.CURRENT_USER_KEY)
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  register(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/register`, user).pipe(
      tap(registeredUser => {
        this.localStorage.setItem(this.CURRENT_USER_KEY, registeredUser);
        this.currentUserSubject.next(registeredUser);
      }),
      catchError(error => {
        console.error('Registration error:', error);
        throw error;
      })
    );
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/login`, { email, password }).pipe(
      tap(user => {
        this.localStorage.setItem(this.CURRENT_USER_KEY, user);
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        console.error('Login error:', error);
        throw error;
      })
    );
  }

  logout(): void {
    this.localStorage.removeItem(this.CURRENT_USER_KEY);
    this.currentUserSubject.next(null);
  }
}
