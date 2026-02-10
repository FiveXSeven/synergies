import { Component, inject, OnInit } from '@angular/core';
import { AgroEchoCardComponent } from '../../components/agro-echo-card/agro-echo-card.component';
import { HeaderPageComponent } from '../../components/header-page/header-page.component';
import { PublicationService } from "../../services/publication.service";
import { Publication } from "../../models/publication.model";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: 'app-agro-echo-pages',
  standalone: true,
  imports: [AgroEchoCardComponent, HeaderPageComponent, CommonModule, FormsModule],
  templateUrl: './agro-echo-pages.component.html',
  styleUrl: './agro-echo-pages.component.scss'
})
export class AgroEchoPagesComponent implements OnInit {
    publicationService = inject(PublicationService);
    publications: Publication[] = [];
    filteredPublications: Publication[] = [];
    
    searchQuery = '';
    sortBy = 'recent';

    ngOnInit(): void {
        this.publicationService.getPublications().subscribe(docs => {
            this.publications = docs.filter(p => p.type === 'agro');
            this.filterPublications();
        });
    }

    filterPublications(): void {
        let filtered = [...this.publications];

        // Apply search filter
        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(p => 
                p.title?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query) ||
                p.location?.toLowerCase().includes(query) ||
                p.userDisplayName?.toLowerCase().includes(query)
            );
        }

        // Apply sort
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
