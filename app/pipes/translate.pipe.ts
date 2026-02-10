import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TranslationService } from '../services/translation.service';
import { Subscription } from 'rxjs';

@Pipe({
    name: 'translate',
    standalone: true,
    pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
    private translationService = inject(TranslationService);
    private cdr = inject(ChangeDetectorRef);
    private sub: Subscription;

    constructor() {
        this.sub = this.translationService.currentLang$.subscribe(() => {
            this.cdr.markForCheck();
        });
    }

    transform(key: string): string {
        return this.translationService.translate(key);
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }
}
