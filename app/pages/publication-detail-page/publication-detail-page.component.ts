import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PublicationService } from '../../services/publication.service';
import { Publication } from '../../models/publication.model';

@Component({
  selector: 'app-publication-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './publication-detail-page.component.html',
  styleUrl: './publication-detail-page.component.scss'
})
export class PublicationDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private publicationService = inject(PublicationService);
  
  publication: Publication | null = null;
  isLoading = true;
  errorMessage = '';
  selectedImage: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPublication(id);
    } else {
      this.errorMessage = "ID de publication manquant.";
      this.isLoading = false;
    }
  }

  loadPublication(id: string): void {
    this.publicationService.getPublicationById(id).subscribe({
      next: (data) => {
        this.publication = data;
        // Parse photoUrls if it's a string (though service should handle it)
        if (typeof data.photoUrls === 'string') {
          this.publication.photoUrls = JSON.parse(data.photoUrls);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = "Erreur lors du chargement de la publication.";
        this.isLoading = false;
      }
    });
  }

  getImageUrl(path: string): string {
    if (!path) return 'assets/placeholder-image.jpg';
    if (path.startsWith('http')) return path;
    return `http://localhost:3000${path}`;
  }

  openImage(photo: string): void {
    this.selectedImage = photo;
  }

  closeImage(): void {
    this.selectedImage = null;
  }
}
