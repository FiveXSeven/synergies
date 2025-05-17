import { Component, HostListener, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink, RouterModule } from "@angular/router";
import { User } from "firebase/auth";
import { Observable } from "rxjs";
import { AuthService } from "../../services/auth.service";

@Component({
    selector: "app-navbar",
    standalone: true,
    imports: [CommonModule, RouterModule, RouterLink],
    templateUrl: "./navbar.component.html",
    styleUrls: ["./navbar.component.scss"],
})
export class NavbarComponent {
    isMenuOpen = false;
    activeLink = "Accueil";
    authService: AuthService = inject(AuthService);
    user$: Observable<User | null> = this.authService.user$;
    router: Router = inject(Router);

    toggleMenu(): void {
        this.isMenuOpen = !this.isMenuOpen;
    }

    setActive(linkName: string): void {
        this.activeLink = linkName;
        this.isMenuOpen = false; // Ferme le menu mobile après sélection
    }

    @HostListener("document:click", ["$event"])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        const menu = document.getElementById("main-menu");
        const toggle = document.getElementById("menu-toggle");

        if (
            this.isMenuOpen &&
            !menu?.contains(target) &&
            !toggle?.contains(target)
        ) {
            this.isMenuOpen = false;
        }
    }

    logout(): void {
        this.authService.signOut().subscribe({
            next: () => {
                console.log("Déconnexion réussie");
                this.router.navigate(["/"]); // Redirection vers la page d’accueil
            },
            error: (err) => console.error("Erreur de déconnexion:", err),
        });
    }
}
