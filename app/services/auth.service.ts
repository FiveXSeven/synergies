import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, BehaviorSubject, tap, map, catchError, of } from "rxjs";
import { User } from "../models/user.model";
import { environment } from "../../environments/environment";

@Injectable({
    providedIn: "root",
})
export class AuthService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/auth`;
    
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    public get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    constructor() {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                this.currentUserSubject.next(JSON.parse(savedUser));
            } catch {
                // Si le JSON est corrompu, nettoyer
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
    }

    // Connexion
    login(email: string, pin: string): Observable<{ token: string, user: User }> {
        return this.http.post<{ token: string, user: User }>(`${this.apiUrl}/login`, { email, pin }).pipe(
            tap(res => {
                localStorage.setItem('token', res.token);
                localStorage.setItem('user', JSON.stringify(res.user));
                this.currentUserSubject.next(res.user);
            })
        );
    }

    // Inscription
    register(email: string, pin: string, name?: string): Observable<{ token: string, user: User }> {
        return this.http.post<{ token: string, user: User }>(`${this.apiUrl}/register`, { email, pin, name }).pipe(
            tap(res => {
                localStorage.setItem('token', res.token);
                localStorage.setItem('user', JSON.stringify(res.user));
                this.currentUserSubject.next(res.user);
            })
        );
    }

    // Déconnexion
    signOut(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
    }

    // Vérifier si l'utilisateur est connecté
    isLoggedIn(): Observable<boolean> {
        return this.currentUser$.pipe(map(user => !!user));
    }

    // Vérifier le token côté serveur
    verifyToken(): Observable<User | null> {
        const token = localStorage.getItem('token');
        if (!token) {
            return of(null);
        }
        return this.http.get<User>(`${this.apiUrl}/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).pipe(
            tap(user => {
                localStorage.setItem('user', JSON.stringify(user));
                this.currentUserSubject.next(user);
            }),
            catchError(() => {
                // Token invalide ou expiré → déconnecter
                this.signOut();
                return of(null);
            })
        );
    }
}
