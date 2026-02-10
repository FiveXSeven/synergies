import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { PublicationService } from "../../services/publication.service";
import { Publication } from "../../models/publication.model";

@Component({
    selector: "app-recent-posts",
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: "./recent-posts.component.html",
    styleUrl: "./recent-posts.component.scss",
})
export class RecentPostsComponent implements OnInit {
    publicationService = inject(PublicationService);
    recentPosts: Publication[] = [];
    isLoading = true;

    ngOnInit(): void {
        this.publicationService.getPublications().subscribe(docs => {
            // Get the 6 most recent posts, sorted by date
            this.recentPosts = docs
                .sort((a, b) => 
                    new Date(b.eventDate || b.createdAt).getTime() - 
                    new Date(a.eventDate || a.createdAt).getTime()
                )
                .slice(0, 6);
            this.isLoading = false;
        });
    }

    getImageUrl(path: string): string {
        if (!path) return 'https://via.placeholder.com/400x300?text=Synergies';
        if (path.startsWith('http')) return path;
        return `http://localhost:3000${path}`;
    }

    getTypeLabel(type: string): string {
        return type === 'publi' ? 'Reportage' : 'Agro-Écho';
    }

    getTypeClass(type: string): string {
        return type === 'publi' ? 'type-reportage' : 'type-agro';
    }
}
