import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';

export type MeUser = { id: number; email: string; name: string };
type AuthResponse = { token: string; user: MeUser };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private userSubject = new BehaviorSubject<MeUser | null>(null);
  user$ = this.userSubject.asObservable();

  get token(): string | null {
    return localStorage.getItem('token');
  }

  get isAuthed(): boolean {
    return !!this.token;
  }

  setSession(token: string, user?: MeUser | null) {
    localStorage.setItem('token', token);
    if (user) this.userSubject.next(user);
  }

  clearSession() {
    localStorage.removeItem('token');
    this.userSubject.next(null);
  }

  loadMe(): Observable<MeUser | null> {
    if (!this.token) {
      this.userSubject.next(null);
      return of(null);
    }

    return this.http.get<MeUser>('/api/auth/me').pipe(
      tap((u) => this.userSubject.next(u)),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  register(email: string, password: string, name = 'User') {
    return this.http.post<AuthResponse>('/api/auth/register', { email, password, name }).pipe(
      tap((resp) => this.setSession(resp.token, resp.user))
    );
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password }).pipe(
      tap((resp) => this.setSession(resp.token, resp.user))
    );
  }

  logout() {
    this.clearSession();
  }
}
