import { Component, OnInit } from "@angular/core";
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
    FormControl,
} from "@angular/forms";
import { PublicationService } from "../../services/publication.service";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
@Component({
    selector: "app-create-publication-pages",
    imports: [ReactiveFormsModule, CommonModule],
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
        private router: Router // Optionnel
    ) {
        this.publicationForm = this.fb.group({
            title: ["", Validators.required],
            type: ["", Validators.required],
            description: ["", Validators.required],
            content: ["", Validators.required],
            location: ["", Validators.required],
            date: ["", Validators.required],
            photos: [null, [Validators.required, this.maxFilesValidator(4)]], // Validateur pour les photos
        });
    }

    ngOnInit(): void {}

    // Validateur personnalisé pour le nombre maximum de fichiers
    maxFilesValidator(max: number) {
        return (control: FormControl): { [key: string]: any } | null => {
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
        // Mettre à jour la valeur du contrôle 'photos' pour que la validation fonctionne
        this.publicationForm.patchValue({ photos: this.selectedFiles });
        this.publicationForm.get("photos")?.updateValueAndValidity();
    }

    async onSubmit(): Promise<void> {
        this.errorMessage = null;
        this.successMessage = null;

        if (this.publicationForm.invalid) {
            this.markAllAsTouched();
            this.errorMessage =
                "Veuillez corriger les erreurs dans le formulaire.";
            return;
        }

        if (!this.selectedFiles || this.selectedFiles.length === 0) {
            this.errorMessage = "Veuillez sélectionner au moins une photo.";
            this.publicationForm.get("photos")?.setErrors({ required: true });
            return;
        }

        this.isLoading = true;

        try {
            const formValue = this.publicationForm.value;
            const publicationData = {
                title: formValue.title,
                type: formValue.type,
                description: formValue.description,
                content: formValue.content,
                location: formValue.location,
                eventDate: new Date(formValue.date), // Convertir la chaîne de date en objet Date
            };

            await this.publicationService.addPublication(
                publicationData,
                this.selectedFiles
            );
            this.successMessage = "Publication ajoutée avec succès !";
            this.publicationForm.reset();
            this.selectedFiles = null;
            // Optionnel: rediriger l'utilisateur
            // this.router.navigate(['/']);
        } catch (error: any) {
            console.error("Erreur lors de la publication:", error);
            this.errorMessage = `Erreur lors de la publication: ${
                error.message || error
            }`;
        } finally {
            this.isLoading = false;
        }
    }

    // Marquer tous les champs comme "touchés" pour afficher les erreurs de validation
    private markAllAsTouched(): void {
        Object.values(this.publicationForm.controls).forEach((control) => {
            control.markAsTouched();
        });
    }
}
