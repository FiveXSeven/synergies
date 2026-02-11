import { Component, HostListener, inject, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { User } from "../../models/user.model";
import { Observable, Subscription } from "rxjs";
import { AuthService } from "../../services/auth.service";
import { TranslationService } from "../../services/translation.service";
import { TranslatePipe } from "../../pipes/translate.pipe";

@Component({
    selector: "app-navbar",
    standalone: true,
    imports: [CommonModule, RouterModule, RouterLink, FormsModule, TranslatePipe],
    templateUrl: "./navbar.component.html",
    styleUrls: ["./navbar.component.scss"],
})
export class NavbarComponent implements OnDestroy {
    isMenuOpen = false;
    activeLink = "Accueil";
    showLogoutConfirm = false;
    showSearch = false;
    searchQuery = '';
    private sub!: Subscription;

    authService = inject(AuthService);
    translationService = inject(TranslationService);
    user$: Observable<User | null> = this.authService.currentUser$;
    router = inject(Router);
    currentLang = this.translationService.currentLang;

    constructor() {
        this.sub = this.translationService.currentLang$.subscribe(lang => this.currentLang = lang);
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    toggleMenu(): void {
        this.isMenuOpen = !this.isMenuOpen;
    }

    setActive(linkName: string): void {
        this.activeLink = linkName;
        this.isMenuOpen = false;
    }

    toggleSearch(): void {
        this.showSearch = !this.showSearch;
        if (!this.showSearch) {
            this.searchQuery = '';
        }
    }

    onSearch(): void {
        if (this.searchQuery.trim()) {
            this.router.navigate(['/reportages'], { queryParams: { search: this.searchQuery.trim() } });
            this.showSearch = false;
            this.searchQuery = '';
            this.isMenuOpen = false;
        }
    }

    toggleLanguage(): void {
        this.translationService.toggleLanguage();
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
