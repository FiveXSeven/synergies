import { Component, inject, OnInit } from '@angular/core';
import { AgroEchoCardComponent } from '../../components/agro-echo-card/agro-echo-card.component';
import { HeaderPageComponent } from '../../components/header-page/header-page.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { PublicationService } from "../../services/publication.service";
import { Publication } from "../../models/publication.model";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-agro-echo-pages',
  standalone: true,
  imports: [AgroEchoCardComponent, HeaderPageComponent, PaginationComponent, CommonModule, FormsModule, TranslatePipe],
  templateUrl: './agro-echo-pages.component.html',
  styleUrl: './agro-echo-pages.component.scss'
})
export class AgroEchoPagesComponent implements OnInit {
    publicationService = inject(PublicationService);
    private seo = inject(SeoService);
    publications: Publication[] = [];
    filteredPublications: Publication[] = [];
    
    searchQuery = '';
    sortBy = 'recent';

    // Pagination
    currentPage = 1;
    itemsPerPage = 9;
    totalPages = 1;
    paginatedPublications: Publication[] = [];

    constructor() {
        this.seo.setPageMeta('Agro-Échos', "L'actualité de l'agroécologie en Afrique de l'Ouest");
    }

    ngOnInit(): void {
        this.publicationService.getPublications().subscribe(docs => {
            this.publications = docs.filter(p => p.type === 'agro');
            this.filterPublications();
        });
    }

    filterPublications(): void {
        let filtered = [...this.publications];

        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(p => 
                p.title?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.location?.toLowerCase().includes(query) ||
                p.userDisplayName?.toLowerCase().includes(query)
            );
        }

        switch (this.sortBy) {
            case 'recent':
                filtered = filtered.sort((a, b) => 
                    new Date(b.eventDate || b.createdAt).getTime() - 
                    new Date(a.eventDate || a.createdAt).getTime()
                );
                break;
            case 'oldest':
                filtered = filtered.sort((a, b) => 
                    new Date(a.eventDate || a.createdAt).getTime() - 
                    new Date(b.eventDate || b.createdAt).getTime()
                );
                break;
            case 'alpha':
                filtered = filtered.sort((a, b) => 
                    (a.title || '').localeCompare(b.title || '')
                );
                break;
        }

        this.filteredPublications = filtered;
        this.currentPage = 1;
        this.updatePagination();
    }

    updatePagination(): void {
        this.totalPages = Math.max(1, Math.ceil(this.filteredPublications.length / this.itemsPerPage));
        const start = (this.currentPage - 1) * this.itemsPerPage;
        this.paginatedPublications = this.filteredPublications.slice(start, start + this.itemsPerPage);
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.updatePagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    setSortBy(sort: string): void {
        this.sortBy = sort;
        this.filterPublications();
    }

    clearSearch(): void {
        this.searchQuery = '';
        this.filterPublications();
    }

    resetFilters(): void {
        this.searchQuery = '';
        this.sortBy = 'recent';
        this.filterPublications();
    }
}
