import { Component, OnInit } from "@angular/core";
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
} from "@angular/forms";
import { PublicationService } from "../../services/publication.service";
import { AuthService } from "../../services/auth.service";
import { CommonModule } from "@angular/common";
import { Router, RouterLink, ActivatedRoute } from "@angular/router";
import { TranslatePipe } from "../../pipes/translate.pipe";
import { SeoService } from "../../services/seo.service";

@Component({
    selector: "app-create-publication-pages",
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, RouterLink, TranslatePipe],
    templateUrl: "./create-publication-pages.component.html",
    styleUrl: "./create-publication-pages.component.scss",
})
export class CreatePublicationPagesComponent implements OnInit {
    publicationForm: FormGroup;
    selectedFiles: FileList | null = null;
    imagePreviews: string[] = [];
    isLoading = false;
    errorMessage: string | null = null;
    successMessage: string | null = null;

    isEditMode = false;
    publicationId: string | null = null;

    constructor(
        private fb: FormBuilder,
        private publicationService: PublicationService,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private seo: SeoService
    ) {
        const today = new Date().toISOString().split('T')[0];
        this.publicationForm = this.fb.group({
            title: ["", Validators.required],
            type: ["", Validators.required],
            description: ["", Validators.required],
            content: ["", Validators.required],
            location: ["", Validators.required],
            date: [today, Validators.required],
            photos: [null, [Validators.required, this.maxFilesValidator(4)]],
        });
        this.seo.setPageMeta('Nouvelle Publication', 'Créez une nouvelle publication');
    }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.publicationId = params['id'];
                this.loadPublication(this.publicationId!);
                this.seo.setPageMeta('Modifier Publication', 'Modifier votre publication');
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
                // Show existing images as previews
                if (pub.photoUrls && pub.photoUrls.length > 0) {
                    this.imagePreviews = pub.photoUrls.map(p => this.publicationService.getImageUrl(p));
                }
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
        try {
            this.errorMessage = null;
            this.successMessage = null;

            if (this.publicationForm.invalid) {
                this.markAllAsTouched();
                this.errorMessage = "Veuillez corriger les erreurs dans le formulaire.";
                return;
            }

            if (!this.isEditMode && (!this.selectedFiles || this.selectedFiles.length === 0)) {
                this.errorMessage = "Veuillez sélectionner au moins une photo.";
                this.publicationForm.get("photos")?.setErrors({ required: true });
                return;
            }

            this.isLoading = true;
            const formValue = this.publicationForm.value;
            
            const evtDate = new Date(formValue.date);
            if (isNaN(evtDate.getTime())) {
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

            const action = this.isEditMode 
                ? this.publicationService.updatePublication(this.publicationId!, publicationData, this.selectedFiles)
                : this.publicationService.addPublication(publicationData, this.selectedFiles);

            action.subscribe({
                next: () => {
                    this.successMessage = this.isEditMode ? "Publication mise à jour !" : "Publication ajoutée !";
                    if (!this.isEditMode) {
                        this.publicationForm.reset();
                        this.selectedFiles = null;
                        this.imagePreviews = [];
                    }
                    this.isLoading = false;
                    setTimeout(() => this.router.navigate(['/board']), 1500);
                },
                error: (error: any) => {
                    this.errorMessage = `Erreur: ${error.error?.error || error.message || "Une erreur inconnue est survenue"}`;
                    this.isLoading = false;
                }
            });
        } catch (err) {
            this.errorMessage = "Une erreur critique est survenue lors de l'envoi du formulaire.";
            this.isLoading = false;
        }
    }

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
        this.publicationForm.patchValue({ photos: this.selectedFiles });
        this.publicationForm.get("photos")?.updateValueAndValidity();
        // Generate previews
        this.imagePreviews = [];
        if (this.selectedFiles) {
            Array.from(this.selectedFiles).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    this.imagePreviews.push(e.target.result);
                };
                reader.readAsDataURL(file);
            });
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            this.selectedFiles = files;
            this.publicationForm.patchValue({ photos: this.selectedFiles });
            this.publicationForm.get("photos")?.updateValueAndValidity();
            // Generate previews
            this.imagePreviews = [];
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    this.imagePreviews.push(e.target.result);
                };
                reader.readAsDataURL(file);
            });
        }
    }

    removePreview(index: number): void {
        this.imagePreviews.splice(index, 1);
        // Note: Can't modify FileList directly, but preview removal gives visual feedback
    }

    private markAllAsTouched(): void {
        Object.values(this.publicationForm.controls).forEach((control) => {
            control.markAsTouched();
        });
    }
}
