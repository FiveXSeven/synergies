import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
    selector: 'app-social-share',
    standalone: true,
    imports: [TranslatePipe],
    template: `
        <div class="share-section">
            <h4><i class="fas fa-share-alt"></i> {{ 'share.title' | translate }}</h4>
            <div class="share-buttons">
                <a class="share-btn facebook" [href]="facebookUrl" target="_blank" rel="noopener">
                    <i class="fab fa-facebook-f"></i> {{ 'share.facebook' | translate }}
                </a>
                <a class="share-btn whatsapp" [href]="whatsappUrl" target="_blank" rel="noopener">
                    <i class="fab fa-whatsapp"></i> {{ 'share.whatsapp' | translate }}
                </a>
                <a class="share-btn twitter" [href]="twitterUrl" target="_blank" rel="noopener">
                    <i class="fab fa-twitter"></i> {{ 'share.twitter' | translate }}
                </a>
                <button class="share-btn copy" (click)="copyLink()">
                    <i class="fas" [class.fa-link]="!copied" [class.fa-check]="copied"></i> 
                    {{ copied ? ('share.copied' | translate) : ('share.copy' | translate) }}
                </button>
            </div>
        </div>
    `,
    styles: [`
        .share-section {
            padding: 1.5rem;
            background: #f8f9fa;
            border-radius: 12px;
            margin-top: 1rem;
        }
        h4 {
            font-size: 1rem;
            color: #1b4332;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .share-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        .share-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.55rem 1rem;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 500;
            text-decoration: none;
            border: none;
            cursor: pointer;
            color: white;
            transition: transform 0.15s, opacity 0.15s;
        }
        .share-btn:hover { transform: translateY(-1px); opacity: 0.9; }
        .facebook { background: #1877f2; }
        .whatsapp { background: #25d366; }
        .twitter { background: #1da1f2; }
        .copy { background: #6c757d; font-family: inherit; }
    `]
})
export class SocialShareComponent {
    @Input() url: string = '';
    @Input() title: string = '';
    copied = false;

    get facebookUrl(): string {
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.url)}`;
    }
    get whatsappUrl(): string {
        return `https://wa.me/?text=${encodeURIComponent(this.title + ' ' + this.url)}`;
    }
    get twitterUrl(): string {
        return `https://twitter.com/intent/tweet?url=${encodeURIComponent(this.url)}&text=${encodeURIComponent(this.title)}`;
    }

    copyLink(): void {
        navigator.clipboard.writeText(this.url).then(() => {
            this.copied = true;
            setTimeout(() => this.copied = false, 2000);
        });
    }
}
