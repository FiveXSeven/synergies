import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
    selector: 'app-pagination',
    standalone: true,
    imports: [CommonModule, TranslatePipe],
    template: `
        <div class="pagination" *ngIf="totalPages > 1">
            <button class="page-btn prev" [disabled]="currentPage === 1" (click)="goToPage(currentPage - 1)">
                <i class="fas fa-chevron-left"></i> {{ 'pagination.prev' | translate }}
            </button>
            <div class="page-numbers">
                <button *ngFor="let page of visiblePages" class="page-num"
                    [class.active]="page === currentPage"
                    [class.dots]="page === -1"
                    [disabled]="page === -1"
                    (click)="page !== -1 && goToPage(page)">
                    {{ page === -1 ? '...' : page }}
                </button>
            </div>
            <button class="page-btn next" [disabled]="currentPage === totalPages" (click)="goToPage(currentPage + 1)">
                {{ 'pagination.next' | translate }} <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `,
    styles: [`
        .pagination {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 2rem 0;
            flex-wrap: wrap;
        }
        .page-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.6rem 1.2rem;
            border: 2px solid #2d6a4f;
            background: transparent;
            color: #2d6a4f;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
        }
        .page-btn:hover:not(:disabled) { background: #2d6a4f; color: white; }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .page-numbers { display: flex; gap: 0.3rem; }
        .page-num {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #dee2e6;
            background: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            color: #495057;
            transition: all 0.2s;
            font-family: inherit;
        }
        .page-num:hover:not(.active):not(.dots) { border-color: #2d6a4f; color: #2d6a4f; }
        .page-num.active { background: #2d6a4f; color: white; border-color: #2d6a4f; }
        .page-num.dots { border: none; cursor: default; background: transparent; }
    `]
})
export class PaginationComponent {
    @Input() currentPage = 1;
    @Input() totalPages = 1;
    @Output() pageChange = new EventEmitter<number>();

    get visiblePages(): number[] {
        const pages: number[] = [];
        const total = this.totalPages;
        const current = this.currentPage;

        if (total <= 7) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            pages.push(1);
            if (current > 3) pages.push(-1);
            const start = Math.max(2, current - 1);
            const end = Math.min(total - 1, current + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (current < total - 2) pages.push(-1);
            pages.push(total);
        }
        return pages;
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.pageChange.emit(page);
        }
    }
}
