import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable, map } from "rxjs";
import { Publication } from "../models/publication.model";
import { AuthService } from "./auth.service";
import { environment } from "../../environments/environment";

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface DashboardStats {
    total: number;
    reportages: number;
    agroEchos: number;
}

@Injectable({
    providedIn: "root",
})
export class PublicationService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private apiUrl = `${environment.apiUrl}/publications`;

    private getAuthHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        });
    }

    // Get all publications (legacy compatibility - returns flat array)
    getPublications(): Observable<Publication[]> {
        return this.http.get<PaginatedResponse<Publication>>(this.apiUrl, {
            params: { limit: '1000' }
        }).pipe(map(res => res.data));
    }

    // Get paginated publications with filters
    getPublicationsPaginated(options: {
        page?: number;
        limit?: number;
        type?: string;
        search?: string;
        userId?: string;
    } = {}): Observable<PaginatedResponse<Publication>> {
        let params = new HttpParams();
        if (options.page) params = params.set('page', options.page.toString());
        if (options.limit) params = params.set('limit', options.limit.toString());
        if (options.type) params = params.set('type', options.type);
        if (options.search) params = params.set('search', options.search);
        if (options.userId) params = params.set('userId', options.userId);

        return this.http.get<PaginatedResponse<Publication>>(this.apiUrl, { params });
    }

    getPublicationById(id: string): Observable<Publication> {
        return this.http.get<Publication>(`${this.apiUrl}/${id}`);
    }

    // Dashboard stats
    getStats(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${environment.apiUrl}/stats`, {
            headers: this.getAuthHeaders()
        });
    }

    addPublication(
        publicationData: any,
        photos: FileList | null
    ): Observable<Publication> {
        const formData = new FormData();
        Object.keys(publicationData).forEach(key => {
            let value = publicationData[key];
            if (value instanceof Date) {
                if (!isNaN(value.getTime())) {
                    value = value.toISOString();
                } else {
                    return; // Skip invalid dates
                }
            }
            if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });
        
        if (photos && photos.length > 0) {
            Array.from(photos).forEach((file) => {
                formData.append('photos', file);
            });
        }

        return this.http.post<Publication>(this.apiUrl, formData, { headers: this.getAuthHeaders() });
    }

    updatePublication(
        id: string,
        publicationData: any,
        photos: FileList | null
    ): Observable<Publication> {
        const formData = new FormData();
        Object.keys(publicationData).forEach(key => {
            let value = publicationData[key];
            if (value instanceof Date) {
                if (!isNaN(value.getTime())) {
                    value = value.toISOString();
                } else {
                    return; // Skip invalid dates
                }
            }
            if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });
        
        if (photos) {
            Array.from(photos).forEach((file) => {
                formData.append('photos', file);
            });
        }

        return this.http.put<Publication>(`${this.apiUrl}/${id}`, formData, { headers: this.getAuthHeaders() });
    }

    deletePublication(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
    }

    // Shared utility: get image URL
    getImageUrl(path: string): string {
        if (!path) return 'assets/placeholder-image.jpg';
        if (path.startsWith('http')) return path;
        return `${environment.baseUrl}${path}`;
    }
}
