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
                localStorage.removeItem('user');
            }
        }
        // Vérifier systématiquement au démarrage si le cookie est valide
        this.verifyToken().subscribe();
    }

    // Connexion
    login(email: string, pin: string): Observable<{ user: User }> {
        return this.http.post<{ user: User }>(`${this.apiUrl}/login`, { email, pin }, { withCredentials: true }).pipe(
            tap(res => {
                localStorage.setItem('user', JSON.stringify(res.user));
                this.currentUserSubject.next(res.user);
            })
        );
    }

    // Inscription
    register(email: string, pin: string, name?: string): Observable<{ user: User }> {
        return this.http.post<{ user: User }>(`${this.apiUrl}/register`, { email, pin, name }, { withCredentials: true }).pipe(
            tap(res => {
                localStorage.setItem('user', JSON.stringify(res.user));
                this.currentUserSubject.next(res.user);
            })
        );
    }

    // Déconnexion
    signOut(): void {
        this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
            next: () => {
                localStorage.removeItem('user');
                this.currentUserSubject.next(null);
            },
            error: () => {
                // Même en cas d'erreur backend, on nettoie le local
                localStorage.removeItem('user');
                this.currentUserSubject.next(null);
            }
        });
    }

    // Vérifier si l'utilisateur est connecté
    isLoggedIn(): Observable<boolean> {
        return this.currentUser$.pipe(map(user => !!user));
    }

    // Vérifier le token côté serveur (via cookie)
    verifyToken(): Observable<User | null> {
        return this.http.get<User>(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
            tap(user => {
                localStorage.setItem('user', JSON.stringify(user));
                this.currentUserSubject.next(user);
            }),
            catchError(() => {
                this.signOutLocal();
                return of(null);
            })
        );
    }

    private signOutLocal(): void {
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
    }
}
