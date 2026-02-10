import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { map, take, tap } from "rxjs/operators";

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
        take(1),
        map((user) => !!user),
        tap((isLoggedIn) => {
            if (!isLoggedIn) {
                console.log(
                    "Accès refusé - redirection vers la page de connexion"
                );
                router.navigate(["/connexion"]);
            }
        })
    );
};
