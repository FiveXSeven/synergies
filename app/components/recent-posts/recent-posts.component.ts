import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { PublicationService } from "../../services/publication.service";
import { Publication } from "../../models/publication.model";
import { TranslatePipe } from "../../pipes/translate.pipe";

@Component({
    selector: "app-recent-posts",
    standalone: true,
    imports: [CommonModule, RouterLink, TranslatePipe],
    templateUrl: "./recent-posts.component.html",
    styleUrl: "./recent-posts.component.scss",
})
export class RecentPostsComponent implements OnInit {
    publicationService = inject(PublicationService);
    recentPosts: Publication[] = [];
    isLoading = true;

    ngOnInit(): void {
        this.publicationService.getPublications().subscribe({
            next: (docs) => {
                this.recentPosts = docs
                    .sort((a, b) => 
                        new Date(b.eventDate || b.createdAt).getTime() - 
                        new Date(a.eventDate || a.createdAt).getTime()
                    )
                    .slice(0, 6);
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
            }
        });
    }

    getImageUrl(path: string): string {
        return this.publicationService.getImageUrl(path);
    }

    getTypeLabel(type: string): string {
        return type === 'publi' ? 'Reportage' : 'Agro-Écho';
    }

    getTypeClass(type: string): string {
        return type === 'publi' ? 'type-reportage' : 'type-agro';
    }
}
