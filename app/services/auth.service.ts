import { Injectable, Inject, inject } from "@angular/core";
import {
    Auth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    User,
    authState,
} from "@angular/fire/auth";
import { Observable, from, BehaviorSubject, map, tap } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class AuthService {
    private auth: Auth = inject(Auth); // Injection moderne avec inject()

    // Observable pour suivre l'état de l'authentification
    // authState() renvoie User | null
    public readonly user$: Observable<User | null> = authState(this.auth);

    // Un BehaviorSubject pour stocker l'utilisateur actuel de manière synchrone si besoin
    // Mais user$ est généralement suffisant et plus réactif
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor() {
        // Mettre à jour currentUserSubject quand user$ change
        this.user$.subscribe((user) => this.currentUserSubject.next(user));
    }

    // Connexion avec Google
    googleSignIn(): Observable<User | null> {
        const provider = new GoogleAuthProvider();
        return from(signInWithPopup(this.auth, provider)).pipe(
            map((result) => result.user), // Extrait l'objet User de UserCredential
            tap((user) => console.log("Utilisateur connecté via Google:", user))
        );
    }

    // Déconnexion
    signOut(): Observable<void> {
        return from(signOut(this.auth)).pipe(
            tap(() => console.log("Utilisateur déconnecté"))
        );
    }

    // Pour obtenir l'utilisateur actuel de manière synchrone (si déjà chargé)
    // Attention : peut être null au chargement initial. Préférez user$ pour la réactivité.
    public get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    // Utile pour vérifier si l'utilisateur est connecté dans les gardes ou composants
    isLoggedIn(): Observable<boolean> {
        return this.user$.pipe(map((user) => !!user));
    }
}
