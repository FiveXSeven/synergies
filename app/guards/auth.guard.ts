import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { map, take, tap } from "rxjs/operators";

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.user$.pipe(
        take(1), // Prend la première valeur émise (l'état actuel) et se désinscrit
        map((user) => !!user), // Convertit l'objet utilisateur en booléen (true si connecté, false sinon)
        tap((isLoggedIn) => {
            if (!isLoggedIn) {
                console.log(
                    "Accès refusé - redirection vers la page de connexion"
                );
                router.navigate(["/"]); // Ou une page de connexion dédiée si vous en avez une
            }
        })
    );
};
