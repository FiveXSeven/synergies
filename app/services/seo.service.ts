import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
    private titleService = inject(Title);
    private metaService = inject(Meta);

    setPageMeta(title: string, description: string, imageUrl?: string): void {
        const fullTitle = `${title} | Synergies Africa`;
        this.titleService.setTitle(fullTitle);
        this.metaService.updateTag({ name: 'description', content: description });
        this.metaService.updateTag({ property: 'og:title', content: fullTitle });
        this.metaService.updateTag({ property: 'og:description', content: description });
        this.metaService.updateTag({ property: 'og:type', content: 'website' });
        if (imageUrl) {
            this.metaService.updateTag({ property: 'og:image', content: imageUrl });
        }
    }

    resetMeta(): void {
        this.titleService.setTitle('Synergies Africa — Agroécologie pour une Afrique Souveraine');
        this.metaService.updateTag({
            name: 'description',
            content: "Synergies Africa promeut des pratiques agricoles durables et l'agroécologie en Afrique de l'Ouest."
        });
    }
}
