import { Component, inject, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { TranslatePipe } from "../../pipes/translate.pipe";
import { TranslationService } from "../../services/translation.service";
import { Subscription } from "rxjs";

@Component({
    selector: "app-footer",
    standalone: true,
    imports: [CommonModule, RouterLink, TranslatePipe],
    templateUrl: "./footer.component.html",
    styleUrls: ["./footer.component.scss"],
})
export class FooterComponent implements OnDestroy {
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
