import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NgIf } from "@angular/common";
import { AuthService } from "../../services/auth.service";
import { Router } from "@angular/router";
import { TranslatePipe } from "../../pipes/translate.pipe";
import { SeoService } from "../../services/seo.service";

@Component({
    selector: "app-login-page",
    standalone: true,
    imports: [FormsModule, NgIf, TranslatePipe],
    templateUrl: "./login-page.component.html",
    styleUrl: "./login-page.component.scss",
})
export class LoginPageComponent {
    authService = inject(AuthService);
    router = inject(Router);
    private seo = inject(SeoService);

    email: string = "";
    pin: string = "";
    name: string = "";
    mode: 'login' | 'register' = 'login';
    loading: boolean = false;
    error: string = "";

    constructor() {
        this.seo.setPageMeta('Connexion', 'Connectez-vous à Synergies Africa');
    }

    toggleMode(): void {
        this.mode = this.mode === 'login' ? 'register' : 'login';
        this.error = "";
    }

    onSubmit(): void {
        if (!this.email || !this.pin) return;
        this.loading = true;
        this.error = "";

        const action = this.mode === 'login' 
            ? this.authService.login(this.email, this.pin)
            : this.authService.register(this.email, this.pin, this.name);

        action.subscribe({
            next: () => {
                this.router.navigate(["/board"]);
                this.loading = false;
            },
            error: (err) => {
                this.error = err.error?.error || "Une erreur est survenue";
                this.loading = false;
            }
        });
    }
}
