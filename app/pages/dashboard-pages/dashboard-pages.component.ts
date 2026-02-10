import { Component, inject, OnInit } from "@angular/core";
import { HeaderPageComponent } from "../../components/header-page/header-page.component";
import { AsyncPipe, NgIf, NgFor, CommonModule } from "@angular/common";
import { AuthService } from "../../services/auth.service";
import { PublicationService, DashboardStats } from "../../services/publication.service";
import { User } from "../../models/user.model";
import { Publication } from "../../models/publication.model";
import { Observable, take } from "rxjs";
import { RouterLink, Router } from "@angular/router";
import { TranslatePipe } from "../../pipes/translate.pipe";
import { SeoService } from "../../services/seo.service";

@Component({
    selector: "app-dashboard-pages",
    standalone: true,
    imports: [HeaderPageComponent, RouterLink, AsyncPipe, NgIf, NgFor, CommonModule, TranslatePipe],
    templateUrl: "./dashboard-pages.component.html",
    styleUrl: "./dashboard-pages.component.scss",
})
export class DashboardPagesComponent implements OnInit {
    authService = inject(AuthService);
    publicationService = inject(PublicationService);
    router = inject(Router);
    private seo = inject(SeoService);
    user$: Observable<User | null> = this.authService.currentUser$;
    publications: Publication[] = [];
    stats: DashboardStats = { total: 0, reportages: 0, agroEchos: 0 };

    // Dialog state
    showDeleteConfirm = false;
    showLogoutConfirm = false;
    publicationToDelete: Publication | null = null;

    constructor() {
        this.seo.setPageMeta('Dashboard', 'Gérez vos publications');
    }

    ngOnInit(): void {
        this.loadPublications();
        this.loadStats();
    }

    loadPublications(): void {
        this.user$.pipe(take(1)).subscribe(user => {
            if (user) {
                this.publicationService.getPublicationsPaginated({ userId: user.id, limit: 100 }).subscribe({
                    next: (res) => {
                        this.publications = res.data;
                    },
                    error: () => {}
                });
            }
        });
    }

    loadStats(): void {
        this.publicationService.getStats().subscribe({
            next: (data) => this.stats = data,
            error: () => {}
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
                this.loadStats();
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
