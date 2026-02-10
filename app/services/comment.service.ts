import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Comment {
    id?: string;
    publicationId: string;
    authorName: string;
    content: string;
    createdAt?: Date | string;
}

@Injectable({ providedIn: 'root' })
export class CommentService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    getComments(publicationId: string): Observable<Comment[]> {
        return this.http.get<Comment[]>(`${this.apiUrl}/publications/${publicationId}/comments`);
    }

    addComment(publicationId: string, authorName: string, content: string): Observable<Comment> {
        return this.http.post<Comment>(`${this.apiUrl}/publications/${publicationId}/comments`, {
            authorName,
            content
        });
    }
}
