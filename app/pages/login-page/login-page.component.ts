import { Component, inject, OnInit } from "@angular/core";
import { AsyncPipe, JsonPipe, NgIf } from "@angular/common";
import { AuthService } from "../../services/auth.service";
import { User } from "@angular/fire/auth"; // Importer User de @angular/fire/auth
import { Observable } from "rxjs";
@Component({
    selector: "app-login-page",
    imports: [AsyncPipe, JsonPipe],
    templateUrl: "./login-page.component.html",
    styleUrl: "./login-page.component.scss",
})
export class LoginPageComponent {
    authService: AuthService = inject(AuthService);
    user$: Observable<User | null> = this.authService.user$; // Utiliser l'observable user$

    constructor() {}

    ngOnInit(): void {
        // this.user$ est déjà initialisé via le service
    }

    loginWithGoogle(): void {
        this.authService.googleSignIn().subscribe({
            next: (user) => {
                if (user) {
                    console.log(
                        "Connexion réussie, utilisateur:",
                        user.displayName
                    );
                } else {
                    console.log("Popup de connexion fermée ou échec");
                }
            },
            error: (err) => console.error("Erreur de connexion Google:", err),
        });
    }

    logout(): void {
        this.authService.signOut().subscribe({
            next: () => console.log("Déconnexion réussie"),
            error: (err) => console.error("Erreur de déconnexion:", err),
        });
    }
}
