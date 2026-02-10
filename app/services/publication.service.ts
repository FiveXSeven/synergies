import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, map } from "rxjs";
import { Publication } from "../models/publication.model";
import { AuthService } from "./auth.service";

@Injectable({
    providedIn: "root",
})
export class PublicationService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private apiUrl = 'http://localhost:3000/api/publications';

    getPublications(): Observable<Publication[]> {
        return this.http.get<Publication[]>(this.apiUrl);
    }

    getPublicationById(id: string): Observable<Publication> {
        return this.http.get<Publication>(`${this.apiUrl}/${id}`);
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

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        });

        return this.http.post<Publication>(this.apiUrl, formData, { headers });
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

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        });

        return this.http.put<Publication>(`${this.apiUrl}/${id}`, formData, { headers });
    }

    deletePublication(id: string): Observable<any> {
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        });
        return this.http.delete(`${this.apiUrl}/${id}`, { headers });
    }
}
