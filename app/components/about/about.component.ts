import { Component, inject, OnDestroy } from "@angular/core";
import { TranslatePipe } from "../../pipes/translate.pipe";
import { TranslationService } from "../../services/translation.service";
import { Subscription } from "rxjs";

@Component({
    selector: "app-about",
    standalone: true,
    imports: [TranslatePipe],
    templateUrl: "./about.component.html",
    styleUrl: "./about.component.scss",
})
export class AboutComponent implements OnDestroy {
    private translationService = inject(TranslationService);
    currentLang = this.translationService.currentLang;
    private sub: Subscription;

    constructor() {
        this.sub = this.translationService.currentLang$.subscribe(lang => this.currentLang = lang);
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }
}
