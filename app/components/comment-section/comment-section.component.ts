import { Component, Input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CommentService, Comment } from '../../services/comment.service';

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
                    </div>
                    <p class="comment-body">{{ comment.content }}</p>
                </div>

                <div *ngIf="comments.length === 0" class="empty-comments">
                    <i class="far fa-comment-dots"></i>
                    <p>{{ 'comments.empty' | translate }}</p>
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
        .comment-meta { display: flex; flex-direction: column; }
        .comment-meta strong { color: #1b4332; font-size: 0.95rem; }
        .comment-date { font-size: 0.8rem; color: #6c757d; }
        .comment-body { color: #495057; line-height: 1.6; margin: 0; }
        .empty-comments {
            text-align: center;
            padding: 2rem;
            color: #6c757d;
        }
        .empty-comments i { font-size: 2.5rem; color: #dee2e6; display: block; margin-bottom: 0.75rem; }
    `]
})
export class CommentSectionComponent implements OnInit {
    @Input() publicationId: string = '';
    private commentService = inject(CommentService);

    comments: Comment[] = [];
    authorName = '';
    commentText = '';
    isPosting = false;

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
}
