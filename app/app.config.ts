import {
    ApplicationConfig,
    provideZoneChangeDetection,
    LOCALE_ID,
    EnvironmentProviders,
} from "@angular/core";
import { provideRouter, withInMemoryScrolling } from "@angular/router";
import { routes } from "./app.routes";
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { getAuth, provideAuth } from "@angular/fire/auth";
import { environment } from "../environments/environment";

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(
            routes,
            withInMemoryScrolling({
                // Ajoutez cette fonction
                scrollPositionRestoration: "top", // Option clé pour remonter en haut
                anchorScrolling: "enabled", // Optionnel: pour gérer le défilement vers les ancres #
            })
        ),
        { provide: LOCALE_ID, useValue: "fr-FR" },

        importProvidersFrom([
            provideFirebaseApp(() => initializeApp(environment.firebase)),
            provideAuth(() => getAuth()),
            // provideFirestore(() => getFirestore()),
            // provideStorage(() => getStorage()),
        ]),
    ],
};
function importProvidersFrom(
    arg0: EnvironmentProviders[]
):
    | import("@angular/core").Provider
    | import("@angular/core").EnvironmentProviders {
    throw new Error("Function not implemented.");
}
