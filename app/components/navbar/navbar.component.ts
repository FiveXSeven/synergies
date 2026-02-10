import { Component, HostListener, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink, RouterModule } from "@angular/router";
import { User } from "../../models/user.model";
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
    showLogoutConfirm = false;
    authService = inject(AuthService);
    user$: Observable<User | null> = this.authService.currentUser$;
    router = inject(Router);

    toggleMenu(): void {
        this.isMenuOpen = !this.isMenuOpen;
    }

    setActive(linkName: string): void {
        this.activeLink = linkName;
        this.isMenuOpen = false;
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

    showLogoutDialog(): void {
        this.showLogoutConfirm = true;
        this.isMenuOpen = false;
    }

    cancelLogout(): void {
        this.showLogoutConfirm = false;
    }

    confirmLogout(): void {
        this.showLogoutConfirm = false;
        this.authService.signOut();
        this.router.navigate(["/"]);
    }
}
