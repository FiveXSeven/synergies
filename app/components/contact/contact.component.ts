import { Component, inject, OnDestroy } from '@angular/core';
import { HeaderPageComponent } from '../header-page/header-page.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TranslationService } from '../../services/translation.service';
import { SeoService } from '../../services/seo.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [HeaderPageComponent, TranslatePipe],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnDestroy {
    private translationService = inject(TranslationService);
    private seo = inject(SeoService);
    currentLang = this.translationService.currentLang;
    private sub: Subscription;

    constructor() {
        this.seo.setPageMeta('Contact', 'Contactez Synergies Africa');
        this.sub = this.translationService.currentLang$.subscribe(lang => this.currentLang = lang);
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }
}
