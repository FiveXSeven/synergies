import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-back-to-top',
    standalone: true,
    imports: [CommonModule],
    template: `
        <button 
            class="back-to-top" 
            [class.visible]="isVisible" 
            (click)="scrollToTop()"
            aria-label="Retour en haut">
            <i class="fas fa-arrow-up"></i>
        </button>
    `,
    styles: [`
        .back-to-top {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #2e7d32; /* Hardcoded to ensure visibility */
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            opacity: 0;
            visibility: hidden;
            transform: translateY(20px);
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            z-index: 1000;
        }

        .back-to-top.visible {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .back-to-top:hover {
            background: #8bc34a; /* Hardcoded secondary color */
            transform: translateY(-5px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        }

        @media (max-width: 768px) {
            .back-to-top {
                bottom: 20px;
                right: 20px;
                width: 40px;
                height: 40px;
            }
        }
    `]
})
export class BackToTopComponent {
    isVisible = false;

    @HostListener('window:scroll')
    onWindowScroll() {
        this.isVisible = window.scrollY > 400;
    }

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}
