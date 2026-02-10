import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { map, take, tap, switchMap } from "rxjs/operators";
import { of } from "rxjs";

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
        take(1),
        switchMap((user) => {
            if (!user) {
                // Pas d'utilisateur local → redirection
                router.navigate(["/connexion"]);
                return of(false);
            }
            // Vérifier le token côté serveur
            return authService.verifyToken().pipe(
                map(verifiedUser => {
                    if (!verifiedUser) {
                        router.navigate(["/connexion"]);
                        return false;
                    }
                    return true;
                })
            );
        })
    );
};
