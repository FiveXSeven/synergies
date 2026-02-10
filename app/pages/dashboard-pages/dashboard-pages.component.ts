import { Component, inject, OnInit } from "@angular/core";
import { HeaderPageComponent } from "../../components/header-page/header-page.component";
import { AsyncPipe, NgIf, NgFor, CommonModule } from "@angular/common";
import { AuthService } from "../../services/auth.service";
import { PublicationService } from "../../services/publication.service";
import { User } from "../../models/user.model";
import { Publication } from "../../models/publication.model";
import { Observable, take } from "rxjs";
import { RouterLink, Router } from "@angular/router";

@Component({
    selector: "app-dashboard-pages",
    standalone: true,
    imports: [HeaderPageComponent, RouterLink, AsyncPipe, NgIf, NgFor, CommonModule],
    templateUrl: "./dashboard-pages.component.html",
    styleUrl: "./dashboard-pages.component.scss",
})
export class DashboardPagesComponent implements OnInit {
    authService = inject(AuthService);
    publicationService = inject(PublicationService);
    router = inject(Router);
    user$: Observable<User | null> = this.authService.currentUser$;
    publications: Publication[] = [];

    // Dialog state
    showDeleteConfirm = false;
    showLogoutConfirm = false;
    publicationToDelete: Publication | null = null;

    ngOnInit(): void {
        this.loadPublications();
    }

    loadPublications(): void {
        this.user$.pipe(take(1)).subscribe(user => {
            if (user) {
                this.publicationService.getPublications().subscribe(all => {
                    this.publications = all.filter(p => p.userId === user.id);
                });
            }
        });
    }

    // Delete dialog
    showDeleteDialog(pub: Publication): void {
        this.publicationToDelete = pub;
        this.showDeleteConfirm = true;
    }

    cancelDelete(): void {
        this.showDeleteConfirm = false;
        this.publicationToDelete = null;
    }

    confirmDelete(): void {
        if (this.publicationToDelete?.id) {
            this.publicationService.deletePublication(this.publicationToDelete.id).subscribe(() => {
                this.loadPublications();
            });
        }
        this.showDeleteConfirm = false;
        this.publicationToDelete = null;
    }

    // Logout dialog
    showLogoutDialog(): void {
        this.showLogoutConfirm = true;
    }

    cancelLogout(): void {
        this.showLogoutConfirm = false;
    }

    confirmLogout(): void {
        this.showLogoutConfirm = false;
        this.authService.signOut();
        this.router.navigate(['/connexion']);
    }
}
