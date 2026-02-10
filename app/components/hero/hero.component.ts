import { Component, inject, OnDestroy } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AboutComponent } from "../about/about.component";
import { RecentPostsComponent } from "../recent-posts/recent-posts.component";
import { FooterComponent } from "../footer/footer.component";
import { TranslatePipe } from "../../pipes/translate.pipe";
import { TranslationService } from "../../services/translation.service";
import { SeoService } from "../../services/seo.service";
import { Subscription } from "rxjs";

@Component({
    selector: "app-hero",
    standalone: true,
    imports: [
        RouterLink,
        AboutComponent, 
        RecentPostsComponent,
        FooterComponent,
        TranslatePipe
    ],
    templateUrl: "./hero.component.html",
    styleUrl: "./hero.component.scss",
})
export class HeroComponent implements OnDestroy {
    private translationService = inject(TranslationService);
    private seo = inject(SeoService);
    currentLang = this.translationService.currentLang;
    private sub: Subscription;

    constructor() {
        this.seo.resetMeta();
        this.sub = this.translationService.currentLang$.subscribe(lang => this.currentLang = lang);
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }
}
