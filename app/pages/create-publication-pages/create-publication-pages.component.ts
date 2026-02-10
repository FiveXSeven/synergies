import { Component, OnInit } from "@angular/core";
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
    FormControl,
} from "@angular/forms";
import { PublicationService } from "../../services/publication.service";
import { AuthService } from "../../services/auth.service";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
@Component({
    selector: "app-create-publication-pages",
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, RouterLink],
    templateUrl: "./create-publication-pages.component.html",
    styleUrl: "./create-publication-pages.component.scss",
})
export class CreatePublicationPagesComponent implements OnInit {
    publicationForm: FormGroup;
    selectedFiles: FileList | null = null;
    isLoading = false;
    errorMessage: string | null = null;
    successMessage: string | null = null;

    constructor(
        private fb: FormBuilder,
        private publicationService: PublicationService,
        private authService: AuthService,
        private router: Router
    ) {
        const today = new Date().toISOString().split('T')[0];
        this.publicationForm = this.fb.group({
            title: ["", Validators.required],
            type: ["", Validators.required],
            description: ["", Validators.required],
            content: ["", Validators.required],
            location: ["", Validators.required],
            date: [today, Validators.required],
            photos: [null, [Validators.required, this.maxFilesValidator(4)]], // Validateur pour les photos
        });
    }

    isEditMode = false;
    publicationId: string | null = null;

    ngOnInit(): void {
        this.router.routerState.root.queryParams.subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.publicationId = params['id'];
                this.loadPublication(this.publicationId!);
            }
        });
    }

    loadPublication(id: string): void {
        this.isLoading = true;
        this.publicationService.getPublicationById(id).subscribe({
            next: (pub) => {
                this.publicationForm.patchValue({
                    title: pub.title,
                    type: pub.type,
                    description: pub.description,
                    content: pub.content,
                    location: pub.location,
                    date: this.formatDate(pub.eventDate)
                });
                // In edit mode, photos are optional
                this.publicationForm.get('photos')?.clearValidators();
                this.publicationForm.get('photos')?.setValidators([this.maxFilesValidator(4)]);
                this.publicationForm.get('photos')?.updateValueAndValidity();
                this.isLoading = false;
            },
            error: () => {
                this.errorMessage = "Erreur lors du chargement de la publication.";
                this.isLoading = false;
            }
        });
    }

    private formatDate(date: any): string {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    async onSubmit(event?: Event): Promise<void> {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        console.log('onSubmit triggered');
        try {
            this.errorMessage = null;
            this.successMessage = null;

            if (this.publicationForm.invalid) {
                console.warn('Form validation failed:');
                Object.keys(this.publicationForm.controls).forEach(key => {
                    const control = this.publicationForm.get(key);
                    if (control?.invalid) {
                        console.log(`- Control '${key}' is invalid. Errors:`, control.errors);
                    }
                });
                this.markAllAsTouched();
                this.errorMessage = "Veuillez corriger les erreurs dans le formulaire.";
                return;
            }

            if (!this.isEditMode && (!this.selectedFiles || this.selectedFiles.length === 0)) {
                console.log('No files selected in create mode');
                this.errorMessage = "Veuillez sélectionner au moins une photo.";
                this.publicationForm.get("photos")?.setErrors({ required: true });
                return;
            }

            this.isLoading = true;
            console.log('Loading set to true, processing data...');
            const formValue = this.publicationForm.value;
            
            // Validate date
            const evtDate = new Date(formValue.date);
            if (isNaN(evtDate.getTime())) {
                console.error('Invalid date entered:', formValue.date);
                this.errorMessage = "La date saisie est invalide.";
                this.isLoading = false;
                return;
            }

            const publicationData = {
                title: formValue.title,
                type: formValue.type,
                description: formValue.description,
                content: formValue.content,
                location: formValue.location,
                eventDate: evtDate,
                userDisplayName: this.authService.currentUserValue?.name || this.authService.currentUserValue?.email || 'Anonyme'
            };

            console.log('Sending publication data:', publicationData);
            console.log('Files to upload:', this.selectedFiles);

            const action = this.isEditMode 
                ? this.publicationService.updatePublication(this.publicationId!, publicationData, this.selectedFiles)
                : this.publicationService.addPublication(publicationData, this.selectedFiles);

            action.subscribe({
                next: (res) => {
                    console.log('Publication action successful:', res);
                    this.successMessage = this.isEditMode ? "Publication mise à jour !" : "Publication ajoutée !";
                    if (!this.isEditMode) {
                        this.publicationForm.reset();
                        this.selectedFiles = null;
                    }
                    this.isLoading = false;
                    setTimeout(() => this.router.navigate(['/board']), 1500);
                },
                error: (error: any) => {
                    console.error('API Error details:', error);
                    this.errorMessage = `Erreur: ${error.error?.error || error.message || "Une erreur inconnue est survenue"}`;
                    this.isLoading = false;
                }
            });
        } catch (err) {
            console.error('Submission crash details:', err);
            this.errorMessage = "Une erreur critique est survenue lors de l'envoi du formulaire.";
            this.isLoading = false;
        }
    }

    // Validateur personnalisé pour le nombre maximum de fichiers
    maxFilesValidator(max: number) {
        return (control: any): { [key: string]: any } | null => {
            const files = control.value as FileList;
            if (files && files.length > max) {
                return { maxFilesExceeded: true };
            }
            return null;
        };
    }

    onFileSelected(event: Event): void {
        const element = event.currentTarget as HTMLInputElement;
        this.selectedFiles = element.files;
        console.log('Files selected:', this.selectedFiles);
        this.publicationForm.patchValue({ photos: this.selectedFiles });
        this.publicationForm.get("photos")?.updateValueAndValidity();
    }

    // Marquer tous les champs comme "touchés"
    private markAllAsTouched(): void {
        Object.values(this.publicationForm.controls).forEach((control) => {
            control.markAsTouched();
        });
    }
}
