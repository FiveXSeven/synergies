import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CommentService, Comment } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-comment-section',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslatePipe],
    template: `
        <section class="comments-section">
            <h3><i class="fas fa-comments"></i> {{ 'comments.title' | translate }} ({{ comments.length }})</h3>

            <!-- Add Comment Form -->
            <form class="comment-form" (ngSubmit)="submitComment()">
                <div class="form-row">
                    <input type="text" [(ngModel)]="authorName" name="authorName"
                        [placeholder]="'comments.name' | translate" required class="comment-name-input">
                </div>
                <div class="form-row">
                    <textarea [(ngModel)]="commentText" name="commentText"
                        [placeholder]="'comments.placeholder' | translate" required rows="3" class="comment-textarea"></textarea>
                </div>
                <button type="submit" class="btn-comment" [disabled]="isPosting || !authorName.trim() || !commentText.trim()">
                    <i class="fas" [class.fa-paper-plane]="!isPosting" [class.fa-spinner]="isPosting" [class.fa-spin]="isPosting"></i>
                    {{ isPosting ? ('comments.posting' | translate) : ('comments.submit' | translate) }}
                </button>
            </form>

            <!-- Comments List -->
            <div class="comments-list">
                <div *ngFor="let comment of comments" class="comment-card">
                    <div class="comment-header">
                        <div class="comment-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="comment-meta">
                            <strong>{{ comment.authorName }}</strong>
                            <span class="comment-date">{{ comment.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
                        </div>
                        <button *ngIf="isAdmin" class="btn-delete-comment" 
                                (click)="confirmDelete(comment)"
                                title="Supprimer ce commentaire">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                    <p class="comment-body">{{ comment.content }}</p>
                </div>

                <div *ngIf="comments.length === 0" class="empty-comments">
                    <i class="far fa-comment-dots"></i>
                    <p>{{ 'comments.empty' | translate }}</p>
                </div>
            </div>

            <!-- Delete Confirmation Dialog -->
            <div class="dialog-overlay" *ngIf="commentToDelete" (click)="cancelDelete()">
                <div class="dialog-box" (click)="$event.stopPropagation()">
                    <div class="dialog-icon dialog-icon-danger">
                        <i class="fas fa-trash-alt"></i>
                    </div>
                    <h4>Supprimer le commentaire</h4>
                    <p>Voulez-vous supprimer le commentaire de <strong>{{ commentToDelete.authorName }}</strong> ?</p>
                    <div class="dialog-actions">
                        <button class="dialog-btn dialog-btn-cancel" (click)="cancelDelete()">Annuler</button>
                        <button class="dialog-btn dialog-btn-danger" (click)="executeDelete()" [disabled]="deletingId">
                            <i class="fas" [class.fa-trash-alt]="!deletingId" [class.fa-spinner]="deletingId" [class.fa-spin]="deletingId"></i>
                            {{ deletingId ? 'Suppression...' : 'Supprimer' }}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    `,
    styles: [`
        .comments-section {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 2px solid #e9ecef;
        }
        h3 {
            font-size: 1.3rem;
            color: #1b4332;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .comment-form {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 1.25rem;
            margin-bottom: 2rem;
        }
        .form-row { margin-bottom: 0.75rem; }
        .comment-name-input, .comment-textarea {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            font-family: inherit;
            font-size: 0.95rem;
            transition: border-color 0.2s;
            box-sizing: border-box;
        }
        .comment-name-input:focus, .comment-textarea:focus {
            outline: none;
            border-color: #2d6a4f;
        }
        .comment-textarea { resize: vertical; min-height: 80px; }
        .btn-comment {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.65rem 1.5rem;
            background: linear-gradient(135deg, #2d6a4f, #52b788);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
            transition: transform 0.15s, opacity 0.15s;
        }
        .btn-comment:hover:not(:disabled) { transform: translateY(-1px); }
        .btn-comment:disabled { opacity: 0.5; cursor: not-allowed; }
        .comments-list { display: flex; flex-direction: column; gap: 1rem; }
        .comment-card {
            padding: 1rem 1.25rem;
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 10px;
            transition: box-shadow 0.2s;
        }
        .comment-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .comment-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
        }
        .comment-avatar { font-size: 1.8rem; color: #52b788; }
        .comment-meta { display: flex; flex-direction: column; flex: 1; }
        .comment-meta strong { color: #1b4332; font-size: 0.95rem; }
        .comment-date { font-size: 0.8rem; color: #6c757d; }
        .comment-body { color: #495057; line-height: 1.6; margin: 0; }
        .empty-comments {
            text-align: center;
            padding: 2rem;
            color: #6c757d;
        }
        .empty-comments i { font-size: 2.5rem; color: #dee2e6; display: block; margin-bottom: 0.75rem; }
        
        /* Admin delete button */
        .btn-delete-comment {
            background: none;
            border: none;
            color: #adb5bd;
            font-size: 0.9rem;
            cursor: pointer;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            margin-left: auto;
        }
        .btn-delete-comment:hover:not(:disabled) {
            background: rgba(229, 62, 62, 0.1);
            color: #e53e3e;
        }
        .btn-delete-comment:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* Dialog overlay & box */
        .dialog-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: fadeIn 0.2s ease;
        }
        .dialog-box {
            background: white;
            border-radius: 20px;
            padding: 2.5rem 2rem 2rem;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15);
            animation: scaleIn 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .dialog-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
        }
        .dialog-icon-danger {
            background: linear-gradient(135deg, rgba(229, 62, 62, 0.1), rgba(229, 62, 62, 0.2));
        }
        .dialog-icon-danger i { font-size: 1.5rem; color: #e53e3e; }
        .dialog-box h4 {
            font-size: 1.3rem;
            font-weight: 700;
            color: #1a202c;
            margin: 0 0 0.5rem;
        }
        .dialog-box p {
            color: #718096;
            font-size: 0.95rem;
            line-height: 1.5;
            margin: 0 0 2rem;
        }
        .dialog-box p strong { color: #2d3748; }
        .dialog-actions {
            display: flex;
            gap: 0.8rem;
        }
        .dialog-btn {
            flex: 1;
            padding: 0.85rem 1.2rem;
            border-radius: 12px;
            font-weight: 600;
            font-size: 0.95rem;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        .dialog-btn-cancel {
            background: #f7fafc;
            color: #4a5568;
            border: 1px solid #e2e8f0;
        }
        .dialog-btn-cancel:hover { background: #edf2f7; }
        .dialog-btn-danger {
            background: #e53e3e;
            color: white;
            box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
        }
        .dialog-btn-danger:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(229, 62, 62, 0.4);
        }
        .dialog-btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
        }
    `]
})
export class CommentSectionComponent implements OnInit {
    @Input() publicationId: string = '';
    private commentService = inject(CommentService);
    private authService = inject(AuthService);

    comments: Comment[] = [];
    authorName = '';
    commentText = '';
    isPosting = false;
    deletingId: string | null = null;
    commentToDelete: Comment | null = null;

    get isAdmin(): boolean {
        const user = this.authService.currentUserValue;
        return !!user && user.role === 'admin';
    }

    ngOnInit(): void {
        this.loadComments();
    }

    loadComments(): void {
        if (this.publicationId) {
            this.commentService.getComments(this.publicationId).subscribe({
                next: (data) => this.comments = data,
                error: () => {}
            });
        }
    }

    submitComment(): void {
        if (!this.authorName.trim() || !this.commentText.trim() || !this.publicationId) return;
        this.isPosting = true;
        this.commentService.addComment(this.publicationId, this.authorName.trim(), this.commentText.trim()).subscribe({
            next: (comment) => {
                this.comments.unshift(comment);
                this.commentText = '';
                this.isPosting = false;
            },
            error: () => {
                this.isPosting = false;
            }
        });
    }

    confirmDelete(comment: Comment): void {
        this.commentToDelete = comment;
    }

    cancelDelete(): void {
        this.commentToDelete = null;
        this.deletingId = null;
    }

    executeDelete(): void {
        if (!this.commentToDelete?.id) return;
        this.deletingId = this.commentToDelete.id;
        this.commentService.deleteComment(this.commentToDelete.id).subscribe({
            next: () => {
                this.comments = this.comments.filter(c => c.id !== this.commentToDelete?.id);
                this.commentToDelete = null;
                this.deletingId = null;
            },
            error: () => {
                this.deletingId = null;
            }
        });
    }
}

