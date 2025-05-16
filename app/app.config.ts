import {
    ApplicationConfig,
    provideZoneChangeDetection,
    LOCALE_ID,
    // EnvironmentProviders, // Plus besoin d'importer explicitement si non utilisé ailleurs
    // importProvidersFrom, // Plus besoin de celui-ci pour Firebase ici
} from "@angular/core";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { routes } from "./app.routes";

// Imports pour Firebase (provider functions)
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { getAuth, provideAuth } from "@angular/fire/auth";
// Si vous utilisez Firestore plus tard :
// import { getFirestore, provideFirestore } from '@angular/fire/firestore';
// Si vous utilisez Storage plus tard :
// import { getStorage, provideStorage } from '@angular/fire/storage';

import { environment } from "../environments/environment";

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(
            routes,
            withInMemoryScrolling({
                scrollPositionRestoration: "top",
                anchorScrolling: "enabled",
            })
        ),
        { provide: LOCALE_ID, useValue: "fr-FR" },

        // Intégration directe des providers Firebase
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideAuth(() => getAuth()),
        // provideFirestore(() => getFirestore()), // Décommentez si vous utilisez Firestore
        // provideStorage(() => getStorage())      // Décommentez si vous utilisez Storage
    ],
};
