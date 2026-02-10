import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PublicationService } from '../../services/publication.service';
import { Publication } from '../../models/publication.model';
import { SocialShareComponent } from '../../components/social-share/social-share.component';
import { CommentSectionComponent } from '../../components/comment-section/comment-section.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-publication-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SocialShareComponent, CommentSectionComponent, TranslatePipe],
  templateUrl: './publication-detail-page.component.html',
  styleUrl: './publication-detail-page.component.scss'
})
export class PublicationDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private publicationService = inject(PublicationService);
  private seo = inject(SeoService);
  
  publication: Publication | null = null;
  isLoading = true;
  errorMessage = '';
  selectedImage: string | null = null;
  selectedImageIndex = 0;

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
        if (typeof data.photoUrls === 'string') {
          this.publication.photoUrls = JSON.parse(data.photoUrls);
        }
        this.isLoading = false;
        // Set SEO meta
        this.seo.setPageMeta(
          data.title,
          data.description,
          this.getImageUrl(data.photoUrls[0])
        );
      },
      error: () => {
        this.errorMessage = "Erreur lors du chargement de la publication.";
        this.isLoading = false;
      }
    });
  }

  getImageUrl(path: string): string {
    return this.publicationService.getImageUrl(path);
  }

  get shareUrl(): string {
    return typeof window !== 'undefined' ? window.location.href : '';
  }

  openImage(photo: string, index: number): void {
    this.selectedImage = photo;
    this.selectedImageIndex = index;
  }

  closeImage(): void {
    this.selectedImage = null;
  }

  prevImage(): void {
    if (this.publication && this.selectedImageIndex > 0) {
      this.selectedImageIndex--;
      this.selectedImage = this.publication.photoUrls[this.selectedImageIndex];
    }
  }

  nextImage(): void {
    if (this.publication && this.selectedImageIndex < this.publication.photoUrls.length - 1) {
      this.selectedImageIndex++;
      this.selectedImage = this.publication.photoUrls[this.selectedImageIndex];
    }
  }
}
