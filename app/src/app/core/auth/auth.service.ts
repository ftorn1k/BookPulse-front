import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, catchError, Observable, of, tap} from 'rxjs';

export type MeUser = { id: number; email: string; name: string };
type AuthResponse = { token: string; user: MeUser };

@Injectable({providedIn: 'root'})
export class AuthService {
    private http = inject(HttpClient);

    private readonly baseUrl = 'http://localhost:8080/api';

    private userSubject = new BehaviorSubject<MeUser | null>(null);

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

        return this.http.get<MeUser>(`${this.baseUrl}/auth/me`).pipe(
            tap((u) => this.userSubject.next(u)),
            catchError(() => {
                this.clearSession();
                return of(null);
            })
        );
    }

    register(email: string, password: string, name = 'User') {
        return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, {email, password, name}).pipe(
            tap((resp) => this.setSession(resp.token, resp.user))
        );
    }
  
    login(email: string, password: string) {
        return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, {email, password}).pipe(
            tap((resp) => this.setSession(resp.token, resp.user))
        );
    }

    logout() {
        this.clearSession();
    }
}
