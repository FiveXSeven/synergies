import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SeoService } from '../../services/seo.service';

@Component({
    selector: 'app-not-found',
    standalone: true,
    imports: [RouterLink, TranslatePipe],
    template: `
        <div class="not-found-container">
            <div class="not-found-card">
                <div class="not-found-icon">
                    <span>404</span>
                </div>
                <h1>{{ 'notfound.title' | translate }}</h1>
                <p>{{ 'notfound.desc' | translate }}</p>
                <a routerLink="/" class="btn-back">
                    <i class="fas fa-home"></i> {{ 'notfound.back' | translate }}
                </a>
            </div>
        </div>
    `,
    styles: [`
        .not-found-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 70vh;
            padding: 2rem;
        }
        .not-found-card {
            text-align: center;
            max-width: 480px;
        }
        .not-found-icon {
            margin-bottom: 1.5rem;
        }
        .not-found-icon span {
            font-size: 6rem;
            font-weight: 900;
            background: linear-gradient(135deg, #2d6a4f, #52b788);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        h1 {
            font-size: 1.8rem;
            color: #1b4332;
            margin-bottom: 0.75rem;
        }
        p {
            color: #6c757d;
            margin-bottom: 2rem;
            font-size: 1.05rem;
        }
        .btn-back {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.85rem 2rem;
            background: linear-gradient(135deg, #2d6a4f, #52b788);
            color: white;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-back:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(45,106,79,0.4);
        }
    `]
})
export class NotFoundComponent {
    private seo = inject(SeoService);
    constructor() {
        this.seo.setPageMeta('404', 'Page introuvable');
    }
}
